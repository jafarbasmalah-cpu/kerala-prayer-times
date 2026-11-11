/* Static data: districts, prayers, adhan sounds, UI text (English / Malayalam). */
(function (G) {
  "use strict";
  G.KPT_DATA = {
    DISTRICTS: [
      { en: "Thiruvananthapuram", ml: "തിരുവനന്തപുരം", lat: 8.5241, lng: 76.9366 },
      { en: "Kollam", ml: "കൊല്ലം", lat: 8.8932, lng: 76.6141 },
      { en: "Pathanamthitta", ml: "പത്തനംതിട്ട", lat: 9.2648, lng: 76.7870 },
      { en: "Alappuzha", ml: "ആലപ്പുഴ", lat: 9.4981, lng: 76.3388 },
      { en: "Kottayam", ml: "കോട്ടയം", lat: 9.5916, lng: 76.5222 },
      { en: "Idukki", ml: "ഇടുക്കി", lat: 9.8497, lng: 76.9720 },
      { en: "Ernakulam", ml: "എറണാകുളം", lat: 9.9816, lng: 76.2999 },
      { en: "Thrissur", ml: "തൃശൂർ", lat: 10.5276, lng: 76.2144 },
      { en: "Palakkad", ml: "പാലക്കാട്", lat: 10.7867, lng: 76.6548 },
      { en: "Malappuram", ml: "മലപ്പുറം", lat: 11.0510, lng: 76.0711 },
      { en: "Kozhikode", ml: "കോഴിക്കോട്", lat: 11.2588, lng: 75.7804 },
      { en: "Wayanad", ml: "വയനാട്", lat: 11.6085, lng: 76.0830 },
      { en: "Kannur", ml: "കണ്ണൂർ", lat: 11.8745, lng: 75.3704 },
      { en: "Kasaragod", ml: "കാസർകോട്", lat: 12.4996, lng: 74.9869 }
    ],
    PRAYERS: [
      { k: "fajr", en: "Fajr", ml: "സുബ്ഹ്", ar: "الفجر" },
      { k: "sunrise", en: "Sunrise", ml: "ഉദയം", ar: "الشروق", sun: true },
      { k: "dhuhr", en: "Dhuhr", ml: "ളുഹർ", ar: "الظهر" },
      { k: "asr", en: "Asr", ml: "അസ്ർ", ar: "العصر" },
      { k: "maghrib", en: "Maghrib", ml: "മഗ്‌രിബ്", ar: "المغرب" },
      { k: "isha", en: "Isha", ml: "ഇശാ", ar: "العشاء" }
    ],
    /* Adhan sounds. Place recordings in resources/adhan-source/<id>.mp3 and run `npm run setup:native`. */
    ADHANS: [
      { id: "makkah", en: "Makkah – Masjid al-Haram", ml: "മക്ക – മസ്ജിദുൽ ഹറാം" },
      { id: "madinah", en: "Madinah – Masjid an-Nabawi", ml: "മദീന – മസ്ജിദുന്നബവി" },
      { id: "alaqsa", en: "Al-Aqsa – Jerusalem", ml: "മസ്ജിദുൽ അഖ്സ" },
      { id: "mishary", en: "Mishary Rashid Alafasy", ml: "മിശാരി റാശിദ് അൽഅഫാസി" },
      { id: "egypt", en: "Egypt – Classic", ml: "ഈജിപ്ത് – ക്ലാസിക്" },
      { id: "kerala", en: "Kerala masjid", ml: "കേരള പള്ളി" },
      { id: "fajr_makkah", en: "Fajr adhan – Makkah", ml: "സുബ്ഹ് ബാങ്ക് – മക്ക", fajr: true },
      { id: "fajr_madinah", en: "Fajr adhan – Madinah", ml: "സുബ്ഹ് ബാങ്ക് – മദീന", fajr: true },
      { id: "chime", en: "Soft chime (built-in)", ml: "മൃദുവായ മണിനാദം (ഇൻ-ബിൽറ്റ്)", builtin: true },
      { id: "default", en: "Phone default sound", ml: "ഫോണിന്റെ സാധാരണ ശബ്ദം", system: true }
    ],
    T: {
      en: {
        appName: "Kerala Prayer Times", welcome: "Assalamu Alaikum", welcomeSub: "Choose your district to get accurate prayer times", chooseDistrict: "Select your district",
        useGps: "Use my exact location (GPS)", locating: "Finding your location…", gpsFail: "Couldn't get your location. Please allow location access.", myLocation: "My location",
        next: "Next prayer", in: "in", now: "Now", tomorrow: "Tomorrow", today: "Today", yesterday: "Yesterday",
        home: "Home", times: "Times", qibla: "Qibla", adhkar: "Adhkar", settings: "Settings",
        sunriseNote: "No prayer at sunrise", monthView: "Month", dayView: "Day", pickDate: "Pick a date",
        qiblaTitle: "Qibla direction", qiblaFrom: "from North", distance: "Distance to Makkah", startCompass: "Start compass",
        compassHint: "Hold your phone flat. Move it in a figure-8 to calibrate.", aligned: "You are facing the Qibla", turn: "Turn your phone until the arrow points up",
        noCompass: "Compass is not available on this device. Use the bearing above with a compass.",
        adhkarTitle: "After-prayer adhkar & duas", tapCount: "Tap to count", reset: "Reset", done: "Done", times_: "times", source: "Source",
        adhanSection: "Adhan", adhanSound: "Adhan sound", fajrSound: "Fajr adhan sound", perPrayer: "Alert for each prayer",
        modeAdhan: "Adhan", modeNotify: "Notification", modeOff: "Off", preReminder: "Reminder before prayer", minBefore: "min before", none: "None",
        notInstalled: "Not installed", play: "Play", stop: "Stop", testAdhan: "Test adhan now",
        calcSection: "Calculation", method: "Method", asr: "Asr method", shafi: "Shafi'i (standard)", hanafi: "Hanafi", adjust: "Adjust minutes (to match your masjid)",
        hijriAdj: "Hijri date adjustment", days: "days", generalSection: "General", language: "Language", timeFormat: "Time format", theme: "Theme",
        themeAuto: "Automatic", themeLight: "Light", themeDark: "Dark", location: "Location", changeDistrict: "Change district",
        about: "About", aboutText: "Kerala standard calculation (Fajr & Isha 18°, Shafi'i Asr, IST). Matches the published Kerala timetable for district headquarters. Local masjid times may differ by a minute or two — use the minute adjustment to match.",
        notifOff: "Notifications are off. Tap to allow so the adhan can play.", allow: "Allow", saved: "Saved", adhanPlaying: "Adhan", stopAdhan: "Stop",
        exactOff: "Exact alarms are off – adhan may be late. Tap to fix.", reviewNote: "Please confirm wording and practice with your local scholar (Usthad)."
      },
      ml: {
        appName: "നിസ്കാര സമയം", welcome: "അസ്സലാമു അലൈക്കും", welcomeSub: "കൃത്യമായ നിസ്കാര സമയത്തിന് നിങ്ങളുടെ ജില്ല തിരഞ്ഞെടുക്കുക", chooseDistrict: "ജില്ല തിരഞ്ഞെടുക്കുക",
        useGps: "എന്റെ കൃത്യമായ സ്ഥലം (GPS)", locating: "സ്ഥലം കണ്ടെത്തുന്നു…", gpsFail: "സ്ഥലം ലഭിച്ചില്ല. ലൊക്കേഷൻ അനുമതി നൽകുക.", myLocation: "എന്റെ സ്ഥലം",
        next: "അടുത്ത നിസ്കാരം", in: "ഇനി", now: "ഇപ്പോൾ", tomorrow: "നാളെ", today: "ഇന്ന്", yesterday: "ഇന്നലെ",
        home: "ഹോം", times: "സമയങ്ങൾ", qibla: "ഖിബ്‌ല", adhkar: "ദിക്റുകൾ", settings: "ക്രമീകരണം",
        sunriseNote: "ഉദയ സമയത്ത് നിസ്കാരമില്ല", monthView: "മാസം", dayView: "ദിവസം", pickDate: "തീയതി തിരഞ്ഞെടുക്കുക",
        qiblaTitle: "ഖിബ്‌ല ദിശ", qiblaFrom: "വടക്ക് നിന്ന്", distance: "മക്കയിലേക്കുള്ള ദൂരം", startCompass: "കോമ്പസ് തുടങ്ങുക",
        compassHint: "ഫോൺ നിരപ്പായി പിടിക്കുക. കാലിബ്രേറ്റ് ചെയ്യാൻ 8 ആകൃതിയിൽ ചലിപ്പിക്കുക.", aligned: "നിങ്ങൾ ഖിബ്‌ലയിലേക്ക് തിരിഞ്ഞിരിക്കുന്നു", turn: "അമ്പടയാളം മുകളിലേക്ക് ചൂണ്ടുന്നത് വരെ ഫോൺ തിരിക്കുക",
        noCompass: "ഈ ഫോണിൽ കോമ്പസ് ലഭ്യമല്ല. മുകളിലെ ഡിഗ്രി ഉപയോഗിക്കുക.",
        adhkarTitle: "നിസ്കാരാനന്തര ദിക്റുകളും ദുആകളും", tapCount: "എണ്ണാൻ തൊടുക", reset: "റീസെറ്റ്", done: "പൂർത്തിയായി", times_: "തവണ", source: "അവലംബം",
        adhanSection: "ബാങ്ക്", adhanSound: "ബാങ്ക് ശബ്ദം", fajrSound: "സുബ്ഹ് ബാങ്ക് ശബ്ദം", perPrayer: "ഓരോ നിസ്കാരത്തിനും അറിയിപ്പ്",
        modeAdhan: "ബാങ്ക്", modeNotify: "അറിയിപ്പ്", modeOff: "ഓഫ്", preReminder: "നിസ്കാരത്തിന് മുമ്പ് ഓർമ്മപ്പെടുത്തൽ", minBefore: "മിനിറ്റ് മുമ്പ്", none: "ഇല്ല",
        notInstalled: "ഇൻസ്റ്റാൾ ചെയ്തിട്ടില്ല", play: "കേൾക്കുക", stop: "നിർത്തുക", testAdhan: "ബാങ്ക് ഇപ്പോൾ പരീക്ഷിക്കുക",
        calcSection: "കണക്കുകൂട്ടൽ", method: "രീതി", asr: "അസ്ർ രീതി", shafi: "ശാഫിഈ (സാധാരണ)", hanafi: "ഹനഫി", adjust: "മിനിറ്റ് ക്രമീകരിക്കുക (നിങ്ങളുടെ പള്ളിയുമായി ഒത്തുനോക്കാൻ)",
        hijriAdj: "ഹിജ്റ തീയതി ക്രമീകരണം", days: "ദിവസം", generalSection: "പൊതുവായവ", language: "ഭാഷ", timeFormat: "സമയ ഫോർമാറ്റ്", theme: "തീം",
        themeAuto: "ഓട്ടോമാറ്റിക്", themeLight: "ലൈറ്റ്", themeDark: "ഡാർക്ക്", location: "സ്ഥലം", changeDistrict: "ജില്ല മാറ്റുക",
        about: "വിവരം", aboutText: "കേരള സ്റ്റാൻഡേർഡ് കണക്ക് (സുബ്ഹ്, ഇശാ 18°, ശാഫിഈ അസ്ർ, IST). ജില്ലാ ആസ്ഥാനങ്ങളുടെ പ്രസിദ്ധീകരിച്ച കേരള സമയപ്പട്ടികയുമായി ഒത്തുപോകുന്നു. പ്രാദേശിക പള്ളി സമയങ്ങളിൽ ഒന്നോ രണ്ടോ മിനിറ്റ് വ്യത്യാസമുണ്ടാകാം.",
        notifOff: "അറിയിപ്പുകൾ ഓഫാണ്. ബാങ്ക് കേൾക്കാൻ അനുമതി നൽകുക.", allow: "അനുവദിക്കുക", saved: "സേവ് ചെയ്തു", adhanPlaying: "ബാങ്ക്", stopAdhan: "നിർത്തുക",
        exactOff: "കൃത്യ അലാറം ഓഫാണ് – ബാങ്ക് വൈകിയേക്കാം. ശരിയാക്കാൻ തൊടുക.", reviewNote: "പദങ്ങളും രീതിയും നിങ്ങളുടെ ഉസ്താദുമായി ഉറപ്പുവരുത്തുക."
      }
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
