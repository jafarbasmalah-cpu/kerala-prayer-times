/* Kerala Prayer Times – main application (Android & iOS via Capacitor; also runs in a browser). */
(function () {
  "use strict";
  var D = window.KPT_DATA, DIST = D.DISTRICTS, PR = D.PRAYERS, ADH = D.ADHANS, DK = window.KPT_ADHKAR;
  var Cap = window.Capacitor;
  var isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  var platform = Cap && Cap.getPlatform ? Cap.getPlatform() : "web";
  function plugin(n) {
    if (!isNative) return null;
    try { return (Cap.Plugins && Cap.Plugins[n]) || (Cap.registerPlugin ? Cap.registerPlugin(n) : null); } catch (e) { return null; }
  }
  var LN = plugin("LocalNotifications"), GEO = plugin("Geolocation"), PREF = plugin("Preferences"),
    APP = plugin("App"), HAP = plugin("Haptics"), SB = plugin("StatusBar");
  var FIVE = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
  var CH = "v1";

  /* ---------------- Settings ---------------- */
  var DEF = {
    v: 3, lang: "en", district: null, gps: null, method: "karachi", asr: 1,
    adj: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }, hijriAdj: 0, fmt: "12", theme: "auto",
    sound: "makkah", fajrSound: "fajr_makkah",
    modes: { fajr: "adhan", sunrise: "off", dhuhr: "adhan", asr: "adhan", maghrib: "adhan", isha: "adhan" }, pre: 0
  };
  var S = null;
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function merge(def, o) {
    var r = clone(def);
    Object.keys(o || {}).forEach(function (k) {
      if (r[k] && typeof r[k] === "object" && !Array.isArray(r[k]) && o[k] && typeof o[k] === "object") Object.assign(r[k], o[k]);
      else r[k] = o[k];
    });
    return r;
  }
  async function load() {
    var raw = null;
    if (PREF) { try { raw = (await PREF.get({ key: "kpt_settings" })).value; } catch (e) { } }
    if (!raw) { try { raw = localStorage.getItem("kpt_settings"); } catch (e) { } }
    var o = {}; try { o = JSON.parse(raw) || {}; } catch (e) { o = {}; }
    S = merge(DEF, o);
    var q = new URLSearchParams(location.search);           // ?district=9&lang=ml&tab=qibla (testing / deep links)
    if (q.has("district")) S.district = +q.get("district");
    if (q.has("lang")) S.lang = q.get("lang");
    if (q.has("theme")) S.theme = q.get("theme");
    if (q.has("tab")) UI.tab = q.get("tab");
  }
  function save(silent) {
    var raw = JSON.stringify(S);
    try { localStorage.setItem("kpt_settings", raw); } catch (e) { }
    if (PREF) PREF.set({ key: "kpt_settings", value: raw }).catch(function () { });
    if (!silent) reschedule();
  }

  /* ---------------- Helpers ---------------- */
  var UI = { tab: "home", view: null, mode: "day", dkPrayer: null, counts: {}, sheet: null, notifOff: false, exactOff: false, avail: {} };
  function t(k) { return (D.T[S.lang] && D.T[S.lang][k]) || D.T.en[k] || k; }
  function L(o) { return S.lang === "ml" ? (o.ml || o.en) : o.en; }
  function $(s) { return document.querySelector(s); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function place() {
    if (S.district === -1 && S.gps) return { en: t("myLocation"), ml: D.T.ml.myLocation, lat: S.gps[0], lng: S.gps[1], gps: true };
    return DIST[S.district] || DIST[9];
  }
  function tz() { return place().gps ? -new Date().getTimezoneOffset() / 60 : 5.5; }
  function nowL() {
    var n = new Date(Date.now() + tz() * 3600000);
    return { y: n.getUTCFullYear(), m: n.getUTCMonth() + 1, d: n.getUTCDate(), secs: n.getUTCHours() * 3600 + n.getUTCMinutes() * 60 + n.getUTCSeconds() };
  }
  function shift(o, k) { var x = new Date(Date.UTC(o.y, o.m - 1, o.d + k)); return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate() }; }
  function same(a, b) { return a.y === b.y && a.m === b.m && a.d === b.d; }
  function iso(o) { return o.y + "-" + pad(o.m) + "-" + pad(o.d); }
  function fromIso(s) { var a = s.split("-"); return { y: +a[0], m: +a[1], d: +a[2] }; }
  function times(o) { var P = place(); return PrayCalc.compute(o.y, o.m, o.d, P.lat, P.lng, { method: S.method, asr: S.asr, adj: S.adj, tz: tz() }); }
  function epoch(o, mins) { return Date.UTC(o.y, o.m - 1, o.d) - tz() * 3600000 + mins * 60000; }
  function fmtT(mins) {
    mins = ((mins % 1440) + 1440) % 1440; var h = Math.floor(mins / 60), m = mins % 60;
    if (S.fmt === "24") return pad(h) + ":" + pad(m);
    return (h % 12 || 12) + ":" + pad(m) + " " + (h < 12 ? "AM" : "PM");
  }
  function loc() { return S.lang === "ml" ? "ml-IN" : "en-GB"; }
  function gDate(o, short) {
    var x = new Date(Date.UTC(o.y, o.m - 1, o.d, 12));
    return x.toLocaleDateString(loc(), short ? { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" } : { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  }
  function hDate(o) {
    var x = new Date(Date.UTC(o.y, o.m - 1, o.d + (+S.hijriAdj || 0), 12));
    try { return x.toLocaleDateString((S.lang === "ml" ? "ml-IN" : "en-US") + "-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }); }
    catch (e) { return ""; }
  }
  function pName(k) { var p = PR.filter(function (x) { return x.k === k; })[0]; return L(p); }
  function adhan(id) { return ADH.filter(function (a) { return a.id === id; })[0] || ADH[0]; }
  function soundOk(id) { var a = adhan(id); return a.builtin || a.system || UI.avail[id]; }
  function resolveSound(id) { return soundOk(id) ? id : "chime"; }
  function haptic() { try { if (HAP) HAP.impact({ style: "LIGHT" }); else if (navigator.vibrate) navigator.vibrate(12); } catch (e) { } }
  function toast(msg) {
    var el = document.createElement("div"); el.className = "toast"; el.textContent = msg; document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 1800);
  }

  /* ---------------- Icons ---------------- */
  function sv(p, extra) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' + (extra || "") + ">" + p + "</svg>"; }
  var I = {
    home: sv('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
    times: sv('<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/><path d="M8 13h3M8 17h3M14 13h2M14 17h2"/>'),
    qibla: sv('<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'),
    adhkar: sv('<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 21V5"/><path d="M9 8h6M9 12h4"/>'),
    settings: sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'),
    pin: sv('<path d="M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
    down: sv('<path d="M6 9l6 6 6-6"/>'), left: sv('<path d="M15 18l-6-6 6-6"/>'), right: sv('<path d="M9 18l6-6-6-6"/>'),
    bell: sv('<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/>'),
    bellOff: sv('<path d="M13.7 21a2 2 0 01-3.4 0M18.6 13A17 17 0 0118 8M6.3 6.3A6 6 0 006 8c0 7-3 9-3 9h14M18 8a6 6 0 00-9.3-5M1 1l22 22"/>'),
    speaker: sv('<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 010 7M19 5a10 10 0 010 14"/>'),
    play: sv('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'), stop: sv('<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>'),
    fajr: sv('<path d="M17 18a5 5 0 00-10 0"/><path d="M12 9V2M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M23 22H1M8 6l4-4 4 4"/>'),
    sunrise: sv('<path d="M17 18a5 5 0 00-10 0"/><path d="M12 2v7M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M23 22H1M8 6l4-4 4 4"/>'),
    dhuhr: sv('<circle cx="12" cy="12" r="4.5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>'),
    asr: sv('<path d="M12 2v2M4.9 4.9l1.4 1.4M2 12h2M19.1 4.9l-1.4 1.4"/><path d="M15.9 13A4.5 4.5 0 108 11"/><path d="M17.5 21H9a4 4 0 110-8 5 5 0 019.5 2 3 3 0 01-1 6z"/>'),
    maghrib: sv('<path d="M17 18a5 5 0 00-10 0"/><path d="M12 9V2M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M23 22H1M16 5l-4 4-4-4"/>'),
    isha: sv('<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>'),
    mosque: sv('<path d="M12 3c-3 2.5-6 4-6 8h12c0-4-3-5.5-6-8z"/><path d="M4 21V11M20 21V11M3 21h18M9 21v-4a3 3 0 016 0v4"/><path d="M12 1v2"/>')
  };

  /* ---------------- Rendering ---------------- */
  function render() {
    var root = $("#app");
    document.documentElement.lang = S.lang === "ml" ? "ml" : "en";
    applyTheme();
    if (S.district === null || S.district === undefined) { root.innerHTML = onboarding(); return; }
    var body = { home: homeScreen, times: timesScreen, qibla: qiblaScreen, adhkar: adhkarScreen, settings: settingsScreen }[UI.tab] || homeScreen;
    root.innerHTML = body() + tabbar() + (UI.sheet ? sheetHtml() : "");
    if (UI.tab === "qibla") drawCompass(); else stopCompass();
  }
  function tabbar() {
    var tabs = ["home", "times", "qibla", "adhkar", "settings"];
    return '<nav class="tabbar"><div class="in">' + tabs.map(function (k) {
      return '<button class="tab' + (UI.tab === k ? " on" : "") + '" data-act="tab" data-v="' + k + '"><span class="tbg">' + I[k] + "</span>" + t(k) + "</button>";
    }).join("") + "</div></nav>";
  }
  function header(title) {
    var P = place();
    return '<header class="hdr' + (title ? " small" : "") + '"><div class="pattern"></div><div class="hrow">' +
      '<button class="chip" data-act="openDistrict">' + I.pin + "<span>" + L(P) + "</span>" + I.down + "</button>" +
      (title ? "" : '<button class="iconbtn" data-act="tab" data-v="settings" aria-label="Settings">' + I.settings + "</button>") + "</div>" +
      (title ? '<div class="title">' + title + "</div>" : "") + "</header>";
  }
  function banners() {
    var h = "";
    if (UI.notifOff) h += '<div class="banner">' + I.bellOff.replace("<svg", '<svg width="20" height="20"') + "<span>" + t("notifOff") + '</span><button data-act="askNotif">' + t("allow") + "</button></div>";
    if (UI.exactOff) h += '<div class="banner"><span>' + t("exactOff") + '</span><button data-act="fixExact">' + t("allow") + "</button></div>";
    return h;
  }

  /* ---- Next prayer logic ---- */
  function nextInfo() {
    var n = nowL(), today = { y: n.y, m: n.m, d: n.d }, tt = times(today), seq = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
    var prev = null, next = null, nextSecs = 0, prevSecs = 0, tomorrow = false;
    for (var i = 0; i < seq.length; i++) {
      if (tt[seq[i]] * 60 > n.secs) { next = seq[i]; nextSecs = tt[next] * 60; prev = i ? seq[i - 1] : "isha"; prevSecs = i ? tt[prev] * 60 : times(shift(today, -1)).isha * 60 - 86400; break; }
    }
    if (!next) { var tm = times(shift(today, 1)); next = "fajr"; nextSecs = tm.fajr * 60 + 86400; prev = "isha"; prevSecs = tt.isha * 60; tomorrow = true; }
    var cur = null; FIVE.forEach(function (k) { if (n.secs >= tt[k] * 60) cur = k; });
    if (cur === "fajr" && n.secs >= tt.sunrise * 60) cur = null;
    return { now: n, today: today, tt: tt, next: next, left: nextSecs - n.secs, frac: (n.secs - prevSecs) / Math.max(1, nextSecs - prevSecs), tomorrow: tomorrow, at: nextSecs / 60, cur: cur };
  }
  function cdText(s) { s = Math.max(0, s); return pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60); }

  function prayerRows(o, tt, info) {
    var isToday = info && same(o, info.today);
    return PR.map(function (p) {
      var cls = "prow" + (p.sun ? " sun" : "") + (isToday && info.cur === p.k ? " cur" : "") + (isToday && info.now.secs >= tt[p.k] * 60 && info.cur !== p.k ? " past" : "");
      var mode = S.modes[p.k], bellIc = mode === "adhan" ? I.speaker : mode === "notify" ? I.bell : I.bellOff;
      return '<div class="' + cls + '"><div class="pi">' + I[p.k] + '</div><div class="pn"><b>' + L(p) +
        (isToday && info.cur === p.k ? '<span class="badge">' + t("now") + "</span>" : "") + "</b><small>" + (p.sun ? t("sunriseNote") : (S.lang === "ml" ? p.en : p.ml) + " · " + p.ar) + "</small></div>" +
        '<div class="pt">' + fmtT(tt[p.k]) + "</div>" +
        '<button class="bell' + (mode !== "off" ? " on" : "") + '" data-act="cycleMode" data-v="' + p.k + '" aria-label="alert">' + bellIc + "</button></div>";
    }).join("");
  }

  function homeScreen() {
    var info = nextInfo(), C = 2 * Math.PI * 42;
    return '<div class="screen">' + header() +
      '<section class="hero"><div class="ring"><svg viewBox="0 0 96 96"><circle class="bgc" cx="48" cy="48" r="42" stroke-width="8" fill="none"/>' +
      '<circle id="ringfg" class="fgc" cx="48" cy="48" r="42" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - info.frac)).toFixed(1) + '"/></svg>' +
      '<div class="ic">' + I[info.next] + "</div></div>" +
      '<div><div class="lbl">' + t("next") + '</div><div class="nm" id="nxName">' + pName(info.next) + '</div><div class="cd" id="cd">' + cdText(info.left) + "</div>" +
      '<div class="at" id="nxAt">' + fmtT(info.at) + (info.tomorrow ? " · " + t("tomorrow") : "") + "</div></div></section>" +
      banners() +
      '<div class="sec"><h2>' + gDate(info.today) + '</h2></div><div class="sec" style="margin-top:-6px"><span style="color:var(--muted);font-size:.88rem">' + hDate(info.today) + (place().gps ? "" : " · IST") + "</span></div>" +
      '<div class="card">' + prayerRows(info.today, info.tt, info) + "</div>" +
      '<div class="tiles">' +
      '<button class="tile" data-act="goTomorrow"><div class="ti">' + I.times + "</div>" + t("tomorrow") + "</button>" +
      '<button class="tile" data-act="tab" data-v="qibla"><div class="ti">' + I.qibla + "</div>" + t("qibla") + "</button>" +
      '<button class="tile" data-act="tab" data-v="adhkar"><div class="ti">' + I.adhkar + "</div>" + t("adhkar") + "</button></div></div>";
  }

  function timesScreen() {
    var n = nowL(), today = { y: n.y, m: n.m, d: n.d };
    if (!UI.view) UI.view = today;
    var o = UI.view, isY = same(o, shift(today, -1)), isT = same(o, today), isTm = same(o, shift(today, 1));
    var h = '<div class="screen">' + header(t("times")) + '<div style="height:14px"></div>' +
      '<div class="seg"><button class="' + (UI.mode === "day" ? "on" : "") + '" data-act="mode" data-v="day">' + t("dayView") + '</button><button class="' + (UI.mode === "month" ? "on" : "") + '" data-act="mode" data-v="month">' + t("monthView") + "</button></div>";
    if (UI.mode === "day") {
      h += '<div class="seg"><button class="' + (isY ? "on" : "") + '" data-act="jump" data-v="-1">' + t("yesterday") + '</button><button class="' + (isT ? "on" : "") + '" data-act="jump" data-v="0">' + t("today") + '</button><button class="' + (isTm ? "on" : "") + '" data-act="jump" data-v="1">' + t("tomorrow") + "</button></div>";
      h += '<div class="dnav"><button class="arrow" data-act="step" data-v="-1">' + I.left + '</button><label class="dt"><b>' + gDate(o) + "</b><small>" + hDate(o) + '</small><input type="date" id="datepick" value="' + iso(o) + '" aria-label="' + t("pickDate") + '"></label><button class="arrow" data-act="step" data-v="1">' + I.right + "</button></div>";
      h += '<div class="card">' + prayerRows(o, times(o), isT ? nextInfo() : null) + "</div>";
    } else {
      var first = { y: o.y, m: o.m, d: 1 }, dim = new Date(Date.UTC(o.y, o.m, 0)).getUTCDate();
      var mName = new Date(Date.UTC(o.y, o.m - 1, 15)).toLocaleDateString(loc(), { month: "long", year: "numeric", timeZone: "UTC" });
      h += '<div class="dnav"><button class="arrow" data-act="stepMonth" data-v="-1">' + I.left + '</button><div class="dt"><b>' + mName + '</b><small>' + L(place()) + '</small></div><button class="arrow" data-act="stepMonth" data-v="1">' + I.right + "</button></div>";
      h += '<div class="card"><table class="month"><thead><tr><th>' + (S.lang === "ml" ? "തീയതി" : "Date") + "</th>" + PR.map(function (p) { return "<th>" + L(p) + "</th>"; }).join("") + "</tr></thead><tbody>";
      for (var d = 1; d <= dim; d++) {
        var od = { y: o.y, m: o.m, d: d }, tt = times(od), wd = new Date(Date.UTC(o.y, o.m - 1, d, 12)).toLocaleDateString(loc(), { weekday: "short", timeZone: "UTC" });
        h += '<tr class="' + (same(od, today) ? "today" : "") + '"><td class="d">' + d + '<br><small style="font-weight:400;color:var(--muted)">' + wd + "</small></td>" +
          PR.map(function (p) { return '<td class="' + (p.sun ? "sun" : "") + '">' + fmtT(tt[p.k]).replace(" AM", "").replace(" PM", "") + "</td>"; }).join("") + "</tr>";
      }
      h += "</tbody></table></div>";
      void first;
    }
    return h + '<p class="note">' + t("aboutText").split(".")[0] + ".</p></div>";
  }

  /* ---- Qibla ---- */
  var CMP = { on: false, heading: null, buzzed: false, handler: null };
  function qiblaScreen() {
    var P = place(), q = PrayCalc.qibla(P.lat, P.lng);
    return '<div class="screen">' + header(t("qiblaTitle")) +
      '<div class="compass-wrap"><div class="compass"><div class="kaaba-top"></div><div class="dial" id="dial"></div><div class="needle" id="needle"></div></div></div>' +
      '<div class="qinfo"><div class="deg">' + Math.round(q.bearing) + '°</div><div class="sub">' + t("qiblaFrom") + " · " + t("distance") + ": " + Math.round(q.km).toLocaleString() + " km</div></div>" +
      '<div class="qstat" id="qstat">' + (CMP.on ? t("turn") : t("compassHint")) + "</div>" +
      (CMP.on ? "" : '<button class="btn" data-act="startCompass">' + t("startCompass") + "</button>") + "</div>";
  }
  function drawCompass() {
    var P = place(), b = PrayCalc.qibla(P.lat, P.lng).bearing, s = "", i;
    for (i = 0; i < 360; i += 5) {
      var big = i % 30 === 0, r1 = big ? 128 : 134;
      s += '<line x1="150" y1="' + (150 - 140) + '" x2="150" y2="' + (150 - r1) + '" stroke="' + (big ? "var(--ink)" : "var(--muted)") + '" stroke-width="' + (big ? 2.4 : 1) + '" transform="rotate(' + i + ' 150 150)"/>';
    }
    var lbl = { 0: "N", 90: "E", 180: "S", 270: "W" };
    Object.keys(lbl).forEach(function (a) {
      s += '<text x="150" y="44" text-anchor="middle" font-size="20" font-weight="800" fill="' + (a === "0" ? "#C0392B" : "var(--ink)") + '" transform="rotate(' + a + ' 150 150)">' + lbl[a] + "</text>";
    });
    s += '<g transform="rotate(' + b.toFixed(1) + ' 150 150)"><line x1="150" y1="150" x2="150" y2="62" stroke="var(--gold)" stroke-width="5" stroke-linecap="round"/>' +
      '<rect x="137" y="40" width="26" height="26" rx="4" fill="#1b1b1b" stroke="var(--gold)" stroke-width="3"/><rect x="137" y="47" width="26" height="4" fill="var(--gold)"/></g>';
    $("#dial").innerHTML = '<svg viewBox="0 0 300 300"><circle cx="150" cy="150" r="146" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>' + s + '<circle cx="150" cy="150" r="7" fill="var(--p)"/></svg>';
    $("#needle").innerHTML = '<svg viewBox="0 0 300 300"><path d="M150 70 L160 150 L150 145 L140 150 Z" fill="var(--p)" opacity=".85"/></svg>';
    updateCompass();
  }
  function updateCompass() {
    var dial = $("#dial"); if (!dial) return;
    var P = place(), b = PrayCalc.qibla(P.lat, P.lng).bearing, h = CMP.heading;
    dial.style.transform = "rotate(" + (-(h || 0)).toFixed(1) + "deg)";
    var st = $("#qstat"); if (!st || h == null) return;
    var diff = ((b - h + 540) % 360) - 180, ok = Math.abs(diff) < 4;
    st.className = "qstat" + (ok ? " ok" : ""); st.textContent = ok ? "✓ " + t("aligned") : t("turn") + " (" + (diff > 0 ? "↻ " : "↺ ") + Math.abs(Math.round(diff)) + "°)";
    if (ok && !CMP.buzzed) { haptic(); CMP.buzzed = true; } if (!ok) CMP.buzzed = false;
  }
  function startCompass() {
    var DO = window.DeviceOrientationEvent;
    function listen() {
      CMP.on = true; CMP.heading = null;
      CMP.handler = function (e) {
        var h = null;
        if (e.webkitCompassHeading != null) h = e.webkitCompassHeading;
        else if (e.absolute && e.alpha != null) h = 360 - e.alpha;
        if (h == null) return;
        var so = (screen.orientation && screen.orientation.angle) || 0; h = (h + so + 360) % 360;
        if (CMP.heading == null) CMP.heading = h;
        else { var d = ((h - CMP.heading + 540) % 360) - 180; CMP.heading = (CMP.heading + d * 0.25 + 360) % 360; }
        updateCompass();
      };
      if ("ondeviceorientationabsolute" in window) window.addEventListener("deviceorientationabsolute", CMP.handler, true);
      window.addEventListener("deviceorientation", CMP.handler, true);
      render();
      setTimeout(function () { if (CMP.on && CMP.heading == null) { var st = $("#qstat"); if (st) st.textContent = t("noCompass"); } }, 3500);
    }
    if (DO && typeof DO.requestPermission === "function") {
      DO.requestPermission().then(function (r) { if (r === "granted") listen(); else toast(t("noCompass")); }).catch(function () { toast(t("noCompass")); });
    } else listen();
  }
  function stopCompass() {
    if (CMP.handler) { window.removeEventListener("deviceorientationabsolute", CMP.handler, true); window.removeEventListener("deviceorientation", CMP.handler, true); }
    CMP.handler = null; CMP.on = false;
  }

  /* ---- Adhkar ---- */
  function adhkarScreen() {
    if (!UI.dkPrayer) { var inf = nextInfo(); UI.dkPrayer = inf.cur || "fajr"; }
    var pk = UI.dkPrayer;
    var items = DK.filter(function (x) { return x.when === "all" || x.when.indexOf(pk) >= 0; });
    var h = '<div class="screen">' + header(t("adhkarTitle")) + '<div style="height:14px"></div><div class="pchips">' +
      FIVE.map(function (k) { return '<button class="' + (k === pk ? "on" : "") + '" data-act="dkP" data-v="' + k + '">' + pName(k) + "</button>"; }).join("") + "</div>";
    items.forEach(function (x) {
      var need = (x.countFM && (pk === "fajr" || pk === "maghrib")) ? x.countFM : x.count, key = pk + ":" + x.id, c = UI.counts[key] || 0, done = c >= need;
      h += '<div class="dk' + (done ? " done" : "") + '"><div class="dt"><b>' + L(x.title) + '</b><span class="cnt">' + need + "× </span></div>" +
        '<div class="ar">' + x.ar + "</div>" + (x.tr ? '<div class="tr">' + x.tr + "</div>" : "") + '<div class="en">' + x.en + "</div>" +
        '<div class="src">' + t("source") + ": " + x.src + "</div>" +
        '<div class="counter"><button class="tap" data-act="count" data-v="' + x.id + '" data-n="' + need + '">' + (done ? "✓ " + t("done") : c + " / " + need) + '</button><button class="rst" data-act="resetOne" data-v="' + x.id + '">' + t("reset") + "</button></div></div>";
    });
    return h + '<p class="note">' + t("reviewNote") + "</p></div>";
  }

  /* ---- Settings ---- */
  function sel(id, opts, val) {
    return '<select data-set="' + id + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select>";
  }
  function settingsScreen() {
    var h = '<div class="screen">' + header(t("settings")) + banners();
    h += '<div class="sgt">' + t("location") + '</div><div class="sgrp"><div class="srow" data-act="openDistrict"><div class="sl">' + t("changeDistrict") + "<small>" + L(place()) + '</small></div><span class="val">' + I.right.replace("<svg", '<svg width="18" height="18"') + "</span></div></div>";
    h += '<div class="sgt">' + t("adhanSection") + '</div><div class="sgrp">' +
      '<div class="srow" data-act="soundSheet" data-v="sound"><div class="sl">' + t("adhanSound") + "<small>" + L(adhan(S.sound)) + "</small></div>" + I.right.replace("<svg", '<svg width="18" height="18"') + "</div>" +
      '<div class="srow" data-act="soundSheet" data-v="fajrSound"><div class="sl">' + t("fajrSound") + "<small>" + L(adhan(S.fajrSound)) + "</small></div>" + I.right.replace("<svg", '<svg width="18" height="18"') + "</div>" +
      '<div class="srow"><div class="sl">' + t("preReminder") + "</div>" + sel("pre", [[0, t("none")], [5, "5 " + t("minBefore")], [10, "10 " + t("minBefore")], [15, "15 " + t("minBefore")], [20, "20 " + t("minBefore")], [30, "30 " + t("minBefore")]], S.pre) + "</div>" +
      '<div class="srow" data-act="testAdhan"><div class="sl" style="color:var(--p);font-weight:700">' + t("testAdhan") + "</div>" + I.play.replace("<svg", '<svg width="18" height="18" style="color:var(--p)"') + "</div></div>";
    h += '<div class="sgt">' + t("perPrayer") + '</div><div class="sgrp">' + PR.map(function (p) {
      var opts = p.sun ? ["notify", "off"] : ["adhan", "notify", "off"];
      return '<div class="srow"><div class="sl">' + L(p) + '</div><div class="mode3">' + opts.map(function (m) {
        return '<button class="' + (S.modes[p.k] === m ? "on" : "") + '" data-act="setMode" data-v="' + p.k + '" data-m="' + m + '">' + t(m === "adhan" ? "modeAdhan" : m === "notify" ? "modeNotify" : "modeOff") + "</button>";
      }).join("") + "</div></div>";
    }).join("") + "</div>";
    h += '<div class="sgt">' + t("calcSection") + '</div><div class="sgrp">' +
      '<div class="srow"><div class="sl">' + t("method") + "</div>" + sel("method", [["karachi", "Kerala / Karachi 18°"], ["mwl", "Muslim World League"], ["egypt", "Egyptian"], ["makkah", "Umm al-Qura"]], S.method) + "</div>" +
      '<div class="srow"><div class="sl">' + t("asr") + "</div>" + sel("asr", [[1, t("shafi")], [2, t("hanafi")]], S.asr) + "</div>" +
      '<div class="srow"><div class="sl">' + t("hijriAdj") + "</div>" + sel("hijriAdj", [[-2, "-2"], [-1, "-1"], [0, "0"], [1, "+1"], [2, "+2"]], S.hijriAdj) + "</div>" +
      '<div style="padding:12px 16px 0;font-size:.85rem">' + t("adjust") + '</div><div class="adjgrid">' + PR.map(function (p) {
        return "<div><label>" + L(p) + '</label><div class="stepper"><button data-act="adj" data-v="' + p.k + '" data-d="-1">−</button><span>' + (S.adj[p.k] > 0 ? "+" : "") + S.adj[p.k] + '</span><button data-act="adj" data-v="' + p.k + '" data-d="1">+</button></div></div>';
      }).join("") + "</div></div>";
    h += '<div class="sgt">' + t("generalSection") + '</div><div class="sgrp">' +
      '<div class="srow"><div class="sl">' + t("language") + "</div>" + sel("lang", [["en", "English"], ["ml", "മലയാളം"]], S.lang) + "</div>" +
      '<div class="srow"><div class="sl">' + t("timeFormat") + "</div>" + sel("fmt", [["12", "12h"], ["24", "24h"]], S.fmt) + "</div>" +
      '<div class="srow"><div class="sl">' + t("theme") + "</div>" + sel("theme", [["auto", t("themeAuto")], ["light", t("themeLight")], ["dark", t("themeDark")]], S.theme) + "</div></div>";
    h += '<div class="sgt">' + t("about") + '</div><div class="sgrp"><div class="srow"><div class="sl" style="font-size:.85rem;line-height:1.5">' + t("aboutText") + "<small>v2.0</small></div></div></div>";
    return h + "</div>";
  }

  /* ---- Sheets (district picker, sound picker) ---- */
  function districtGrid(inSheet) {
    return '<button class="gpsbtn" data-act="gps">' + I.pin + "<span>" + t("useGps") + "</span></button>" +
      '<div class="dgrid">' + DIST.map(function (d, i) {
        return '<button class="dbtn' + (S.district === i ? " sel" : "") + '" data-act="pickDistrict" data-v="' + i + '"><b>' + (S.lang === "ml" ? d.ml : d.en) + "</b><small>" + (S.lang === "ml" ? d.en : d.ml) + "</small></button>";
      }).join("") + "</div>";
  }
  function sheetHtml() {
    var h = '<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet"><div class="grab"></div>';
    if (UI.sheet === "district") h += "<h3>" + t("chooseDistrict") + "</h3>" + districtGrid(true);
    else {
      var key = UI.sheet, cur = S[key];
      h += "<h3>" + t(key === "sound" ? "adhanSound" : "fajrSound") + '</h3><div class="sgrp">' + ADH.map(function (a) {
        var ok = soundOk(a.id);
        return '<div class="sound' + (cur === a.id ? " sel" : "") + '" data-act="pickSound" data-v="' + a.id + '"><span class="rad"></span><div class="sn">' + L(a) +
          (ok ? "" : "<small>" + t("notInstalled") + "</small>") + "</div>" +
          (a.system ? "" : '<button class="pl" data-act="preview" data-v="' + a.id + '">' + (PLAY.id === a.id ? I.stop : I.play) + "</button>") + "</div>";
      }).join("") + "</div>";
    }
    return h + "</div>";
  }

  /* ---- Onboarding ---- */
  function onboarding() {
    return '<div class="onb"><button class="langsw" data-act="toggleLang">' + (S.lang === "ml" ? "English" : "മലയാളം") + "</button>" +
      '<img class="logo" src="img/icon-192.png" alt=""><h1>' + t("welcome") + "</h1><p>" + t("welcomeSub") + "</p>" + districtGrid(false) + "</div>";
  }

  function applyTheme() {
    var dark = S.theme === "dark" || (S.theme === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }

  /* ---------------- Audio ---------------- */
  var PLAY = { id: null, audio: null };
  function audioUrl(id) { var a = adhan(id); return a.builtin ? "audio/chime.wav" : "audio/adhan_" + id + ".mp3"; }
  function playSound(id, onEnd) {
    stopSound(); if (adhan(id).system) return;
    var au = new Audio(audioUrl(resolveSound(id))); PLAY.id = id; PLAY.audio = au;
    au.onended = function () { PLAY.id = null; if (onEnd) onEnd(); if (UI.sheet && UI.sheet !== "district") render(); };
    au.play().catch(function () { PLAY.id = null; });
  }
  function stopSound() { if (PLAY.audio) { try { PLAY.audio.pause(); } catch (e) { } } PLAY.audio = null; PLAY.id = null; }
  function checkSounds() {
    var list = ADH.filter(function (a) { return !a.builtin && !a.system; }), left = list.length;
    list.forEach(function (a) {
      var au = new Audio(), done = false;
      function fin(ok) { if (done) return; done = true; UI.avail[a.id] = ok; au.src = ""; if (--left === 0) { if (UI.sheet) render(); reschedule(); } }
      au.preload = "metadata"; au.onloadedmetadata = function () { fin(true); }; au.onerror = function () { fin(false); };
      setTimeout(function () { fin(false); }, 5000); au.src = audioUrl(a.id);
    });
  }
  function adhanOverlay(k) {
    var ov = document.createElement("div"); ov.className = "adhan-ov";
    var p = PR.filter(function (x) { return x.k === k; })[0] || PR[0];
    ov.innerHTML = '<div class="pulse">' + I.mosque + '</div><div class="arn">' + p.ar + '</div><div class="big">' + L(p) + "</div><div>" + L(place()) + '</div><button data-act="stopAdhan">' + t("stopAdhan") + "</button>";
    document.body.appendChild(ov);
    if (platform !== "android") playSound(k === "fajr" ? S.fajrSound : S.sound, function () { ov.remove(); });
  }

  /* ---------------- Notifications ---------------- */
  function soundFileFor(id) {
    var a = adhan(id); if (a.system) return null;
    if (a.builtin) return "chime.wav";
    return platform === "ios" ? "adhan_" + id + ".wav" : "adhan_" + id + ".mp3";
  }
  async function ensureChannels() {
    var ids = {}; ids[resolveSound(S.sound)] = 1; ids[resolveSound(S.fajrSound)] = 1;
    var jobs = Object.keys(ids).map(function (id) {
      var c = { id: "adhan_" + id + "_" + CH, name: "Adhan – " + adhan(id).en, description: "Adhan at prayer time", importance: 5, visibility: 1, vibration: true };
      var f = soundFileFor(id); if (f) c.sound = f;
      return LN.createChannel(c);
    });
    jobs.push(LN.createChannel({ id: "notify_" + CH, name: "Prayer time alerts", description: "Short alert at prayer time", importance: 4, visibility: 1, vibration: true }));
    jobs.push(LN.createChannel({ id: "reminder_" + CH, name: "Before-prayer reminders", description: "Reminder before prayer", importance: 3, visibility: 1 }));
    await Promise.all(jobs);
  }
  var schedTimer = null;
  function reschedule() { clearTimeout(schedTimer); schedTimer = setTimeout(doSchedule, 400); }
  async function doSchedule() {
    if (!LN || S.district === null) return;
    try {
      var perm = await LN.checkPermissions();
      UI.notifOff = perm.display !== "granted";
      if (platform === "android" && LN.checkExactNotificationSetting) {
        try { var ex = await LN.checkExactNotificationSetting(); UI.exactOff = ex && ex.exact_alarm && ex.exact_alarm !== "granted"; } catch (e) { }
      }
      if (UI.notifOff) { if (UI.tab === "home" || UI.tab === "settings") render(); return; }
      if (platform === "android") await ensureChannels();
      var pend = await LN.getPending();
      if (pend.notifications && pend.notifications.length) await LN.cancel({ notifications: pend.notifications.map(function (n) { return { id: n.id }; }) });
      var perDay = PR.filter(function (p) { return S.modes[p.k] !== "off"; }).length * (S.pre > 0 ? 2 : 1);
      var days = Math.max(2, Math.min(14, Math.floor(60 / Math.max(1, perDay))));
      var n = nowL(), today = { y: n.y, m: n.m, d: n.d }, list = [], now = Date.now(), P = place();
      for (var d = 0; d < days; d++) {
        var o = shift(today, d), tt = times(o);
        PR.forEach(function (p, idx) {
          var mode = S.modes[p.k]; if (mode === "off") return;
          var at = epoch(o, tt[p.k]); var base = (o.y % 100) * 1000000 + o.m * 10000 + o.d * 100 + idx * 10;
          var nm = L(p), where = L(P);
          if (at > now) {
            var body = p.sun ? (S.lang === "ml" ? "സൂര്യോദയം – സുബ്ഹിന്റെ സമയം കഴിഞ്ഞു" : "Sunrise – Fajr time has ended") :
              (S.lang === "ml" ? nm + " നിസ്കാരത്തിന് സമയമായി · " + where : "It's time for " + nm + " prayer · " + where);
            var x = { id: base, title: nm + " · " + fmtT(tt[p.k]), body: body, schedule: { at: new Date(at), allowWhileIdle: true }, extra: { k: p.k, mode: mode } };
            if (mode === "adhan") {
              var sid = resolveSound(p.k === "fajr" ? S.fajrSound : S.sound);
              if (platform === "android") x.channelId = "adhan_" + sid + "_" + CH; else { var f = soundFileFor(sid); if (f) x.sound = f; }
            } else if (platform === "android") x.channelId = "notify_" + CH;
            list.push(x);
          }
          if (S.pre > 0 && !p.sun) {
            var at2 = at - S.pre * 60000;
            if (at2 > now) list.push({
              id: base + 5, title: nm + " · " + S.pre + " " + t("minBefore"), body: (S.lang === "ml" ? nm + " " + fmtT(tt[p.k]) + "ന്" : nm + " at " + fmtT(tt[p.k])) + " · " + where,
              schedule: { at: new Date(at2), allowWhileIdle: true }, channelId: platform === "android" ? "reminder_" + CH : undefined, extra: { k: p.k, mode: "reminder" }
            });
          }
        });
      }
      if (list.length) await LN.schedule({ notifications: list });
    } catch (e) { console.warn("schedule failed", e); }
  }
  async function askNotif() {
    if (!LN) return;
    try { await LN.requestPermissions(); } catch (e) { }
    reschedule(); setTimeout(render, 700);
  }

  /* ---------------- Location ---------------- */
  async function getGps() {
    toast(t("locating"));
    try {
      var pos;
      if (GEO) {
        try { await GEO.requestPermissions(); } catch (e) { }
        pos = await GEO.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
      } else {
        pos = await new Promise(function (res, rej) { navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 15000, maximumAge: 600000 }); });
      }
      S.gps = [pos.coords.latitude, pos.coords.longitude]; S.district = -1; UI.sheet = null; UI.view = null;
      save(); render(); askNotif();
    } catch (e) { toast(t("gpsFail")); }
  }

  /* ---------------- Events ---------------- */
  var ACT = {
    tab: function (el) { UI.tab = el.dataset.v; UI.sheet = null; if (UI.tab !== "times") UI.view = null; render(); window.scrollTo(0, 0); },
    openDistrict: function () { UI.sheet = "district"; render(); },
    closeSheet: function () { UI.sheet = null; stopSound(); render(); },
    pickDistrict: function (el) { var first = S.district === null; S.district = +el.dataset.v; UI.sheet = null; UI.view = null; save(); render(); if (first) askNotif(); },
    gps: function () { getGps(); },
    toggleLang: function () { S.lang = S.lang === "ml" ? "en" : "ml"; save(true); render(); },
    goTomorrow: function () { var n = nowL(); UI.view = shift({ y: n.y, m: n.m, d: n.d }, 1); UI.mode = "day"; UI.tab = "times"; render(); window.scrollTo(0, 0); },
    mode: function (el) { UI.mode = el.dataset.v; render(); },
    jump: function (el) { var n = nowL(); UI.view = shift({ y: n.y, m: n.m, d: n.d }, +el.dataset.v); render(); },
    step: function (el) { UI.view = shift(UI.view, +el.dataset.v); render(); },
    stepMonth: function (el) { var o = UI.view, m = o.m + (+el.dataset.v), y = o.y; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } UI.view = { y: y, m: m, d: 1 }; render(); },
    cycleMode: function (el) {
      var k = el.dataset.v, p = PR.filter(function (x) { return x.k === k; })[0], seq = p.sun ? ["notify", "off"] : ["adhan", "notify", "off"];
      S.modes[k] = seq[(seq.indexOf(S.modes[k]) + 1) % seq.length]; save(); haptic(); render();
      toast(L(p) + ": " + t(S.modes[k] === "adhan" ? "modeAdhan" : S.modes[k] === "notify" ? "modeNotify" : "modeOff"));
    },
    setMode: function (el) { S.modes[el.dataset.v] = el.dataset.m; save(); render(); },
    adj: function (el) { var k = el.dataset.v; S.adj[k] = Math.max(-30, Math.min(30, (S.adj[k] || 0) + (+el.dataset.d))); save(); render(); },
    soundSheet: function (el) { UI.sheet = el.dataset.v; render(); },
    pickSound: function (el) { S[UI.sheet] = el.dataset.v; save(); render(); },
    preview: function (el, ev) { ev.stopPropagation(); var id = el.dataset.v; if (PLAY.id === id) stopSound(); else playSound(id); render(); },
    testAdhan: async function () {
      if (LN && !UI.notifOff) {
        var sid = resolveSound(S.sound), x = { id: 99, title: pName("maghrib") + " · test", body: L(place()), schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true }, extra: { k: "maghrib", mode: "adhan" } };
        if (platform === "android") { await ensureChannels(); x.channelId = "adhan_" + sid + "_" + CH; } else { var f = soundFileFor(sid); if (f) x.sound = f; }
        await LN.schedule({ notifications: [x] }); toast("5 s…");
      } else adhanOverlay("maghrib");
    },
    stopAdhan: function () { stopSound(); var ov = $(".adhan-ov"); if (ov) ov.remove(); if (LN && LN.removeAllDeliveredNotifications) LN.removeAllDeliveredNotifications().catch(function () { }); },
    askNotif: function () { askNotif(); },
    fixExact: function () { if (LN && LN.changeExactNotificationSetting) LN.changeExactNotificationSetting().catch(function () { }); },
    startCompass: function () { startCompass(); },
    dkP: function (el) { UI.dkPrayer = el.dataset.v; render(); },
    count: function (el) {
      var key = UI.dkPrayer + ":" + el.dataset.v, need = +el.dataset.n, c = UI.counts[key] || 0;
      if (c >= need) return; UI.counts[key] = c + 1; haptic();
      var card = el.closest(".dk");
      if (c + 1 >= need) { card.classList.add("done"); el.textContent = "✓ " + t("done"); if (navigator.vibrate) navigator.vibrate([20, 40, 20]); }
      else el.textContent = (c + 1) + " / " + need;
    },
    resetOne: function (el) { UI.counts[UI.dkPrayer + ":" + el.dataset.v] = 0; render(); }
  };
  document.addEventListener("click", function (ev) {
    var el = ev.target.closest("[data-act]"); if (!el) return;
    var fn = ACT[el.dataset.act]; if (fn) fn(el, ev);
  });
  document.addEventListener("change", function (ev) {
    var el = ev.target;
    if (el.id === "datepick" && el.value) { UI.view = fromIso(el.value); render(); return; }
    var k = el.dataset && el.dataset.set; if (!k) return;
    var v = el.value; S[k] = (k === "asr" || k === "pre" || k === "hijriAdj") ? +v : v;
    save(k === "theme" || k === "hijriAdj"); render();
  });
  if (window.matchMedia) { try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { if (S.theme === "auto") render(); }); } catch (e) { } }

  /* ---------------- Live tick ---------------- */
  var lastMin = -1;
  function tick() {
    if (!S || S.district === null || UI.tab !== "home") return;
    var info = nextInfo(), cd = $("#cd");
    var mn = Math.floor(info.now.secs / 60);
    if (mn !== lastMin && lastMin !== -1) { lastMin = mn; if (!UI.sheet) { render(); return; } }
    lastMin = mn;
    if (cd) {
      cd.textContent = cdText(info.left); $("#nxName").textContent = pName(info.next);
      var C = 2 * Math.PI * 42, r = $("#ringfg"); if (r) r.setAttribute("stroke-dashoffset", (C * (1 - info.frac)).toFixed(1));
    }
  }

  /* ---------------- Start ---------------- */
  async function start() {
    await load();
    render();
    setInterval(tick, 1000);
    checkSounds();
    if (SB) { try { SB.setBackgroundColor({ color: "#0B5D4B" }); SB.setStyle({ style: "DARK" }); } catch (e) { } }
    if (APP) APP.addListener("appStateChange", function (s) { if (s.isActive) { UI.view = null; render(); reschedule(); } });
    if (LN) {
      LN.addListener("localNotificationReceived", function (n) { if (n.extra && n.extra.mode === "adhan") adhanOverlay(n.extra.k); });
      LN.addListener("localNotificationActionPerformed", function () { UI.tab = "home"; render(); });
    }
    reschedule();
  }
  start();
})();
