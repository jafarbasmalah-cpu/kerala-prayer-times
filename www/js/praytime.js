/* Kerala Prayer Times - astronomical engine (PrayTimes-style algorithm).
   Verified to match the published Kerala (Suprabhatham) timetable to the minute
   with Karachi angles 18°/18°, Shafi'i Asr and no extra minutes. */
(function (G) {
  "use strict";
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  function dsin(d) { return Math.sin(d * D2R); }
  function dcos(d) { return Math.cos(d * D2R); }
  function dtan(d) { return Math.tan(d * D2R); }
  function darcsin(x) { return Math.asin(x) * R2D; }
  function darccos(x) { return Math.acos(Math.max(-1, Math.min(1, x))) * R2D; }
  function darctan2(y, x) { return Math.atan2(y, x) * R2D; }
  function darccot(x) { return Math.atan(1 / x) * R2D; }
  function fix(a, b) { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; }
  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }
  function sunPos(jd) {
    var D = jd - 2451545.0, g = fix(357.529 + 0.98560028 * D, 360), q = fix(280.459 + 0.98564736 * D, 360),
      L = fix(q + 1.915 * dsin(g) + 0.020 * dsin(2 * g), 360), e = 23.439 - 0.00000036 * D;
    var RA = fix(darctan2(dcos(e) * dsin(L), dcos(L)) / 15, 24);
    return { decl: darcsin(dsin(e) * dsin(L)), eqt: q / 15 - RA };
  }

  var METHODS = {
    karachi: { f: 18, i: 18 },
    mwl: { f: 18, i: 17 },
    egypt: { f: 19.5, i: 17.5 },
    makkah: { f: 18.5, im: 90 }
  };

  /* Returns minutes after local midnight (tz hours) for each time. */
  function compute(y, m, d, lat, lng, opts) {
    var M = METHODS[opts.method] || METHODS.karachi, tz = opts.tz == null ? 5.5 : opts.tz;
    var jd = julian(y, m, d) - lng / (15 * 24);
    function midDay(t) { return fix(12 - sunPos(jd + t).eqt, 24); }
    function sunAngleTime(angle, t, ccw) {
      var decl = sunPos(jd + t).decl, noon = midDay(t);
      var v = darccos((-dsin(angle) - dsin(decl) * dsin(lat)) / (dcos(decl) * dcos(lat))) / 15;
      return noon + (ccw ? -v : v);
    }
    function asrTime(f, t) {
      var decl = sunPos(jd + t).decl;
      return sunAngleTime(-darccot(f + dtan(Math.abs(lat - decl))), t);
    }
    var t = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, isha: 18 };
    for (var i = 0; i < 2; i++) {
      var p = {}; for (var k in t) p[k] = t[k] / 24;
      t = {
        fajr: sunAngleTime(M.f, p.fajr, true), sunrise: sunAngleTime(0.833, p.sunrise, true),
        dhuhr: midDay(p.dhuhr), asr: asrTime(opts.asr || 1, p.asr),
        sunset: sunAngleTime(0.833, p.sunset), isha: M.im ? 0 : sunAngleTime(M.i, p.isha)
      };
    }
    var adj = tz - lng / 15;
    for (var k2 in t) t[k2] += adj;
    if (M.im) t.isha = t.sunset + M.im / 60;
    t.maghrib = t.sunset;
    var out = {}, a = opts.adj || {};
    ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"].forEach(function (k) {
      out[k] = Math.round(t[k] * 60) + (parseInt(a[k], 10) || 0);
    });
    return out;
  }

  /* Qibla bearing (degrees from true north) and distance (km) to the Kaaba. */
  var KAABA = [21.422487, 39.826206];
  function qibla(lat, lng) {
    var p1 = lat * D2R, p2 = KAABA[0] * D2R, dl = (KAABA[1] - lng) * D2R;
    var b = Math.atan2(Math.sin(dl), Math.cos(p1) * Math.tan(p2) - Math.sin(p1) * Math.cos(dl)) * R2D;
    var a = Math.sin((p2 - p1) / 2) * Math.sin((p2 - p1) / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return { bearing: fix(b, 360), km: 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) };
  }

  G.PrayCalc = { compute: compute, qibla: qibla, METHODS: METHODS };
})(typeof window !== "undefined" ? window : globalThis);
