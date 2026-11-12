/* After-prayer adhkar and duas.
   when: "all" = after every fard prayer, or a list of prayers.
   count: repetitions; countFM: repetitions after Fajr & Maghrib (if different).
   Meanings are explanatory English renderings. Please have the content reviewed by a local scholar. */
(function (G) {
  "use strict";
  G.KPT_ADHKAR = [
    {
      id: "istighfar", when: "all", count: 3,
      title: { en: "Seeking forgiveness", ml: "ഇസ്തിഗ്ഫാർ" },
      ar: "أَسْتَغْفِرُ اللَّهَ",
      tr: "Astaghfirullah",
      en: "I seek the forgiveness of Allah.",
      ml: "ഞാൻ അല്ലാഹുവിനോട് പാപമോചനം തേടുന്നു.",
      src: "Sahih Muslim 591"
    },
    {
      id: "salam", when: "all", count: 1,
      title: { en: "Allahumma antas-Salam", ml: "അല്ലാഹുമ്മ അൻതസ്സലാം" },
      ar: "اللَّهُمَّ أَنْتَ السَّلَامُ، وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ",
      tr: "Allahumma antas-salam, wa minkas-salam, tabarakta ya dhal-jalali wal-ikram",
      en: "O Allah, You are Peace and from You comes peace. Blessed are You, O Owner of majesty and honour.",
      ml: "അല്ലാഹുവേ, നീയാണ് സലാം (സമാധാനം), നിന്നിൽ നിന്നാണ് സമാധാനം. മഹത്വത്തിന്റെയും ആദരവിന്റെയും ഉടമയേ, നീ അനുഗ്രഹപൂർണ്ണനായിരിക്കുന്നു.",
      src: "Sahih Muslim 591"
    },
    {
      id: "tahlil_mani", when: "all", count: 1,
      title: { en: "Declaration of Tawhid", ml: "തൗഹീദ് ദിക്ർ" },
      ar: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ، اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ",
      tr: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir. Allahumma la mani'a lima a'tayt, wa la mu'tiya lima mana't, wa la yanfa'u dhal-jaddi minkal-jadd",
      en: "There is no god but Allah alone, without partner. His is the dominion and His is the praise, and He has power over all things. O Allah, none can withhold what You give, none can give what You withhold, and the wealth of the wealthy cannot avail him against You.",
      ml: "അല്ലാഹുവല്ലാതെ ആരാധനക്കർഹനായി ആരുമില്ല, അവൻ ഏകനാണ്, അവന് പങ്കുകാരില്ല. ആധിപത്യവും സ്തുതിയും അവനാണ്. അവൻ എല്ലാ കാര്യത്തിനും കഴിവുള്ളവനാണ്. അല്ലാഹുവേ, നീ നൽകിയത് തടയാൻ ആരുമില്ല, നീ തടഞ്ഞത് നൽകാനും ആരുമില്ല. സമ്പന്നന്റെ സമ്പത്ത് നിന്റെയടുക്കൽ അവന് ഉപകരിക്കുകയുമില്ല.",
      src: "Sahih al-Bukhari 844, Sahih Muslim 593"
    },
    {
      id: "aini", when: "all", count: 1,
      title: { en: "Dua for help in worship", ml: "ഇബാദത്തിന് സഹായം തേടൽ" },
      ar: "اللَّهُمَّ أَعِنِّي عَلَىٰ ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
      tr: "Allahumma a'inni 'ala dhikrika wa shukrika wa husni 'ibadatik",
      en: "O Allah, help me to remember You, to thank You, and to worship You in the best way.",
      ml: "അല്ലാഹുവേ, നിന്നെ സ്മരിക്കാനും നിനക്ക് നന്ദി ചെയ്യാനും നിന്നെ ഏറ്റവും നന്നായി ആരാധിക്കാനും എന്നെ സഹായിക്കേണമേ.",
      src: "Sunan Abi Dawud 1522"
    },
    {
      id: "subhanallah", when: "all", count: 33,
      title: { en: "Tasbih", ml: "തസ്ബീഹ്" },
      ar: "سُبْحَانَ اللَّهِ", tr: "SubhanAllah", en: "Glory be to Allah.",
      ml: "അല്ലാഹു പരിശുദ്ധനാണ്.",
      src: "Sahih Muslim 597"
    },
    {
      id: "alhamdulillah", when: "all", count: 33,
      title: { en: "Tahmid", ml: "തഹ്മീദ്" },
      ar: "الْحَمْدُ لِلَّهِ", tr: "Alhamdulillah", en: "All praise is for Allah.",
      ml: "എല്ലാ സ്തുതിയും അല്ലാഹുവിനാണ്.",
      src: "Sahih Muslim 597"
    },
    {
      id: "allahuakbar", when: "all", count: 33,
      title: { en: "Takbir", ml: "തക്ബീർ" },
      ar: "اللَّهُ أَكْبَرُ", tr: "Allahu Akbar", en: "Allah is the Greatest.",
      ml: "അല്ലാഹു ഏറ്റവും വലിയവനാണ്.",
      src: "Sahih Muslim 597"
    },
    {
      id: "tahlil100", when: "all", count: 1,
      title: { en: "Completing the hundred", ml: "നൂറ് പൂർത്തിയാക്കൽ" },
      ar: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
      tr: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadir",
      en: "There is no god but Allah alone, without partner. His is the dominion and His is the praise, and He has power over all things.",
      ml: "അല്ലാഹുവല്ലാതെ ആരാധനക്കർഹനായി ആരുമില്ല, അവൻ ഏകനാണ്, അവന് പങ്കുകാരില്ല. ആധിപത്യവും സ്തുതിയും അവനാണ്. അവൻ എല്ലാ കാര്യത്തിനും കഴിവുള്ളവനാണ്.",
      src: "Sahih Muslim 597"
    },
    {
      id: "kursi", when: "all", count: 1,
      title: { en: "Ayat al-Kursi (2:255)", ml: "ആയത്തുൽ കുർസിയ്യ്" },
      ar: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
      tr: "",
      en: "Allah – there is no god but He, the Ever-Living, the Sustainer of all. Neither drowsiness nor sleep overtakes Him. To Him belongs all that is in the heavens and the earth. Who can intercede with Him except by His permission? He knows what is before them and what is behind them, and they encompass nothing of His knowledge except what He wills. His Kursi extends over the heavens and the earth, and preserving them does not tire Him. He is the Most High, the Most Great.",
      ml: "അല്ലാഹു – അവനല്ലാതെ ആരാധനക്കർഹനായി ആരുമില്ല. അവൻ എന്നെന്നും ജീവിക്കുന്നവനും എല്ലാം നിയന്ത്രിക്കുന്നവനുമാണ്. മയക്കമോ ഉറക്കമോ അവനെ ബാധിക്കുകയില്ല. ആകാശങ്ങളിലും ഭൂമിയിലുമുള്ളതെല്ലാം അവന്റേതാണ്. അവന്റെ അനുവാദമില്ലാതെ അവന്റെയടുക്കൽ ശുപാർശ ചെയ്യാൻ ആരുണ്ട്? അവരുടെ മുമ്പിലുള്ളതും പിന്നിലുള്ളതും അവൻ അറിയുന്നു. അവൻ ഉദ്ദേശിക്കുന്നതല്ലാതെ അവന്റെ അറിവിൽ നിന്ന് ഒന്നും അവർക്ക് ഗ്രഹിക്കാനാവില്ല. അവന്റെ കുർസിയ്യ് ആകാശങ്ങളെയും ഭൂമിയെയും ഉൾക്കൊള്ളുന്നു. അവയുടെ സംരക്ഷണം അവനെ ക്ഷീണിപ്പിക്കുന്നില്ല. അവൻ അത്യുന്നതനും മഹാനുമാകുന്നു.",
      src: "Qur'an 2:255 · an-Nasa'i, as-Sunan al-Kubra"
    },
    {
      id: "ikhlas", when: "all", count: 1, countFM: 3,
      title: { en: "Surah al-Ikhlas", ml: "സൂറത്തുൽ ഇഖ്‌ലാസ്" },
      ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
      tr: "",
      en: "Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born, and there is none comparable to Him.",
      ml: "പറയുക: അവൻ അല്ലാഹു, ഏകനാണ്. അല്ലാഹു എല്ലാവരുടെയും ആശ്രയമാണ്. അവൻ ജനിപ്പിച്ചിട്ടില്ല, ജനിച്ചിട്ടുമില്ല. അവന് തുല്യനായി ആരുമില്ല.",
      src: "Qur'an 112 · Sunan Abi Dawud 1523"
    },
    {
      id: "falaq", when: "all", count: 1, countFM: 3,
      title: { en: "Surah al-Falaq", ml: "സൂറത്തുൽ ഫലഖ്" },
      ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
      tr: "",
      en: "Say: I seek refuge in the Lord of the daybreak, from the evil of what He created, from the evil of darkness when it settles, from the evil of those who blow on knots, and from the evil of an envier when he envies.",
      ml: "പറയുക: പ്രഭാതത്തിന്റെ നാഥനോട് ഞാൻ ശരണം തേടുന്നു; അവൻ സൃഷ്ടിച്ചവയുടെ തിന്മയിൽ നിന്നും, ഇരുട്ട് വ്യാപിക്കുമ്പോഴുള്ള തിന്മയിൽ നിന്നും, കെട്ടുകളിൽ ഊതുന്നവരുടെ തിന്മയിൽ നിന്നും, അസൂയാലു അസൂയപ്പെടുമ്പോഴുള്ള തിന്മയിൽ നിന്നും.",
      src: "Qur'an 113 · Sunan Abi Dawud 1523"
    },
    {
      id: "nas", when: "all", count: 1, countFM: 3,
      title: { en: "Surah an-Nas", ml: "സൂറത്തുന്നാസ്" },
      ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ",
      tr: "",
      en: "Say: I seek refuge in the Lord of mankind, the King of mankind, the God of mankind, from the evil of the retreating whisperer, who whispers in the hearts of mankind, from among jinn and mankind.",
      ml: "പറയുക: മനുഷ്യരുടെ നാഥനോട്, മനുഷ്യരുടെ രാജാവിനോട്, മനുഷ്യരുടെ ആരാധ്യനോട് ഞാൻ ശരണം തേടുന്നു; ദുർബോധനം നടത്തി പിൻവാങ്ങുന്നവന്റെ തിന്മയിൽ നിന്ന് – മനുഷ്യഹൃദയങ്ങളിൽ ദുർബോധനം നടത്തുന്ന ജിന്നുകളിലും മനുഷ്യരിലും പെട്ടവരിൽ നിന്ന്.",
      src: "Qur'an 114 · Sunan Abi Dawud 1523"
    },
    {
      id: "tahlil10", when: ["fajr", "maghrib"], count: 10,
      title: { en: "After Fajr & Maghrib – ten times", ml: "സുബ്ഹ്, മഗ്‌രിബിന് ശേഷം – 10 തവണ" },
      ar: "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، يُحْيِي وَيُمِيتُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
      tr: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, yuhyi wa yumit, wa huwa 'ala kulli shay'in qadir",
      en: "There is no god but Allah alone, without partner. His is the dominion and His is the praise. He gives life and causes death, and He has power over all things.",
      ml: "അല്ലാഹുവല്ലാതെ ആരാധനക്കർഹനായി ആരുമില്ല, അവൻ ഏകനാണ്, അവന് പങ്കുകാരില്ല. ആധിപത്യവും സ്തുതിയും അവനാണ്. അവൻ ജീവിപ്പിക്കുകയും മരിപ്പിക്കുകയും ചെയ്യുന്നു. അവൻ എല്ലാ കാര്യത്തിനും കഴിവുള്ളവനാണ്.",
      src: "Jami' at-Tirmidhi 3474"
    },
    {
      id: "ajirni", when: ["fajr", "maghrib"], count: 7,
      title: { en: "Protection from the Fire", ml: "നരകത്തിൽ നിന്ന് രക്ഷ" },
      ar: "اللَّهُمَّ أَجِرْنِي مِنَ النَّارِ",
      tr: "Allahumma ajirni minan-nar",
      en: "O Allah, protect me from the Fire.",
      ml: "അല്ലാഹുവേ, നരകത്തിൽ നിന്ന് എന്നെ രക്ഷിക്കേണമേ.",
      src: "Sunan Abi Dawud 5079"
    },
    {
      id: "ilman", when: ["fajr"], count: 1,
      title: { en: "Dua after Fajr", ml: "സുബ്ഹിന് ശേഷമുള്ള ദുആ" },
      ar: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا",
      tr: "Allahumma inni as'aluka 'ilman nafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbalan",
      en: "O Allah, I ask You for beneficial knowledge, good and pure provision, and deeds that are accepted.",
      ml: "അല്ലാഹുവേ, ഉപകാരപ്രദമായ അറിവും നല്ല ഉപജീവനവും സ്വീകാര്യമായ കർമ്മങ്ങളും ഞാൻ നിന്നോട് ചോദിക്കുന്നു.",
      src: "Sunan Ibn Majah 925"
    },
    {
      id: "rabbana", when: "all", count: 1,
      title: { en: "Dua for good in both worlds", ml: "ഇരുലോക നന്മക്കുള്ള ദുആ" },
      ar: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
      tr: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
      en: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
      ml: "ഞങ്ങളുടെ നാഥാ, ഞങ്ങൾക്ക് ഇഹലോകത്തും പരലോകത്തും നന്മ നൽകേണമേ, നരകശിക്ഷയിൽ നിന്ന് ഞങ്ങളെ കാത്തുരക്ഷിക്കേണമേ.",
      src: "Qur'an 2:201"
    },
    {
      id: "salawat", when: "all", count: 1,
      title: { en: "Salawat upon the Prophet ﷺ", ml: "സ്വലാത്ത്" },
      ar: "اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَعَلَىٰ آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَىٰ إِبْرَاهِيمَ وَعَلَىٰ آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ",
      tr: "Allahumma salli 'ala Muhammadin wa 'ala ali Muhammad, kama sallayta 'ala Ibrahima wa 'ala ali Ibrahim, innaka Hamidun Majid",
      en: "O Allah, send blessings upon Muhammad and the family of Muhammad, as You sent blessings upon Ibrahim and the family of Ibrahim. You are Praiseworthy, Glorious.",
      ml: "അല്ലാഹുവേ, ഇബ്റാഹീം നബിയുടെയും കുടുംബത്തിന്റെയും മേൽ നീ അനുഗ്രഹം ചൊരിഞ്ഞതുപോലെ മുഹമ്മദ് നബി ﷺ യുടെയും കുടുംബത്തിന്റെയും മേൽ അനുഗ്രഹം ചൊരിയേണമേ. നിശ്ചയം നീ സ്തുത്യർഹനും മഹത്വമുള്ളവനുമാണ്.",
      src: "Sahih al-Bukhari 3370"
    }
  ];
})(typeof window !== "undefined" ? window : globalThis);
