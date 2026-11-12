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
    APP = plugin("App"), HAP = plugin("Haptics"), SB = plugin("StatusBar"), FS = plugin("Filesystem"), SHARE = plugin("Share"),
    KN = platform === "android" ? plugin("KptNative") : null;
  var HM = D.HMONTHS, EV = D.EVENTS, DH = D.DHIKR;
  var FIVE = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
  var CH = "v1";

  /* ---------------- Settings ---------------- */
  var DEF = {
    v: 3, lang: "en", district: null, gps: null, method: "karachi", asr: 1,
    adj: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }, hijriAdj: 0, fmt: "12", theme: "auto",
    sound: "makkah", fajrSound: "fajr_malmo",
    modes: { fajr: "adhan", sunrise: "off", dhuhr: "adhan", asr: "adhan", maghrib: "adhan", isha: "adhan" }, pre: 0,
    ramadan: "auto", suhoor: 45, jumuah: 60, tb: { i: 0, target: 33, count: 0, rounds: 0, total: 0 }, setupSeen: false, ps: {}, bg: "bluehour"
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
    if (S.district === null || S.district === undefined) { S.district = 9; UI.firstRun = true; }
    var ids = ADH.map(function (a) { return a.id; });
    if (ids.indexOf(S.sound) < 0) S.sound = DEF.sound;
    if (ids.indexOf(S.fajrSound) < 0) S.fajrSound = DEF.fajrSound;
    Object.keys(S.ps || {}).forEach(function (k) { if (ids.indexOf(S.ps[k]) < 0) delete S.ps[k]; });
    var q = new URLSearchParams(location.search);           // ?district=9&lang=ml&tab=qibla (testing / deep links)
    if (q.has("district")) S.district = +q.get("district");
    if (q.has("lang")) S.lang = q.get("lang");
    if (q.has("theme")) S.theme = q.get("theme");
    if (q.has("tab")) UI.tab = q.get("tab");
    if (q.has("mode")) UI.mode = q.get("mode");
    if (q.has("ramadan")) S.ramadan = q.get("ramadan");
    if (q.has("noanim")) document.documentElement.classList.add("noanim");
  }
  function save(silent) {
    var raw = JSON.stringify(S);
    try { localStorage.setItem("kpt_settings", raw); } catch (e) { }
    if (PREF) PREF.set({ key: "kpt_settings", value: raw }).catch(function () { });
    if (!silent) reschedule();
  }

  /* ---------------- Helpers ---------------- */
  var UI = { tab: "home", view: null, mode: "day", hv: null, dkPrayer: null, counts: {}, sheet: null, notifOff: false, exactOff: false, avail: {}, batt: null, maker: "", schedDays: 14 };
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
  /* ---- Hijri (Umm al-Qura via Intl, tabular fallback) ---- */
  var HFMT = null;
  try { HFMT = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" }); if (HFMT.resolvedOptions().calendar.indexOf("islamic") < 0) HFMT = null; } catch (e) { HFMT = null; }
  var HCACHE = {};
  function tabular(ms) {
    var jd = Math.floor(ms / 86400000) + 2440588, l = jd - 1948440 + 10632, n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    var j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
    l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    var m = Math.floor((24 * l) / 709); return { y: 30 * n + j - 30, m: m, d: l - Math.floor((709 * m) / 24) };
  }
  function hParts(o) {
    var adj = +S.hijriAdj || 0, key = iso(o) + "|" + adj; if (HCACHE[key]) return HCACHE[key];
    var ms = Date.UTC(o.y, o.m - 1, o.d + adj, 12), r = null;
    if (HFMT) {
      try { var x = {}; HFMT.formatToParts(new Date(ms)).forEach(function (p) { if (p.type === "day") x.d = parseInt(p.value, 10); else if (p.type === "month") x.m = parseInt(p.value, 10); else if (p.type === "year") x.y = parseInt(p.value, 10); }); if (x.d && x.m && x.y) r = x; } catch (e) { }
    }
    return (HCACHE[key] = r || tabular(ms));
  }
  function hMonth(m) { return (HM[S.lang] || HM.en)[m - 1]; }
  function hDate(o) { var h = hParts(o); return h.d + " " + hMonth(h.m) + " " + h.y + (S.lang === "ml" ? " ഹി." : " AH"); }
  function hStart(o) { return shift(o, -(hParts(o).d - 1)); }
  function eventsOn(h) { return EV.filter(function (e) { return e.m === h.m && e.d === h.d; }); }
  function todayO() { var n = nowL(); return { y: n.y, m: n.m, d: n.d }; }
  function isFri(o) { return new Date(Date.UTC(o.y, o.m - 1, o.d, 12)).getUTCDay() === 5; }
  function rmActive(o) { return S.ramadan === "on" || (S.ramadan === "auto" && hParts(o).m === 9); }
  function fill(str, o) { return str.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
  function pName(k) { var p = PR.filter(function (x) { return x.k === k; })[0]; return L(p); }
  function adhan(id) { return ADH.filter(function (a) { return a.id === id; })[0] || ADH[0]; }
  function soundFor(k) { return (S.ps && S.ps[k]) || (k === "fajr" ? S.fajrSound : S.sound); }
  function soundOk(id) { var a = adhan(id); return a.builtin || a.system || UI.avail[id] || !!(window.KPT_REMOTE_ADHAN && a.src); }
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
    tasbih: sv('<circle cx="12" cy="5" r="2"/><circle cx="17.5" cy="8" r="2"/><circle cx="19" cy="14" r="2"/><circle cx="6.5" cy="8" r="2"/><circle cx="5" cy="14" r="2"/><circle cx="8.5" cy="19" r="2"/><circle cx="15.5" cy="19" r="2"/>'),
    cal: sv('<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/><path d="M15 13.5a2.5 2.5 0 11-2.6-2.5 2 2 0 002.6 2.5z"/>'),
    moon: sv('<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/><path d="M17 3l.6 1.4L19 5l-1.4.6L17 7l-.6-1.4L15 5l1.4-.6z"/>'),
    share: sv('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>'),
    print: sv('<path d="M6 9V2h12v7"/><rect x="2" y="9" width="20" height="9" rx="2"/><path d="M6 14h12v8H6z"/>'),
    shield: sv('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>'),
    widget: sv('<rect x="3" y="3" width="18" height="11" rx="3"/><rect x="3" y="17" width="8" height="4" rx="1.5"/><rect x="13" y="17" width="8" height="4" rx="1.5"/>'),
    lock: sv('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>'),
    reset: sv('<path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8"/><path d="M3 3v5h5"/>'),
    mosque: sv('<path d="M12 3c-3 2.5-6 4-6 8h12c0-4-3-5.5-6-8z"/><path d="M4 21V11M20 21V11M3 21h18M9 21v-4a3 3 0 016 0v4"/><path d="M12 1v2"/>')
  };

  /* ---------------- Rendering ---------------- */
  function render() {
    var root = $("#app");
    document.documentElement.lang = S.lang === "ml" ? "ml" : "en";
    applyTheme();
    if (S.district === null || S.district === undefined) { root.innerHTML = onboarding(); return; }
    var body = { home: homeScreen, times: timesScreen, qibla: qiblaScreen, adhkar: adhkarScreen, settings: settingsScreen,
      tasbih: tasbihScreen, ramadan: ramadanScreen, setup: setupScreen }[UI.tab] || homeScreen;
    root.innerHTML = body() + tabbar() + (UI.sheet ? sheetHtml() : "");
    if (UI.tab === "qibla") drawCompass(); else stopCompass();
  }
  function tabbar() {
    var tabs = ["home", "times", "qibla", "adhkar", "settings"];
    return '<nav class="tabbar"><div class="in">' + tabs.map(function (k) {
      var par = { tasbih: "adhkar", ramadan: "times", setup: "settings" }[UI.tab] || UI.tab;
      return '<button class="tab' + (par === k ? " on" : "") + '" data-act="tab" data-v="' + k + '"><span class="tbg">' + I[k] + "</span>" + t(k) + "</button>";
    }).join("") + "</div></nav>";
  }
  function header(title, back) {
    var P = place();
    return '<header class="hdr' + (title ? " small" : "") + '"><div class="pattern"></div><div class="hrow">' +
      (back ? '<button class="iconbtn" data-act="tab" data-v="' + back + '" aria-label="' + t("back") + '">' + I.left + "</button>" : "") +
      '<button class="chip" data-act="openDistrict">' + I.pin + "<span>" + L(P) + "</span>" + I.down + "</button>" +
      (title ? (back ? '<span style="width:40px"></span>' : "") : '<button class="iconbtn" data-act="tab" data-v="settings" aria-label="Settings">' + I.settings + "</button>") + "</div>" +
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

  function skyPhase(info) {
    var m = info.now.secs / 60, tt = info.tt;
    if (m < tt.fajr || m >= tt.isha + 60) return "night";
    if (m < tt.sunrise + 25) return "dawn";
    if (m < tt.asr) return "day";
    if (m < tt.maghrib) return "eve";
    return "dusk";
  }
  var MOSQUE = '<svg class="mosque" viewBox="0 0 400 84" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><path d="M0 84V72H26V30L31 14L36 30V72H74V62A20 20 0 0 1 114 62V72H150V60A50 50 0 0 1 250 60V72H286V62A20 20 0 0 1 326 62V72H364V30L369 14L374 30V72H400V84Z"/><rect x="198" y="0" width="4" height="12" rx="2"/></svg>';
  function homeScreen() {
    var info = nextInfo(), P = place(), ph = skyPhase(info), tt = info.tt, now = info.now.secs / 60;
    var dots = PR.map(function (p) {
      return '<span class="dot' + (p.k === info.next && !info.tomorrow ? " next" : "") + (now >= tt[p.k] ? " done" : "") + '" style="left:' + (tt[p.k] / 14.4).toFixed(2) + '%"></span>';
    }).join("");
    var img = S.bg === "image" || S.bg === "kerala" || S.bg === "sunrise" || S.bg === "bluehour";
    var h = '<div class="screen home2"><header class="hero2 sky-' + ph + (img ? " img bg-" + S.bg : "") + '"><div class="stars"></div>' + (img ? "" : MOSQUE) +
      '<div class="hrow">' + districtSelect() +
      '<button class="iconbtn" data-act="tab" data-v="settings" aria-label="Settings">' + I.settings + "</button></div>" +
      (UI.firstRun ? '<div class="dhint">' + t("pickHint") + "</div>" : "") +
      '<div class="greet">' + t("welcome") + '</div><div class="dates">' + gDate(info.today) + '</div><div class="hijri">' + hDate(info.today) + "</div>" +
      '<div class="nxt"><div><div class="nlbl">' + t("next") + '</div><div class="nname" id="nxName">' + pName(info.next) + '</div><div class="nat" id="nxAt">' + fmtT(info.at) + (info.tomorrow ? " · " + t("tomorrow") : "") + "</div></div>" +
      '<div class="cdbox"><div class="cd" id="cd">' + cdText(info.left) + "</div><small>" + t("remaining") + "</small></div></div>" +
      '<div class="daybar"><div class="fill" id="dayfill" style="width:' + (now / 14.4).toFixed(2) + '%"></div>' + dots +
      '<span class="me" id="dayme" style="left:' + (now / 14.4).toFixed(2) + '%"></span></div></header>';
    h += '<div class="card over">' + prayerRows(info.today, tt, info) +
      '<button class="adhanbar" data-act="soundSheet" data-v="sound"><span class="ai">' + I.speaker + '</span><span class="at"><small>' + t("adhanSound") + "</small><b>" + L(adhan(S.sound)) + "</b></span><span class=\"chg\">" + t("change") + "</span></button></div>" +
      ramadanCard(info) + banners();
    var Q = [["goTomorrow", "", I.times, t("tomorrow")], ["tab", "qibla", I.qibla, t("qibla")], ["tab", "adhkar", I.adhkar, t("adhkar")],
      ["tab", "tasbih", I.tasbih, t("tasbih")], ["goHijri", "", I.cal, t("calShort")], ["tab", "ramadan", I.moon, t("ramadan")]];
    h += '<div class="quick">' + Q.map(function (q) { return '<button data-act="' + q[0] + '"' + (q[1] ? ' data-v="' + q[1] + '"' : "") + '><span class="qi">' + q[2] + "</span>" + q[3] + "</button>"; }).join("") + "</div>";
    h += homeCounter(info) + duaOfDay(info) + upcomingHtml(2);
    return h + "</div>";
  }
  function districtSelect() {
    var cur = S.district;
    return '<label class="dsel">' + I.pin + '<select id="distSel" aria-label="' + t("chooseDistrict") + '">' +
      '<option value="gps"' + (cur === -1 ? " selected" : "") + ">📍 " + t("gpsShort") + "</option>" +
      DIST.map(function (d, i) { return '<option value="' + i + '"' + (cur === i ? " selected" : "") + ">" + L(d) + "</option>"; }).join("") +
      "</select>" + I.down + "</label>";
  }
  function duaOfDay(info) {
    var list = DK.filter(function (x) { return x.tr && x.ar.length < 260; });
    var x = list[Math.floor(Date.UTC(info.today.y, info.today.m - 1, info.today.d) / 86400000) % list.length];
    return '<div class="sec"><h2>' + t("duaDay") + '</h2></div><div class="duaday"><div class="ar">' + x.ar + '</div><div class="tr">' + x.tr + '</div><div class="en">' + (S.lang === "ml" && x.ml ? x.ml : x.en) + '</div><div class="src">' + x.src + "</div></div>";
  }

  /* ---- After-prayer adhkar counter on the home page: 33 SubhanAllah, 33 Alhamdulillah, 33 Allahu Akbar, then La ilaha illallah ---- */
  var HC = [{ d: 0, n: 33 }, { d: 1, n: 33 }, { d: 2, n: 33 }, { d: 3, n: 1, long: true }];
  function hcKey(info) { return iso(info.today) + ":" + (info.cur || "x"); }
  function hcState(info) {
    var k = hcKey(info);
    if (!S.hc || S.hc.k !== k) S.hc = { k: k, step: 0, count: 0 };   // starts fresh after every prayer
    return S.hc;
  }
  function hcInner(st, info) {
    if (st.step >= HC.length) return '<div class="hc-done">✓ ' + t("done") + '</div><button class="hc-rst" data-act="hcReset">' + I.reset + "</button>";
    var cur = HC[st.step], dh = DH[cur.d], C = 2 * Math.PI * 30;
    var txt = cur.long ? "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ" : dh.ar;
    return '<button class="hc-tap" data-act="hcTap" aria-label="count"><svg viewBox="0 0 70 70"><circle cx="35" cy="35" r="30" class="bgc" stroke-width="6" fill="none"/>' +
      '<circle cx="35" cy="35" r="30" class="fgc" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - st.count / cur.n)).toFixed(1) + '" transform="rotate(-90 35 35)"/></svg>' +
      "<b>" + st.count + "</b><small>/ " + cur.n + "</small></button>" +
      '<div class="hc-txt"><div class="hc-ar">' + txt + "</div><b>" + (cur.long ? "La ilaha illallahu wahdahu…" : L(dh)) + "</b>" +
      '<div class="hc-steps">' + HC.map(function (x, i) { return '<span class="' + (i < st.step ? "ok" : i === st.step ? "on" : "") + '"></span>'; }).join("") + "</div></div>" +
      '<button class="hc-rst" data-act="hcReset" aria-label="' + t("reset") + '">' + I.reset + "</button>";
  }
  function homeCounter(info) {
    var st = hcState(info);
    return '<div class="sec"><h2>' + t("hcTitle") + (info.cur ? " · " + pName(info.cur) : "") + '</h2><button class="link" data-act="tab" data-v="adhkar">' + t("adhkar") + "</button></div>" +
      '<div class="hc" id="hc">' + hcInner(st, info) + "</div>";
  }

  /* ---- Ramadan ---- */
  function rmState(info) {
    var n = info.now, tt = info.tt;
    if (n.secs < tt.fajr * 60) return { lbl: t("untilSuhoor"), left: tt.fajr * 60 - n.secs, k: "s" };
    if (n.secs < tt.maghrib * 60) return { lbl: t("untilIftar"), left: tt.maghrib * 60 - n.secs, k: "i" };
    return { lbl: t("untilSuhoor"), left: times(shift(info.today, 1)).fajr * 60 + 86400 - n.secs, k: "s" };
  }
  function ramadanCard(info) {
    if (!rmActive(info.today)) return "";
    var h = hParts(info.today), st = rmState(info), tt = info.tt, tm = st.k === "s" && info.now.secs >= tt.maghrib * 60 ? times(shift(info.today, 1)) : tt;
    return '<div class="rmcard"><div class="rmtop">' + I.moon + "<b>" + (h.m === 9 ? t("ramadanDay") + " " + h.d : t("ramadan")) + '</b><span id="rmcd">' + cdText(st.left) + " " + st.lbl + "</span></div>" +
      '<div class="rmrow"><div class="' + (st.k === "s" ? "on" : "") + '"><small>' + t("suhoorEnds") + "</small><b>" + fmtT(tm.fajr) + '</b></div><div class="' + (st.k === "i" ? "on" : "") + '"><small>' + t("iftar") + "</small><b>" + fmtT(tt.maghrib) + "</b></div></div></div>";
  }
  function ramadanScreen() {
    var today = todayO(), h = hParts(today), start = null, i;
    if (h.m === 9) start = hStart(today);
    else for (i = 1; i < 400; i++) { var o = shift(today, i), hp = hParts(o); if (hp.m === 9 && hp.d === 1) { start = o; break; } }
    var rows = [], hi = -1, html = '<div class="screen">' + header(t("ramadanTitle"), "home") + '<div style="height:14px"></div>';
    if (!start) return html + '<p class="note">–</p></div>';
    var hy = hParts(start).y;
    html += '<div class="dnav"><div class="dt"><b>' + t("ramadan") + " " + hy + (S.lang === "ml" ? " ഹി." : " AH") + "</b><small>" + L(place()) + " · " + (h.m === 9 ? t("ramadanDay") + " " + h.d : t("ramadanStarts") + ": " + gDate(start, true)) + "</small></div></div>";
    html += '<div class="card"><table class="month rm"><thead><tr><th>#</th><th>' + t("dateCol") + "</th><th>" + t("suhoorEnds") + "</th><th>" + t("iftar") + "</th></tr></thead><tbody>";
    for (i = 0; i < 30; i++) {
      var od = shift(start, i), hp2 = hParts(od); if (hp2.m !== 9) break;
      var tt = times(od), cur = same(od, today); if (cur) hi = i;
      rows.push([String(hp2.d), gDate(od, true), fmtT(tt.fajr), fmtT(tt.maghrib)]);
      html += '<tr class="' + (cur ? "today" : "") + (hp2.d === 27 || hp2.d === 17 ? " ev" : "") + '"><td class="d">' + hp2.d + "</td><td>" + gDate(od, true) + "</td><td>" + fmtT(tt.fajr) + "</td><td><b>" + fmtT(tt.maghrib) + "</b></td></tr>";
    }
    UI.table = { title: t("ramadanTitle") + " " + hy, sub: L(place()), head: ["#", t("dateCol"), t("suhoorEnds"), t("iftar")], rows: rows, hi: hi };
    html += "</tbody></table></div>" + shareBtns() + '<p class="note">' + t("ramadanNote") + "</p></div>";
    return html;
  }
  function shareBtns() {
    return '<div class="actrow"><button class="btn ghost" data-act="shareTable">' + I.share + t("share") + "</button>" +
      (isNative ? "" : '<button class="btn ghost" data-act="print">' + I.print + t("print") + "</button>") + "</div>";
  }

  /* ---- Hijri calendar ---- */
  function upcoming(n) {
    var today = todayO(), out = [], i, o, h, ev;
    for (i = 0; i < 400 && out.length < n; i++) {
      o = shift(today, i); h = hParts(o); ev = eventsOn(h);
      ev.forEach(function (e) { if (out.length < n) out.push({ o: o, e: e, d: i, h: h }); });
    }
    return out;
  }
  function evRow(x) {
    return '<div class="evrow"><div class="evd"><b>' + x.h.d + "</b><small>" + hMonth(x.h.m) + '</small></div><div class="evn"><b>' + L(x.e) + "</b><small>" + gDate(x.o, true) + "</small></div>" +
      '<span class="evin">' + (x.d === 0 ? t("todayEv") : fill(t("inDays"), { n: x.d })) + "</span></div>";
  }
  function upcomingHtml(n, noLink) {
    var u = upcoming(n); if (!u.length) return "";
    return '<div class="sec"><h2>' + t("upcoming") + "</h2>" + (noLink ? "" : '<button class="link" data-act="goHijri">' + t("hijriCal") + "</button>") + '</div><div class="card">' + u.map(evRow).join("") + "</div>";
  }
  function hijriView() {
    var today = todayO(); if (!UI.hv) UI.hv = today;
    var st = hStart(UI.hv), h0 = hParts(st), days = [], i;
    for (i = 0; i < 31; i++) { var o = shift(st, i), h = hParts(o); if (h.m !== h0.m) break; days.push({ o: o, h: h }); }
    var wd0 = new Date(Date.UTC(st.y, st.m - 1, st.d, 12)).getUTCDay();
    var g1 = new Date(Date.UTC(st.y, st.m - 1, st.d, 12)), g2 = days[days.length - 1].o, g2d = new Date(Date.UTC(g2.y, g2.m - 1, g2.d, 12));
    var gl = g1.toLocaleDateString(loc(), { month: "short", timeZone: "UTC" }) + (g1.getUTCMonth() !== g2d.getUTCMonth() ? " – " + g2d.toLocaleDateString(loc(), { month: "short", year: "numeric", timeZone: "UTC" }) : " " + g1.getUTCFullYear());
    var html = '<div class="dnav"><button class="arrow" data-act="hStep" data-v="-1">' + I.left + '</button><div class="dt"><b>' + hMonth(h0.m) + " " + h0.y + "</b><small>" + gl + '</small></div><button class="arrow" data-act="hStep" data-v="1">' + I.right + "</button></div>";
    html += '<div class="card hcal"><div class="hgrid">';
    for (i = 0; i < 7; i++) html += '<div class="hwd">' + new Date(Date.UTC(2024, 0, 7 + i, 12)).toLocaleDateString(loc(), { weekday: "narrow", timeZone: "UTC" }) + "</div>";
    for (i = 0; i < wd0; i++) html += "<div></div>";
    var evs = [];
    days.forEach(function (x) {
      var ev = eventsOn(x.h), cls = "hday" + (same(x.o, today) ? " today" : "") + (ev.length ? " ev" : "") + (new Date(Date.UTC(x.o.y, x.o.m - 1, x.o.d, 12)).getUTCDay() === 5 ? " fri" : "");
      ev.forEach(function (e) { evs.push({ o: x.o, e: e, h: x.h, d: Math.round((Date.UTC(x.o.y, x.o.m - 1, x.o.d) - Date.UTC(today.y, today.m - 1, today.d)) / 86400000) }); });
      html += '<div class="' + cls + '"><b>' + x.h.d + "</b><small>" + x.o.d + "</small></div>";
    });
    html += "</div></div>";
    if (evs.length) html += '<div class="sec"><h2>' + t("eventsMonth") + '</h2></div><div class="card">' + evs.map(function (x) {
      var r = evRow(x); return x.d < 0 ? r.replace(/<span class="evin">.*?<\/span>/, "") : r;
    }).join("") + "</div>";
    html += upcomingHtml(5, true);
    return html + '<p class="note">' + t("hijriNote") + "</p>";
  }

  function timesScreen() {
    var n = nowL(), today = { y: n.y, m: n.m, d: n.d };
    if (!UI.view) UI.view = today;
    var o = UI.view, isY = same(o, shift(today, -1)), isT = same(o, today), isTm = same(o, shift(today, 1));
    var h = '<div class="screen">' + header(t("times")) + '<div style="height:14px"></div>' +
      '<div class="seg"><button class="' + (UI.mode === "day" ? "on" : "") + '" data-act="mode" data-v="day">' + t("dayView") + '</button><button class="' + (UI.mode === "month" ? "on" : "") + '" data-act="mode" data-v="month">' + t("monthView") + '</button><button class="' + (UI.mode === "hijri" ? "on" : "") + '" data-act="mode" data-v="hijri">' + t("hijri") + "</button></div>";
    if (UI.mode === "hijri") return h + hijriView() + "</div>";
    if (UI.mode === "day") {
      h += '<div class="seg"><button class="' + (isY ? "on" : "") + '" data-act="jump" data-v="-1">' + t("yesterday") + '</button><button class="' + (isT ? "on" : "") + '" data-act="jump" data-v="0">' + t("today") + '</button><button class="' + (isTm ? "on" : "") + '" data-act="jump" data-v="1">' + t("tomorrow") + "</button></div>";
      h += '<div class="dnav"><button class="arrow" data-act="step" data-v="-1">' + I.left + '</button><label class="dt"><b>' + gDate(o) + "</b><small>" + hDate(o) + '</small><input type="date" id="datepick" value="' + iso(o) + '" aria-label="' + t("pickDate") + '"></label><button class="arrow" data-act="step" data-v="1">' + I.right + "</button></div>";
      h += '<div class="card">' + prayerRows(o, times(o), isT ? nextInfo() : null) + "</div>";
    } else {
      var first = { y: o.y, m: o.m, d: 1 }, dim = new Date(Date.UTC(o.y, o.m, 0)).getUTCDate();
      var mName = new Date(Date.UTC(o.y, o.m - 1, 15)).toLocaleDateString(loc(), { month: "long", year: "numeric", timeZone: "UTC" });
      h += '<div class="dnav"><button class="arrow" data-act="stepMonth" data-v="-1">' + I.left + '</button><div class="dt"><b>' + mName + '</b><small>' + L(place()) + '</small></div><button class="arrow" data-act="stepMonth" data-v="1">' + I.right + "</button></div>";
      var rows = [], hi = -1;
      h += '<div class="printhead"><b>' + t("timetable") + " · " + mName + "</b><span>" + L(place()) + " · Kerala Prayer Times</span></div>";
      h += '<div class="card"><table class="month"><thead><tr><th>' + (S.lang === "ml" ? "തീയതി" : "Date") + "</th>" + PR.map(function (p) { return "<th>" + L(p) + "</th>"; }).join("") + "</tr></thead><tbody>";
      for (var d = 1; d <= dim; d++) {
        var od = { y: o.y, m: o.m, d: d }, tt = times(od), wd = new Date(Date.UTC(o.y, o.m - 1, d, 12)).toLocaleDateString(loc(), { weekday: "short", timeZone: "UTC" });
        if (same(od, today)) hi = d - 1;
        rows.push([d + " " + wd].concat(PR.map(function (p) { return fmtT(tt[p.k]).replace(" AM", "").replace(" PM", ""); })));
        h += '<tr class="' + (same(od, today) ? "today" : "") + '"><td class="d">' + d + '<br><small style="font-weight:400;color:var(--muted)">' + wd + "</small></td>" +
          PR.map(function (p) { return '<td class="' + (p.sun ? "sun" : "") + '">' + fmtT(tt[p.k]).replace(" AM", "").replace(" PM", "") + "</td>"; }).join("") + "</tr>";
      }
      h += "</tbody></table></div>" + shareBtns();
      UI.table = { title: t("timetable") + " · " + mName, sub: L(place()), head: [t("dateCol")].concat(PR.map(function (p) { return L(p); })), rows: rows, hi: hi };
      void first;
    }
    return h + '<p class="note">' + t("aboutText").split(".")[0] + ".</p></div>";
  }

  /* ---- Qibla ---- */
  var CMP = { on: false, heading: null, buzzed: false, handler: null, needTap: false };
  function qiblaScreen() {
    var P = place(), q = PrayCalc.qibla(P.lat, P.lng);
    return '<div class="screen">' + header(t("qiblaTitle")) +
      '<div class="compass-wrap"><div class="compass"><div class="kaaba-top"></div><div class="dial" id="dial"></div><div class="needle" id="needle"></div></div></div>' +
      '<div class="qinfo"><div class="deg">' + Math.round(q.bearing) + '°</div><div class="sub">' + t("qiblaFrom") + " · " + t("distance") + ": " + Math.round(q.km).toLocaleString() + " km</div></div>" +
      '<div class="qstat" id="qstat">' + (CMP.on && CMP.heading != null ? t("turn") : t("compassHint")) + "</div>" +
      (CMP.needTap ? '<button class="btn" data-act="startCompass">' + t("enableCompass") + "</button>" : "") + "</div>";
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
    if (CMP.on) return;
    function listen() {
      CMP.on = true; CMP.heading = null; CMP.needTap = false;
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
      if (UI.tab === "qibla" && $("#qstat") && !$("#dial").innerHTML) render();
      setTimeout(function () { if (CMP.on && CMP.heading == null) { var st = $("#qstat"); if (st) st.textContent = t("noCompass"); } }, 4000);
    }
    if (DO && typeof DO.requestPermission === "function") {
      // iPhone asks once for motion access; if it needs a tap, show a single button as fallback.
      DO.requestPermission().then(function (r) { if (r === "granted") listen(); else { CMP.needTap = true; render(); } })
        .catch(function () { CMP.needTap = true; if (UI.tab === "qibla") render(); });
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
    var h = '<div class="screen">' + header(t("adhkarTitle")) + '<div style="height:14px"></div>' +
      '<button class="linkcard" data-act="tab" data-v="tasbih"><span class="ti">' + I.tasbih + "</span><span><b>" + t("tasbihTitle") + "</b><small>" + t("tapCircle") + "</small></span>" + I.right + "</button>" +
      '<div class="pchips">' +
      FIVE.map(function (k) { return '<button class="' + (k === pk ? "on" : "") + '" data-act="dkP" data-v="' + k + '">' + pName(k) + "</button>"; }).join("") + "</div>";
    items.forEach(function (x) {
      var need = (x.countFM && (pk === "fajr" || pk === "maghrib")) ? x.countFM : x.count, key = pk + ":" + x.id, c = UI.counts[key] || 0, done = c >= need;
      h += '<div class="dk' + (done ? " done" : "") + '"><div class="dt"><b>' + L(x.title) + '</b><span class="cnt">' + need + "× </span></div>" +
        '<div class="ar">' + x.ar + "</div>" + (x.tr ? '<div class="tr">' + x.tr + "</div>" : "") + '<div class="en">' + (S.lang === "ml" && x.ml ? x.ml : x.en) + "</div>" +
        '<div class="src">' + t("source") + ": " + x.src + "</div>" +
        '<div class="counter"><button class="tap" data-act="count" data-v="' + x.id + '" data-n="' + need + '">' + (done ? "✓ " + t("done") : c + " / " + need) + '</button><button class="rst" data-act="resetOne" data-v="' + x.id + '">' + t("reset") + "</button></div></div>";
    });
    return h + '<p class="note">' + t("reviewNote") + "</p></div>";
  }

  /* ---- Tasbih ---- */
  var TBC = 2 * Math.PI * 120;
  function tbOffset() { var b = S.tb, tg = +b.target; return tg > 0 ? TBC * (1 - b.count / tg) : TBC * (1 - (b.count % 100) / 100); }
  function tasbihScreen() {
    var b = S.tb, d = DH[b.i] || DH[0];
    var h = '<div class="screen">' + header(t("tasbihTitle"), "adhkar") + '<div style="height:14px"></div><div class="pchips">' +
      DH.map(function (x, i) { return '<button class="' + (i === b.i ? "on" : "") + '" data-act="tbDhikr" data-v="' + i + '">' + L(x) + "</button>"; }).join("") + "</div>";
    h += '<div class="tsb-wrap"><button class="tsb" data-act="tbTap" aria-label="count"><svg viewBox="0 0 260 260"><circle cx="130" cy="130" r="120" class="bgc" stroke-width="12" fill="none"/>' +
      '<circle id="tbRing" cx="130" cy="130" r="120" class="fgc" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="' + TBC.toFixed(1) + '" stroke-dashoffset="' + tbOffset().toFixed(1) + '" transform="rotate(-90 130 130)"/></svg>' +
      '<div class="tin"><div class="tar">' + d.ar + '</div><div class="tnum" id="tbCount">' + b.count + '</div><div class="ttg">' + (+b.target ? "/ " + b.target : "∞") + "</div></div></button></div>";
    h += '<div class="tstats"><div><small>' + t("rounds") + '</small><b id="tbRounds">' + b.rounds + "</b></div><div><small>" + t("total") + '</small><b id="tbTotal">' + b.total + "</b></div>" +
      '<button class="rbtn" data-act="tbReset" aria-label="' + t("reset") + '">' + I.reset + "</button></div>";
    h += '<div class="sgt">' + t("target") + '</div><div class="seg">' + [33, 99, 100, 0].map(function (n) {
      return '<button class="' + (+b.target === n ? "on" : "") + '" data-act="tbTarget" data-v="' + n + '">' + (n || t("unlimited")) + "</button>";
    }).join("") + "</div>";
    return h + '<p class="note">' + L(d) + "</p></div>";
  }
  var tbSaveT = null;
  function tbSave() { clearTimeout(tbSaveT); tbSaveT = setTimeout(function () { save(true); }, 700); }

  /* ---- Adhan reliability check (setup) ---- */
  function widgetMock() {
    var info = nextInfo(), tt = info.tomorrow ? times(shift(info.today, 1)) : info.tt;
    return '<div class="wmock"><div class="wtop"><span>' + L(place()) + "</span><span>" + gDate(info.tomorrow ? shift(info.today, 1) : info.today, true) + "</span></div>" +
      '<div class="wmid"><div><small>' + t("next") + "</small><b>" + pName(info.next) + '</b></div><div class="wr"><b id="wcd">' + cdText(info.left) + "</b><small>" + fmtT(info.at) + "</small></div></div>" +
      '<div class="wrow">' + PR.map(function (p) { return '<div class="' + (p.k === info.next ? "on" : "") + '"><small>' + L(p) + "</small><b>" + fmtT(tt[p.k]).replace(" AM", "").replace(" PM", "") + "</b></div>"; }).join("") + "</div></div>";
  }
  function stRow(icon, title, help, state, act, btn) {
    // state: true = ok, false = needs action, null = info only, "web" = phone only
    var badge = state === true ? '<span class="stb ok">✓</span>' : state === false ? '<button class="stb fix" data-act="' + act + '">' + (btn || t("fix")) + "</button>" :
      state === "web" ? '<span class="stb na">' + t("phoneOnly") + "</span>" : act ? '<button class="stb go" data-act="' + act + '">' + btn + "</button>" : "";
    return '<div class="strow"><div class="sti">' + icon + '</div><div class="stt"><b>' + title + "</b><small>" + help + "</small></div>" + badge + "</div>";
  }
  function setupScreen() {
    var and = platform === "android", ios = platform === "ios";
    var h = '<div class="screen">' + header(t("setupTitle"), "settings") + '<p class="lead">' + t("setupSub") + '</p><div class="sgrp">';
    h += stRow(I.bell, t("stNotif"), t("stNotifHelp"), isNative ? !UI.notifOff : "web", "askNotif");
    if (and || !isNative) h += stRow(I.times, t("stExact"), t("stExactHelp"), isNative ? !UI.exactOff : "web", "fixExact");
    if (and || !isNative) h += stRow(I.shield, t("stBattery"), t("stBatteryHelp"), isNative ? (UI.batt === null ? null : UI.batt) : "web", "openBattery", UI.batt === null ? t("fix") : undefined);
    h += stRow(I.speaker, t("stSound"), t("stSoundHelp"), null, "testAdhan", t("test"));
    h += stRow(I.widget, t("stWidget"), ios ? t("widgetIos") : t("stWidgetHelp"), ios ? null : isNative ? null : "web", ios ? "" : "addWidget", t("addWidget"));
    h += stRow(I.moon, t("stKeep"), fill(t("stKeepHelp"), { n: UI.schedDays }), null);
    h += "</div>";
    if (!ios) {
      var mk = (UI.maker || "").toLowerCase(), tips = [["samsung", "tipSamsung"], ["xiaomi|redmi|poco", "tipXiaomi"], ["oppo|realme|vivo|oneplus", "tipOppo"]];
      h += '<div class="sgt">' + t("brandTip") + '</div><div class="sgrp tips">' + tips.map(function (x) {
        return '<div class="tip' + (mk && new RegExp(x[0]).test(mk) ? " me" : "") + '">' + t(x[1]) + "</div>";
      }).join("") + '<div class="tip">' + t("tipOther") + "</div></div>";
    }
    if (!ios) h += '<div class="sgt">' + t("widgetTitle") + "</div>" + widgetMock() + '<p class="note">' + t("widgetHelp") + "</p>";
    return h + (isNative ? '<button class="btn ghost" data-act="recheck">' + t("check") + "</button>" : "") + "</div>";
  }
  function issues() { if (!isNative) return 0; return (UI.notifOff ? 1 : 0) + (UI.exactOff ? 1 : 0) + (UI.batt === false ? 1 : 0); }
  async function refreshBattery() {
    if (!KN) return;
    try { var r = await KN.batteryStatus(); UI.batt = !!r.unrestricted; UI.maker = r.manufacturer || ""; } catch (e) { UI.batt = null; }
  }

  /* ---- Settings ---- */
  function sel(id, opts, val) {
    return '<select data-set="' + id + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(val) ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select>";
  }
  function settingsScreen() {
    var h = '<div class="screen">' + header(t("settings")) + banners(), nI = issues();
    h += '<div style="height:14px"></div><div class="sgrp"><div class="srow" data-act="tab" data-v="setup"><span class="sti sm">' + I.shield + '</span><div class="sl"><b>' + t("setupRow") + "</b><small>" +
      (nI ? nI + " ⚠" : t("setupSub")) + "</small></div>" + I.right.replace("<svg", '<svg width="18" height="18"') + "</div></div>";
    h += '<div class="sgt">' + t("location") + '</div><div class="sgrp"><div class="srow" data-act="openDistrict"><div class="sl">' + t("changeDistrict") + "<small>" + L(place()) + '</small></div><span class="val">' + I.right.replace("<svg", '<svg width="18" height="18"') + "</span></div></div>";
    h += '<div class="sgt">' + t("adhanSection") + '</div><div class="sgrp">' +
      '<div class="srow" data-act="soundSheet" data-v="sound"><div class="sl">' + t("adhanSound") + "<small>" + L(adhan(S.sound)) + "</small></div>" + I.right.replace("<svg", '<svg width="18" height="18"') + "</div>" +
      '<div class="srow" data-act="soundSheet" data-v="fajrSound"><div class="sl">' + t("fajrSound") + "<small>" + L(adhan(S.fajrSound)) + "</small></div>" + I.right.replace("<svg", '<svg width="18" height="18"') + "</div>" +
      '<div class="srow"><div class="sl">' + t("preReminder") + "</div>" + sel("pre", [[0, t("none")], [5, "5 " + t("minBefore")], [10, "10 " + t("minBefore")], [15, "15 " + t("minBefore")], [20, "20 " + t("minBefore")], [30, "30 " + t("minBefore")]], S.pre) + "</div>" +
      '<div class="srow" data-act="testAdhan"><div class="sl" style="color:var(--p);font-weight:700">' + t("testAdhan") + "</div>" + I.play.replace("<svg", '<svg width="18" height="18" style="color:var(--p)"') + "</div></div>";
    h += '<div class="sgt">' + t("perPrayer") + '</div><div class="sgrp">' + PR.map(function (p) {
      var opts = p.sun ? ["notify", "off"] : ["adhan", "notify", "off"];
      var own = S.ps[p.k];
      return '<div class="srow"><div class="sl">' + L(p) + (S.modes[p.k] === "adhan" ? '<button class="pslink" data-act="soundSheet" data-v="ps:' + p.k + '">' + I.speaker.replace("<svg", '<svg width="13" height="13"') + "<span>" + L(adhan(soundFor(p.k))) + (own ? "" : " · " + t("sameMain")) + "</span></button>" : "") + '</div><div class="mode3">' + opts.map(function (m) {
        return '<button class="' + (S.modes[p.k] === m ? "on" : "") + '" data-act="setMode" data-v="' + p.k + '" data-m="' + m + '">' + t(m === "adhan" ? "modeAdhan" : m === "notify" ? "modeNotify" : "modeOff") + "</button>";
      }).join("") + "</div></div>";
    }).join("") + "</div>";
    h += '<div class="sgt">' + t("ramadanSection") + '</div><div class="sgrp">' +
      '<div class="srow"><div class="sl">' + t("ramadanMode") + "</div>" + sel("ramadan", [["auto", t("rmAuto")], ["on", t("rmOn")], ["off", t("rmOff")]], S.ramadan) + "</div>" +
      '<div class="srow"><div class="sl">' + t("suhoorRem") + "</div>" + sel("suhoor", [[0, t("none")], [30, "30 " + t("minBeforeFajr")], [45, "45 " + t("minBeforeFajr")], [60, "60 " + t("minBeforeFajr")], [90, "90 " + t("minBeforeFajr")]], S.suhoor) + "</div>" +
      '<div class="srow"><div class="sl">' + t("jumuah") + "</div>" + sel("jumuah", [[0, t("none")], [30, "30 " + t("minBeforeDhuhr")], [60, "60 " + t("minBeforeDhuhr")], [90, "90 " + t("minBeforeDhuhr")], [120, "120 " + t("minBeforeDhuhr")]], S.jumuah) + "</div>" +
      '<div class="srow" data-act="goRamadan"><div class="sl">' + t("ramadanTitle") + "</div>" + I.right.replace("<svg", '<svg width="18" height="18"') + "</div></div>";
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
      '<div class="srow"><div class="sl">' + t("homeBg") + "</div>" + sel("bg", [["bluehour", t("bgBlue")], ["sunrise", t("bgSunrise")], ["kerala", t("bgKerala")], ["image", t("bgImage")], ["sky", t("bgSky")]], S.bg) + "</div>" +
      '<div class="srow"><div class="sl">' + t("theme") + "</div>" + sel("theme", [["auto", t("themeAuto")], ["light", t("themeLight")], ["dark", t("themeDark")]], S.theme) + "</div></div>";
    h += '<div class="sgt">' + t("about") + '</div><div class="sgrp"><div class="srow"><div class="sl" style="font-size:.85rem;line-height:1.5">' + t("aboutText") + "<small>v2.9 · 12 Nov 2026</small></div></div>" +
      '<div class="srow" data-act="credits"><div class="sl">' + t("credits") + "</div>" + I.right.replace("<svg", '<svg width="18" height="18"') + "</div>" +
      '<div class="srow" data-act="privacy"><div class="sl">' + t("privacy") + "</div>" + I.right.replace("<svg", '<svg width="18" height="18"') + "</div></div>";
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
    else if (UI.sheet === "credits") h += "<h3>" + t("credits") + '</h3><div class="sgrp"><div class="srow"><div class="sl" style="font-size:.86rem;line-height:1.5">' + t("creditsIntro") + "</div></div>" +
      ADH.filter(function (a) { return a.credit; }).map(function (a) {
        return '<div class="srow"><div class="sl">' + L(a) + "<small>" + t("recBy") + ": " + a.credit + "<br>commons.wikimedia.org/wiki/File:" + a.src.replace(/ /g, "_") + "</small></div></div>";
      }).join("") + '<div class="srow"><div class="sl" style="font-size:.84rem">' + t("fonts") + "</div></div></div>";
    else if (UI.sheet === "privacy") h += "<h3>" + t("privacy") + '</h3><div class="sgrp"><div class="srow"><div class="sl" style="line-height:1.6;font-size:.92rem">' + t("privacyText") + "</div></div></div>";
    else {
      var key = UI.sheet, pk = key.indexOf("ps:") === 0 ? key.slice(3) : null, cur = pk ? (S.ps[pk] || "") : S[key];
      h += "<h3>" + (pk ? t("adhanFor") + " " + pName(pk) : t(key === "sound" ? "adhanSound" : "fajrSound")) + '</h3><p class="lead" style="margin:0 20px 12px">' + t("adhanPickHelp") + '</p><div class="sgrp">' +
        (pk ? '<div class="sound' + (cur === "" ? " sel" : "") + '" data-act="pickSound" data-v=""><span class="rad"></span><div class="sn">' + t("sameMain") + '<small class="cr">' + L(adhan(pk === "fajr" ? S.fajrSound : S.sound)) + "</small></div></div>" : "") +
        ADH.map(function (a) {
        var ok = soundOk(a.id);
        return '<div class="sound' + (cur === a.id ? " sel" : "") + '" data-act="pickSound" data-v="' + a.id + '"><span class="rad"></span><div class="sn">' + L(a) +
          (a.credit ? '<small class="cr">' + t("recBy") + ": " + a.credit + "</small>" : "") + (ok ? "" : "<small>" + t("notInstalled") + "</small>") + "</div>" +
          (a.system ? "" : '<button class="pl" data-act="preview" data-v="' + a.id + '">' + (PLAY.id === a.id ? (PLAY.loading ? '<span class="spin"></span>' : I.stop) : I.play) + "</button>") + "</div>";
      }).join("") + "</div>";
    }
    return h + "</div>";
  }

  /* ---- Onboarding ---- */
  function onboarding() {
    return '<div class="onb"><span class="stars1"></span><span class="stars2"></span><span class="stars3"></span><span class="shoot"></span><button class="langsw" data-act="toggleLang">' + (S.lang === "ml" ? "English" : "മലയാളം") + "</button>" +
      '<img class="logo" src="img/icon-192.png" alt=""><h1>' + t("welcome") + "</h1><p>" + t("welcomeSub") + "</p>" + districtGrid(false) + "</div>";
  }

  function applyTheme() {
    var dark = S.theme === "dark" || (S.theme === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }

  /* ---------------- Audio ---------------- */
  var PLAY = { id: null, audio: null, loading: false };
  function audioUrl(id) { var a = adhan(id); if (window.KPT_REMOTE_ADHAN && a.src && !a.builtin) return "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(a.src.replace(/ /g, "_"));
    return a.builtin ? (window.KPT_CHIME || "audio/chime.wav") : "audio/adhan_" + id + ".mp3"; }
  function sheetRefresh() { if (UI.sheet && UI.sheet !== "district" && UI.sheet !== "credits" && UI.sheet !== "privacy") render(); }
  function playSound(id, onEnd) {
    stopSound(); if (adhan(id).system) return;
    var rid = resolveSound(id), urls = (window.KPT_REMOTE_ADHAN && window.KPT_ADHAN_URLS && window.KPT_ADHAN_URLS[rid]) || [audioUrl(rid)], i = 0;
    var au = new Audio(); au.preload = "auto"; PLAY.id = id; PLAY.audio = au; PLAY.loading = true;
    au.addEventListener("playing", function () { if (PLAY.audio === au && PLAY.loading) { PLAY.loading = false; sheetRefresh(); } });
    au.addEventListener("error", function () {
      if (PLAY.audio !== au) return;
      if (++i < urls.length) { au.src = urls[i]; au.play().catch(function () { }); }
      else { PLAY.id = null; PLAY.loading = false; sheetRefresh(); toast(t("shareFail").split(".")[0]); }
    });
    au.onended = function () { if (PLAY.audio !== au) return; PLAY.id = null; PLAY.loading = false; if (onEnd) onEnd(); sheetRefresh(); };
    au.src = urls[0];
    au.play().catch(function (e) { if (e && e.name === "NotAllowedError") { PLAY.id = null; PLAY.loading = false; sheetRefresh(); } });
  }
  function stopSound() { if (PLAY.audio) { try { PLAY.audio.pause(); PLAY.audio.removeAttribute("src"); } catch (e) { } } PLAY.audio = null; PLAY.id = null; PLAY.loading = false; }
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
    if (platform !== "android") playSound(soundFor(k), function () { ov.remove(); });
  }

  /* ---------------- Notifications ---------------- */
  function soundFileFor(id) {
    var a = adhan(id); if (a.system) return null;
    if (a.builtin) return "chime.wav";
    return platform === "ios" ? "adhan_" + id + ".wav" : "adhan_" + id + ".mp3";
  }
  async function ensureChannels() {
    var ids = {}; ids[resolveSound(S.sound)] = 1; ids[resolveSound(S.fajrSound)] = 1;
    PR.forEach(function (p) { if (!p.sun) ids[resolveSound(soundFor(p.k))] = 1; });
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
    if (S.district === null) return;
    pushWidget();
    if (!LN) return;
    try {
      var perm = await LN.checkPermissions();
      UI.notifOff = perm.display !== "granted";
      if (platform === "android" && LN.checkExactNotificationSetting) {
        try { var ex = await LN.checkExactNotificationSetting(); UI.exactOff = ex && ex.exact_alarm && ex.exact_alarm !== "granted"; } catch (e) { }
      }
      if (UI.notifOff) { if (UI.tab === "home" || UI.tab === "settings" || UI.tab === "setup") render(); return; }
      if (platform === "android") await ensureChannels();
      var pend = await LN.getPending();
      if (pend.notifications && pend.notifications.length) await LN.cancel({ notifications: pend.notifications.map(function (n) { return { id: n.id }; }) });
      // Android can hold many alarms (30 days); iPhone allows only 64 pending notifications.
      var perDay = PR.filter(function (p) { return S.modes[p.k] !== "off"; }).length * (S.pre > 0 ? 2 : 1) + (S.suhoor > 0 && S.ramadan !== "off" ? 1 : 0) + (S.jumuah > 0 ? 0.2 : 0);
      var cap = platform === "android" ? 320 : 59;
      var days = Math.max(2, Math.min(platform === "android" ? 30 : 14, Math.floor(cap / Math.max(1, perDay))));
      UI.schedDays = days;
      var today = todayO(), list = [], now = Date.now(), P = place();
      for (var d = 0; d < days; d++) {
        var o = shift(today, d), tt = times(o), rm = rmActive(o);
        PR.forEach(function (p, idx) {
          var mode = S.modes[p.k], at = epoch(o, tt[p.k]), base = (o.y % 100) * 1000000 + o.m * 10000 + o.d * 100 + idx * 10;
          var nm = L(p), where = L(P);
          if (p.k === "fajr" && rm && S.suhoor > 0 && at - S.suhoor * 60000 > now) list.push({
            id: base + 7, title: t("suhoorTitle") + " · " + S.suhoor + " " + t("minBefore"), body: fill(t("suhoorBody"), { t: fmtT(tt.fajr) }) + " · " + where,
            schedule: { at: new Date(at - S.suhoor * 60000), allowWhileIdle: true }, channelId: platform === "android" ? "reminder_" + CH : undefined, extra: { k: "fajr", mode: "reminder" }
          });
          if (p.k === "dhuhr" && S.jumuah > 0 && isFri(o) && at - S.jumuah * 60000 > now) list.push({
            id: base + 8, title: t("jumuahTitle"), body: t("jumuahBody"),
            schedule: { at: new Date(at - S.jumuah * 60000), allowWhileIdle: true }, channelId: platform === "android" ? "reminder_" + CH : undefined, extra: { k: "dhuhr", mode: "reminder" }
          });
          if (mode === "off") return;
          if (at > now) {
            var body = p.sun ? (S.lang === "ml" ? "സൂര്യോദയം – സുബ്ഹിന്റെ സമയം കഴിഞ്ഞു" : "Sunrise – Fajr time has ended") :
              (S.lang === "ml" ? nm + " നിസ്കാരത്തിന് സമയമായി · " + where : "It's time for " + nm + " prayer · " + where);
            var title = (p.k === "maghrib" && rm ? t("iftarTime") + " · " : "") + nm + " · " + fmtT(tt[p.k]);
            var x = { id: base, title: title, body: body, schedule: { at: new Date(at), allowWhileIdle: true }, extra: { k: p.k, mode: mode } };
            if (mode === "adhan") {
              var sid = resolveSound(soundFor(p.k));
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
      list.sort(function (a, b) { return a.schedule.at - b.schedule.at; });
      list = list.slice(0, cap);
      // Last alert: remind the user to open the app so the next weeks are scheduled.
      if (list.length) {
        var last = list[list.length - 1].schedule.at.getTime() + 30 * 60000;
        list.push({ id: 1, title: t("keepTitle"), body: t("keepBody"), schedule: { at: new Date(last), allowWhileIdle: true }, channelId: platform === "android" ? "reminder_" + CH : undefined, extra: { mode: "keep" } });
        await LN.schedule({ notifications: list });
      }
    } catch (e) { console.warn("schedule failed", e); }
  }

  /* ---------------- Android home-screen widget ---------------- */
  function pushWidget() {
    if (!KN) return;
    try {
      var today = todayO(), days = [];
      for (var d = -1; d < 35; d++) {
        var o = shift(today, d), tt = times(o);
        days.push({ d: gDate(o, true), t: PR.map(function (p) { return epoch(o, tt[p.k]); }), s: PR.map(function (p) { return fmtT(tt[p.k]); }) });
      }
      var data = { place: L(place()), nextLbl: t("next"), names: PR.map(function (p) { return L(p); }), days: days };
      KN.setWidgetData({ json: JSON.stringify(data) }).catch(function () { });
    } catch (e) { }
  }
  async function askNotif() {
    if (!LN) return;
    try { await LN.requestPermissions(); } catch (e) { }
    reschedule(); setTimeout(render, 700);
  }

  /* ---------------- Share timetable as an image ---------------- */
  function drawTable(T) {
    var cols = T.head.length, W = 1080, P = 44, headH = 230, colH = 70, rowH = T.rows.length > 20 ? 52 : 64, footH = 110;
    var H = headH + colH + T.rows.length * rowH + footH, c = document.createElement("canvas"); c.width = W; c.height = H;
    var x = c.getContext("2d"), F = '"Manjari","Noto Sans Malayalam",-apple-system,Roboto,"Segoe UI",sans-serif';
    x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
    var g = x.createLinearGradient(0, 0, W, headH); g.addColorStop(0, "#0A4D3A"); g.addColorStop(1, "#1556A8"); x.fillStyle = g; x.fillRect(0, 0, W, headH);
    x.fillStyle = "#ffffff"; x.font = "800 54px " + F; x.textBaseline = "alphabetic"; x.fillText(T.title, P, 104);
    x.font = "500 34px " + F; x.globalAlpha = .9; x.fillText(T.sub + "  ·  Kerala Prayer Times", P, 162); x.globalAlpha = 1;
    var first = cols > 4 ? 190 : 120, cw = (W - 2 * P - first) / (cols - 1);
    function cx(i) { return i === 0 ? P + 14 : P + first + cw * (i - 1) + cw / 2; }
    var y = headH; x.fillStyle = "#E7F0FB"; x.fillRect(0, y, W, colH); x.fillStyle = "#0A4D3A"; x.font = "700 28px " + F;
    T.head.forEach(function (h, i) { x.textAlign = i === 0 ? "left" : "center"; x.fillText(h, cx(i), y + 45); });
    y += colH;
    T.rows.forEach(function (r, ri) {
      if (ri === T.hi) { x.fillStyle = "#D6E8FF"; x.fillRect(0, y, W, rowH); } else if (ri % 2) { x.fillStyle = "#F4F8F6"; x.fillRect(0, y, W, rowH); }
      x.fillStyle = ri === T.hi ? "#0B3F86" : "#13261F"; x.font = (ri === T.hi ? "800 " : "500 ") + (rowH > 60 ? 30 : 27) + "px " + F;
      r.forEach(function (v, i) { x.textAlign = i === 0 ? "left" : "center"; x.fillText(v, cx(i), y + rowH / 2 + 10); });
      y += rowH;
    });
    x.textAlign = "left"; x.fillStyle = "#62756F"; x.font = "500 24px " + F;
    x.fillText("Kerala standard: Fajr & Isha 18°, Shafi'i Asr" + (place().gps ? "" : ", IST"), P, y + 60);
    return c;
  }
  async function shareTable() {
    var T = UI.table; if (!T) return;
    toast(t("sharing"));
    try {
      var c = drawTable(T), name = "prayer-timetable.png";
      if (FS && SHARE) {
        var w = await FS.writeFile({ path: name, data: c.toDataURL("image/png").split(",")[1], directory: "CACHE" });
        await SHARE.share({ title: T.title, files: [w.uri] });
        return;
      }
      var blob = await new Promise(function (res) { c.toBlob(res, "image/png"); });
      var file = typeof File === "function" ? new File([blob], name, { type: "image/png" }) : null;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: T.title }); return; }
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    } catch (e) { if (!(e && e.name === "AbortError")) toast(t("shareFail")); }
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
    tab: function (el) {
      UI.tab = el.dataset.v; UI.sheet = null; if (UI.tab !== "times") UI.view = null;
      render(); window.scrollTo(0, 0);
      if (UI.tab === "qibla") startCompass();               // compass starts by itself
      if (UI.tab === "setup") { refreshBattery().then(function () { reschedule(); if (UI.tab === "setup") render(); }); }
    },
    goHijri: function () { UI.tab = "times"; UI.mode = "hijri"; UI.hv = null; render(); window.scrollTo(0, 0); },
    goRamadan: function () { UI.tab = "ramadan"; render(); window.scrollTo(0, 0); },
    hStep: function (el) { var st = hStart(UI.hv || todayO()); UI.hv = +el.dataset.v < 0 ? shift(st, -1) : shift(st, 30); render(); },
    shareTable: function () { shareTable(); },
    print: function () { try { window.print(); } catch (e) { } },
    privacy: function () { UI.sheet = "privacy"; render(); },
    credits: function () { UI.sheet = "credits"; render(); },
    tbTap: function () {
      var b = S.tb, tg = +b.target; b.count++; b.total++;
      if (tg > 0 && b.count >= tg) { b.rounds++; b.count = 0; try { if (HAP) HAP.vibrate({ duration: 300 }); else if (navigator.vibrate) navigator.vibrate([60, 60, 120]); } catch (e) { } toast("✓ " + tg); }
      else haptic();
      var c = $("#tbCount"); if (c) { c.textContent = b.count; $("#tbRounds").textContent = b.rounds; $("#tbTotal").textContent = b.total; $("#tbRing").setAttribute("stroke-dashoffset", tbOffset().toFixed(1)); }
      tbSave();
    },
    hcTap: function () {
      var info = nextInfo(), st = hcState(info), cur = HC[st.step]; if (!cur) return;
      st.count++;
      if (st.count >= cur.n) { st.step++; st.count = 0; try { if (navigator.vibrate) navigator.vibrate([40, 50, 40]); else haptic(); } catch (e) { } if (st.step >= HC.length) toast("✓ " + t("done")); }
      else haptic();
      $("#hc").innerHTML = hcInner(st, info); tbSave();
    },
    hcReset: function () { var info = nextInfo(), st = hcState(info); st.step = 0; st.count = 0; $("#hc").innerHTML = hcInner(st, info); tbSave(); },
    tbDhikr: function (el) { S.tb.i = +el.dataset.v; S.tb.count = 0; save(true); render(); },
    tbTarget: function (el) { S.tb.target = +el.dataset.v; S.tb.count = 0; save(true); render(); },
    tbReset: function () { S.tb.count = 0; S.tb.rounds = 0; S.tb.total = 0; save(true); render(); },
    openBattery: function () { if (KN) KN.openBatterySettings().catch(function () { }); },
    addWidget: async function () {
      if (!KN) { toast(t("widgetHelp")); return; }
      try { var r = await KN.pinWidget(); if (!r || !r.ok) toast(t("widgetHelp")); } catch (e) { toast(t("widgetHelp")); }
    },
    recheck: async function () { await refreshBattery(); await doSchedule(); render(); },
    openDistrict: function () { UI.sheet = "district"; render(); },
    closeSheet: function () { UI.sheet = null; stopSound(); render(); },
    pickDistrict: function (el) {
      var first = S.district === null; S.district = +el.dataset.v; UI.sheet = null; UI.view = null; UI.firstRun = false;
      if (first && isNative && !S.setupSeen) { S.setupSeen = true; UI.tab = "setup"; }
      save(); render(); if (first) askNotif();
    },
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
    pickSound: function (el, ev) {
      if (ev.target.closest(".pl")) return;
      var v = el.dataset.v, key = UI.sheet;
      if (key.indexOf("ps:") === 0) { if (v) S.ps[key.slice(3)] = v; else delete S.ps[key.slice(3)]; } else S[key] = v;
      if (v && !adhan(v).system) playSound(v);   // play a sample so the user hears the choice
      save(); render(); toast("✓ " + (v ? L(adhan(v)) : t("sameMain")));
    },
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
    if (el.id === "distSel") {
      UI.firstRun = false;
      if (el.value === "gps") { getGps(); render(); return; }
      S.district = +el.value; UI.view = null; haptic(); save(); render(); return;
    }
    var k = el.dataset && el.dataset.set; if (!k) return;
    var v = el.value; S[k] = ["asr", "pre", "hijriAdj", "suhoor", "jumuah"].indexOf(k) >= 0 ? +v : v;
    if (k === "hijriAdj") HCACHE = {};
    save(k === "theme"); render();
  });
  if (window.matchMedia) { try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { if (S.theme === "auto") render(); }); } catch (e) { } }

  /* ---------------- Live tick ---------------- */
  var lastMin = -1;
  function tick() {
    if (!S || S.district === null) return;
    var w = $("#wcd"); if (w) { var inf = nextInfo(); w.textContent = cdText(inf.left); }
    if (UI.tab !== "home") return;
    var info = nextInfo(), cd = $("#cd");
    var mn = Math.floor(info.now.secs / 60);
    if (mn !== lastMin && lastMin !== -1) { lastMin = mn; if (!UI.sheet) { render(); return; } }
    lastMin = mn;
    if (cd) {
      cd.textContent = cdText(info.left); $("#nxName").textContent = pName(info.next);
      var C = 2 * Math.PI * 42, r = $("#ringfg"); if (r) r.setAttribute("stroke-dashoffset", (C * (1 - info.frac)).toFixed(1));
    }
    var dm = $("#dayme"), df = $("#dayfill"); if (dm) { var pc = (info.now.secs / 864).toFixed(2) + "%"; dm.style.left = pc; df.style.width = pc; }
    var rc = $("#rmcd"); if (rc) { var st = rmState(info); rc.textContent = cdText(st.left) + " " + st.lbl; }
  }

  /* ---------------- Start ---------------- */
  async function start() {
    await load();
    render();
    if (UI.firstRun) { save(true); if (isNative) setTimeout(askNotif, 1200); }
    setInterval(tick, 1000);
    checkSounds();
    if (SB) { try { SB.setBackgroundColor({ color: "#0A4D3A" }); SB.setStyle({ style: "DARK" }); } catch (e) { } }
    if (APP) APP.addListener("appStateChange", function (s) {
      if (s.isActive) { UI.view = null; refreshBattery().then(function () { render(); reschedule(); }); } else stopCompass();
    });
    refreshBattery();
    if (UI.tab === "qibla") startCompass();
    if (LN) {
      LN.addListener("localNotificationReceived", function (n) { if (n.extra && n.extra.mode === "adhan") adhanOverlay(n.extra.k); });
      LN.addListener("localNotificationActionPerformed", function () {
        UI.tab = "home"; render();
      });
    }
    reschedule();
  }
  start();
})();
