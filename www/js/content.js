/* Extra content: Hijri months & events, tasbih dhikr, extra UI text (English / Malayalam). */
(function (G) {
  "use strict";
  var D = G.KPT_DATA;
  D.HMONTHS = {
    en: ["Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Akhir", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qa'dah", "Dhu al-Hijjah"],
    ml: ["മുഹറം", "സഫർ", "റബീഉൽ അവ്വൽ", "റബീഉൽ ആഖിർ", "ജമാദുൽ അവ്വൽ", "ജമാദുൽ ആഖിർ", "റജബ്", "ശഅ്ബാൻ", "റമദാൻ", "ശവ്വാൽ", "ദുൽഖഅ്ദ", "ദുൽഹിജ്ജ"]
  };
  D.EVENTS = [
    { m: 1, d: 1, en: "Islamic New Year", ml: "ഹിജ്റ പുതുവർഷം" },
    { m: 1, d: 10, en: "Day of Ashura", ml: "ആശൂറാഅ് ദിനം" },
    { m: 3, d: 12, en: "Milad-un-Nabi (Nabidinam)", ml: "നബിദിനം" },
    { m: 7, d: 27, en: "Isra' & Mi'raj", ml: "ഇസ്റാഅ് മിഅ്റാജ്" },
    { m: 8, d: 15, en: "Mid-Sha'ban (Bara'ath)", ml: "ബറാഅത്ത്" },
    { m: 9, d: 1, en: "First day of Ramadan", ml: "റമദാൻ ആരംഭം" },
    { m: 9, d: 17, en: "Badr Day", ml: "ബദ്ർ ദിനം" },
    { m: 9, d: 27, en: "27th night (Laylat al-Qadr)", ml: "ഇരുപത്തിയേഴാം രാവ് (ലൈലത്തുൽ ഖദ്ർ)" },
    { m: 10, d: 1, en: "Eid al-Fitr", ml: "ചെറിയ പെരുന്നാൾ" },
    { m: 12, d: 9, en: "Day of Arafah", ml: "അറഫ ദിനം" },
    { m: 12, d: 10, en: "Eid al-Adha", ml: "ബലി പെരുന്നാൾ" }
  ];
  D.DHIKR = [
    { ar: "سُبْحَانَ اللَّهِ", en: "SubhanAllah", ml: "സുബ്ഹാനല്ലാഹ്" },
    { ar: "الْحَمْدُ لِلَّهِ", en: "Alhamdulillah", ml: "അൽഹംദുലില്ലാഹ്" },
    { ar: "اللَّهُ أَكْبَرُ", en: "Allahu Akbar", ml: "അല്ലാഹു അക്ബർ" },
    { ar: "لَا إِلَٰهَ إِلَّا اللَّهُ", en: "La ilaha illallah", ml: "ലാ ഇലാഹ ഇല്ലല്ലാഹ്" },
    { ar: "أَسْتَغْفِرُ اللَّهَ", en: "Astaghfirullah", ml: "അസ്തഗ്ഫിറുല്ലാഹ്" },
    { ar: "اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ", en: "Allahumma salli 'ala Muhammad", ml: "അല്ലാഹുമ്മ സ്വല്ലി അലാ മുഹമ്മദ്" },
    { ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", en: "SubhanAllahi wa bihamdihi", ml: "സുബ്ഹാനല്ലാഹി വബിഹംദിഹി" },
    { ar: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", en: "La hawla wa la quwwata illa billah", ml: "ലാ ഹൗല വലാ ഖുവ്വത്ത ഇല്ലാ ബില്ലാഹ്" }
  ];
  // Extra adhans found in resources/adhan-source/ at build time
  (G.KPT_EXTRA_ADHANS || []).forEach(function (x) { D.ADHANS.splice(D.ADHANS.length - 2, 0, x); });
  function add(lang, o) { Object.keys(o).forEach(function (k) { D.T[lang][k] = o[k]; }); }
  add("en", {
    tasbih: "Tasbih", tasbihTitle: "Tasbih counter", target: "Target", rounds: "Rounds", total: "Total", tapCircle: "Tap the circle to count", unlimited: "∞",
    hijriCal: "Hijri calendar", hijri: "Hijri", ramadan: "Ramadan", ramadanTitle: "Ramadan timetable", back: "Back",
    upcoming: "Upcoming days", inDays: "in {n} days", todayEv: "Today", eventsMonth: "This month",
    hijriNote: "Hijri dates are calculated. In Kerala the month starts with local moon sighting – use the Hijri adjustment in Settings if needed.",
    suhoorEnds: "Suhoor ends", iftar: "Iftar", untilIftar: "until Iftar", untilSuhoor: "until Suhoor ends", ramadanDay: "Ramadan day", ramadanStarts: "Ramadan starts",
    ramadanNote: "Suhoor ends at Fajr time and Iftar is at Maghrib. Follow the moon sighting announced in Kerala.",
    ramadanSection: "Ramadan & Jumu'ah", ramadanMode: "Ramadan mode", rmAuto: "Automatic", rmOn: "Always on", rmOff: "Off", suhoorRem: "Suhoor reminder", minBeforeFajr: "min before Fajr",
    jumuah: "Jumu'ah reminder", minBeforeDhuhr: "min before Dhuhr", jumuahTitle: "Jumu'ah Mubarak", jumuahBody: "Jumu'ah today – read Surah al-Kahf and send salawat.",
    suhoorTitle: "Suhoor", suhoorBody: "Suhoor ends at {t}", iftarTime: "Iftar time",
    share: "Share image", print: "Print", sharing: "Preparing…", shareFail: "Couldn't share. Try again.", dateCol: "Date", timetable: "Prayer timetable",
    setupTitle: "Adhan reliability check", setupSub: "Make sure the adhan plays on time, every time.", setupRow: "Adhan reliability check",
    stNotif: "Notifications allowed", stNotifHelp: "Needed to play the adhan.", stExact: "Alarms & reminders allowed", stExactHelp: "Android 12+ – plays the adhan at the exact minute.",
    stBattery: "Battery: Unrestricted", stBatteryHelp: "Stops the phone from blocking the adhan to save battery.", stSound: "Test the adhan", stSoundHelp: "Plays a test alert in 5 seconds.",
    stWidget: "Home screen widget", stWidgetHelp: "Next prayer and countdown on your home screen.", addWidget: "Add", fix: "Fix", ok: "OK", test: "Test", check: "Check again",
    stKeep: "Open the app now and then", stKeepHelp: "Alerts are set {n} days ahead and refresh each time you open the app.",
    brandTip: "Tips for your phone", tipSamsung: "Samsung: Settings › Battery › Background usage limits › Never sleeping apps › add Kerala Prayer Times.",
    tipXiaomi: "Xiaomi / Redmi / POCO: App info › Autostart ON, and Battery saver › No restrictions.",
    tipOppo: "Oppo / Realme / Vivo / OnePlus: App info › Battery › Allow background activity, and turn on Auto launch.",
    tipOther: "Other phones: App info › Battery › Unrestricted.", phoneOnly: "Available in the phone app",
    widgetTitle: "Home screen widget", widgetHelp: "Long-press your home screen › Widgets › Kerala Prayer Times.", widgetIos: "The widget is available on Android.",
    keepTitle: "Keep adhan alerts on", keepBody: "Open Kerala Prayer Times to schedule the next weeks of adhan.",
    privacy: "Privacy policy", privacyText: "This app does not collect, store or share any personal data. Your district, location and settings are saved only on your phone. GPS location (if you choose it) is used only on the phone to calculate prayer times and the Qibla direction, and is never sent anywhere. The app has no ads, no analytics and no accounts.",
    enableCompass: "Enable compass", hcTitle: "After-prayer tasbih", gpsShort: "My location", pickHint: "Showing Malappuram – choose your district from the list above.", change: "Change", sameMain: "Same as main adhan", adhanFor: "Adhan for", adhanPickHelp: "Tap an adhan to choose it – you will hear a sample. Press ▶ to listen without choosing.", homeBg: "Home background", bgBlue: "Mosque before Fajr (calm)", bgSunrise: "Golden sunrise", bgKerala: "Kerala mosque at dawn", bgImage: "Mosque at night", bgSky: "Plain sky colours", remaining: "remaining", duaDay: "Dua of the day", calShort: "Calendar", credits: "Credits & licences", recBy: "Recording", creditsIntro: "Adhan recordings are used under Creative Commons licences from Wikimedia Commons (commons.wikimedia.org). They were trimmed, level-adjusted and converted for this app.", fonts: "Fonts: Manjari (Santhosh Thottingal, SMC) and Amiri (Khaled Hosny) – SIL Open Font License 1.1.", next7: "Next prayer"
  });
  add("ml", {
    tasbih: "തസ്ബീഹ്", tasbihTitle: "തസ്ബീഹ് മാല", target: "ലക്ഷ്യം", rounds: "റൗണ്ട്", total: "ആകെ", tapCircle: "എണ്ണാൻ വൃത്തത്തിൽ തൊടുക", unlimited: "∞",
    hijriCal: "ഹിജ്റ കലണ്ടർ", hijri: "ഹിജ്റ", ramadan: "റമദാൻ", ramadanTitle: "റമദാൻ സമയപ്പട്ടിക", back: "തിരികെ",
    upcoming: "വരാനിരിക്കുന്ന ദിനങ്ങൾ", inDays: "{n} ദിവസം കഴിഞ്ഞ്", todayEv: "ഇന്ന്", eventsMonth: "ഈ മാസം",
    hijriNote: "ഹിജ്റ തീയതികൾ കണക്കുകൂട്ടിയതാണ്. കേരളത്തിൽ മാസപ്പിറവി കാണുന്നതനുസരിച്ച് മാറാം – ആവശ്യമെങ്കിൽ ക്രമീകരണത്തിൽ ഹിജ്റ തീയതി ക്രമീകരിക്കുക.",
    suhoorEnds: "അത്താഴം അവസാനം", iftar: "നോമ്പുതുറ", untilIftar: "നോമ്പുതുറയ്ക്ക്", untilSuhoor: "അത്താഴം അവസാനിക്കാൻ", ramadanDay: "റമദാൻ", ramadanStarts: "റമദാൻ ആരംഭം",
    ramadanNote: "അത്താഴം സുബ്ഹ് സമയത്ത് അവസാനിക്കുന്നു, നോമ്പുതുറ മഗ്‌രിബിന്. കേരളത്തിൽ പ്രഖ്യാപിക്കുന്ന മാസപ്പിറവി പിന്തുടരുക.",
    ramadanSection: "റമദാൻ & ജുമുഅ", ramadanMode: "റമദാൻ മോഡ്", rmAuto: "ഓട്ടോമാറ്റിക്", rmOn: "എപ്പോഴും", rmOff: "ഓഫ്", suhoorRem: "അത്താഴ ഓർമ്മപ്പെടുത്തൽ", minBeforeFajr: "മിനിറ്റ് സുബ്ഹിന് മുമ്പ്",
    jumuah: "ജുമുഅ ഓർമ്മപ്പെടുത്തൽ", minBeforeDhuhr: "മിനിറ്റ് ളുഹറിന് മുമ്പ്", jumuahTitle: "ജുമുഅ മുബാറക്", jumuahBody: "ഇന്ന് ജുമുഅ – സൂറത്തുൽ കഹ്ഫ് ഓതുക, സ്വലാത്ത് വർധിപ്പിക്കുക.",
    suhoorTitle: "അത്താഴം", suhoorBody: "അത്താഴം {t}ന് അവസാനിക്കും", iftarTime: "നോമ്പുതുറ സമയം",
    share: "ചിത്രമായി ഷെയർ", print: "പ്രിന്റ്", sharing: "തയ്യാറാക്കുന്നു…", shareFail: "ഷെയർ ചെയ്യാനായില്ല. വീണ്ടും ശ്രമിക്കുക.", dateCol: "തീയതി", timetable: "നിസ്കാര സമയപ്പട്ടിക",
    setupTitle: "ബാങ്ക് മുടങ്ങാതിരിക്കാൻ", setupSub: "ബാങ്ക് എപ്പോഴും കൃത്യസമയത്ത് കേൾക്കാൻ ഇവ ഉറപ്പാക്കുക.", setupRow: "ബാങ്ക് മുടങ്ങാതിരിക്കാൻ – പരിശോധന",
    stNotif: "അറിയിപ്പുകൾ അനുവദിച്ചു", stNotifHelp: "ബാങ്ക് കേൾക്കാൻ ആവശ്യമാണ്.", stExact: "അലാറം & ഓർമ്മപ്പെടുത്തൽ അനുവദിച്ചു", stExactHelp: "ആൻഡ്രോയിഡ് 12+ – കൃത്യ മിനിറ്റിൽ ബാങ്ക്.",
    stBattery: "ബാറ്ററി: Unrestricted", stBatteryHelp: "ബാറ്ററി ലാഭിക്കാൻ ഫോൺ ബാങ്ക് തടയുന്നത് ഒഴിവാക്കുന്നു.", stSound: "ബാങ്ക് പരീക്ഷിക്കുക", stSoundHelp: "5 സെക്കൻഡിൽ ഒരു പരീക്ഷണ അറിയിപ്പ്.",
    stWidget: "ഹോം സ്ക്രീൻ വിഡ്ജറ്റ്", stWidgetHelp: "അടുത്ത നിസ്കാരവും ബാക്കി സമയവും ഹോം സ്ക്രീനിൽ.", addWidget: "ചേർക്കുക", fix: "ശരിയാക്കുക", ok: "ശരി", test: "പരീക്ഷിക്കുക", check: "വീണ്ടും പരിശോധിക്കുക",
    stKeep: "ഇടയ്ക്ക് ആപ്പ് തുറക്കുക", stKeepHelp: "{n} ദിവസത്തേക്കുള്ള അറിയിപ്പുകൾ സെറ്റ് ചെയ്തിട്ടുണ്ട്; ആപ്പ് തുറക്കുമ്പോഴെല്ലാം പുതുക്കും.",
    brandTip: "നിങ്ങളുടെ ഫോണിന്", tipSamsung: "Samsung: Settings › Battery › Background usage limits › Never sleeping apps › Kerala Prayer Times ചേർക്കുക.",
    tipXiaomi: "Xiaomi / Redmi / POCO: App info › Autostart ON, Battery saver › No restrictions.",
    tipOppo: "Oppo / Realme / Vivo / OnePlus: App info › Battery › Allow background activity, Auto launch ON.",
    tipOther: "മറ്റു ഫോണുകൾ: App info › Battery › Unrestricted.", phoneOnly: "ഫോൺ ആപ്പിൽ ലഭ്യം",
    widgetTitle: "ഹോം സ്ക്രീൻ വിഡ്ജറ്റ്", widgetHelp: "ഹോം സ്ക്രീനിൽ അമർത്തിപ്പിടിക്കുക › Widgets › Kerala Prayer Times.", widgetIos: "വിഡ്ജറ്റ് ആൻഡ്രോയിഡിൽ ലഭ്യമാണ്.",
    keepTitle: "ബാങ്ക് അറിയിപ്പ് തുടരാൻ", keepBody: "അടുത്ത ആഴ്ചകളിലെ ബാങ്ക് സെറ്റ് ചെയ്യാൻ ആപ്പ് തുറക്കുക.",
    privacy: "സ്വകാര്യതാ നയം", privacyText: "ഈ ആപ്പ് ഒരു വ്യക്തിഗത വിവരവും ശേഖരിക്കുകയോ സൂക്ഷിക്കുകയോ പങ്കിടുകയോ ചെയ്യുന്നില്ല. നിങ്ങളുടെ ജില്ലയും സ്ഥലവും ക്രമീകരണങ്ങളും നിങ്ങളുടെ ഫോണിൽ മാത്രമാണ് സൂക്ഷിക്കുന്നത്. GPS സ്ഥലം (തിരഞ്ഞെടുത്താൽ) നിസ്കാര സമയവും ഖിബ്‌ലയും കണക്കാക്കാൻ ഫോണിൽ മാത്രം ഉപയോഗിക്കുന്നു, എവിടേക്കും അയക്കുന്നില്ല. പരസ്യങ്ങളോ അനലിറ്റിക്സോ അക്കൗണ്ടുകളോ ഇല്ല.",
    enableCompass: "കോമ്പസ് ഓണാക്കുക", hcTitle: "നിസ്കാരശേഷമുള്ള തസ്ബീഹ്", gpsShort: "എന്റെ സ്ഥലം", pickHint: "മലപ്പുറം സമയമാണ് കാണിക്കുന്നത് – മുകളിലെ പട്ടികയിൽ നിന്ന് നിങ്ങളുടെ ജില്ല തിരഞ്ഞെടുക്കുക.", change: "മാറ്റുക", sameMain: "പ്രധാന ബാങ്ക് തന്നെ", adhanFor: "ബാങ്ക് –", adhanPickHelp: "ഒരു ബാങ്ക് തൊട്ടാൽ അത് തിരഞ്ഞെടുക്കും, ഒരു ഭാഗം കേൾക്കാം. തിരഞ്ഞെടുക്കാതെ കേൾക്കാൻ ▶ അമർത്തുക.", homeBg: "ഹോം പശ്ചാത്തലം", bgBlue: "സുബ്ഹിന് മുമ്പുള്ള പള്ളി (ശാന്തം)", bgSunrise: "സുവർണ്ണ സൂര്യോദയം", bgKerala: "പ്രഭാതത്തിലെ കേരള പള്ളി", bgImage: "രാത്രിയിലെ പള്ളി", bgSky: "ആകാശ നിറങ്ങൾ", remaining: "ബാക്കി", duaDay: "ഇന്നത്തെ ദുആ", calShort: "കലണ്ടർ", credits: "കടപ്പാട് & ലൈസൻസ്", recBy: "റെക്കോർഡിംഗ്", creditsIntro: "ബാങ്ക് റെക്കോർഡിംഗുകൾ Wikimedia Commons-ൽ (commons.wikimedia.org) നിന്ന് Creative Commons ലൈസൻസ് പ്രകാരം ഉപയോഗിക്കുന്നു. ഈ ആപ്പിനായി ചുരുക്കുകയും ശബ്ദനില ക്രമീകരിക്കുകയും ചെയ്തിട്ടുണ്ട്.", fonts: "ഫോണ്ടുകൾ: മഞ്ജരി (സന്തോഷ് തോട്ടിങ്ങൽ, SMC), Amiri (Khaled Hosny) – SIL Open Font License 1.1.", next7: "അടുത്ത നിസ്കാരം"
  });
})(typeof window !== "undefined" ? window : globalThis);
