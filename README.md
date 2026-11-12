# Basmalah – Kerala prayer times app for Android & iPhone (v3.4)

One code base (Capacitor 8) for Android and iPhone. Dark green and blue design, English and Malayalam.

## Features
| | |
|---|---|
| **Prayer times** | All 14 districts or GPS, Fajr · Sunrise · Dhuhr · Asr · Maghrib · Isha, verified against the published Kerala timetable |
| **Adhan** | Per prayer Adhan / Notification / Off, several adhan sounds, separate Fajr adhan, reminder before prayer |
| **Adhan reliability check** | Checks notifications, exact alarms and battery settings, with tips per phone maker |
| **Home screen widget** (Android) | Next prayer, live countdown and today's times, refreshes itself at every prayer |
| **Qibla** | Compass starts automatically, bearing and distance to Makkah |
| **Adhkar & Tasbih** | After-prayer adhkar (Arabic, transliteration, English and Malayalam meaning, source), tasbih counter 33/99/100/∞ |
| **Ramadan** | Automatic in Ramadan: Suhoor/Iftar card with countdown, Suhoor reminder, Ramadan timetable |
| **Hijri calendar** | Hijri month view, Islamic days (Nabidinam, Badr, Eid…), upcoming days on the home screen |
| **Jumu'ah** | Friday reminder before Dhuhr |
| **Timetables** | Day, month (share as image / print), Ramadan |

## Build the Android app on GitHub (no PC tools needed)
1. Upload the **contents** of this folder to your GitHub repository (replace the old files, keep `.github`).
2. **Actions › Build Android APK** runs by itself → open the run › **Summary** › **Artifacts** › `KeralaPrayerTimes-Android`.
3. Unzip, copy `app-debug.apk` to the phone and install.

## Google Play release (signed)
**One time only – create your signing key**
1. GitHub › **Actions › Create signing key (run once) › Run workflow**. Type a strong password (write it down!) and your name.
2. Open the finished run › download **signing-key-KEEP-SAFE**. Keep `release.jks` and the password safe forever – every future update must be signed with the same key. (The artifact is deleted after 1 day.)
3. GitHub › **Settings › Secrets and variables › Actions › New repository secret**, add two secrets:
   * `KEYSTORE_BASE64` – paste the whole content of `KEYSTORE_BASE64.txt`
   * `KEYSTORE_PASSWORD` – the password you chose

**Every release**
4. Run **Build Android APK** again. It now also produces **KeralaPrayerTimes-PlayStore** with the `.aab` file for Google Play. The version number goes up automatically.
5. Google Play Console ($25 one-time) › Create app › upload the `.aab` under *Testing › Internal testing* first, then *Production*.
6. Store texts, graphics and data-safety answers are ready in the `store/` folder (`STORE_LISTING.md`). Put `store/privacy-policy.html` online (for example Google Sites, or a public GitHub repository with GitHub Pages) and paste its link in Play Console.

> Before your first Play upload you may change `appId` in `capacitor.config.json` (for example `com.yourname.keralaprayertimes`). After the first upload it can never change.

## iPhone
Needs a Mac with Xcode 26+: `npm install`, `npx cap add ios`, `npm run assets`, `npm run fonts`, `npm run setup:native`, `npx cap sync`, `npx cap open ios`. The home screen widget is Android-only for now (iPhone widgets need a separate Xcode WidgetKit target).

## Build on your own PC (optional)
```bash
npm install
npm run fonts
npx cap add android        # and/or: npx cap add ios  (Mac)
npm run assets
npm run setup:native
npx cap sync
npx cap open android
```

## Adhan recordings
The build downloads these freely licensed recordings from Wikimedia Commons (`npm run adhans`), then trims, levels and converts them:

| In the app | Recording by | Licence | Source file on commons.wikimedia.org |
|---|---|---|---|
| Makkah – Masjid al-Haram | Seyfula Islam | CC BY 3.0 | Adhan, Great Mosque of Mecca - Jan 21, 2013.webm |
| Madinah – Masjid an-Nabawi | ejaz215 | CC BY 3.0 | 33937_ejaz215_call-to-prayer-from-the-prophet-s-mo.ogg |
| Aaqib Azeez – calm adhan | Atcovi | CC BY-SA 4.0 | The Adhan - Muslim Call to Prayer - Aaqib Azeez.mp3 |
| Short adhan (27 s) | Jarih | CC BY-SA 3.0 | Adhan wiki.oga |
| Fajr adhan – Besim Azemi | Islamic Center Malmö | CC BY 3.0 | Eid al-Fitr Fajr azan at Malmö Mosque - 19 August 2012.webm |

Credits are shown in the app (Settings › Credits & licences). Please check each file page on Wikimedia Commons before publishing on Google Play.

**Choosing adhans:** Settings › Adhan sound (all prayers), Fajr adhan sound, and under "Alert for each prayer" a different adhan for each prayer. The home page also has a quick "Change" adhan button.

**Your own adhans:** put any MP3 you have permission to use in `resources/adhan-source/` (e.g. `mishary.mp3`, `fajr_kerala.mp3`). It appears in the app automatically. A file named like a built-in one (e.g. `makkah.mp3`) replaces it.
The build finds where the muezzin starts (skipping crowd noise or silence at the start), so the adhan begins straight away. iPhone limits notification sounds to 30 s, so a 29 s clip is made; the full adhan plays when the app is open.

## Reliability notes
* Android schedules 30 days of alerts, iPhone 14 days (iPhone allows only 64). Opening the app tops them up; a last reminder asks the user to open the app.
* Battery savers on Samsung, Xiaomi, Oppo, Vivo, Realme and OnePlus can block alarms – the in-app **Adhan reliability check** guides the user.

## Content
Adhkar and Malayalam meanings should be reviewed by a local scholar (Usthad) before publishing. Hijri dates are calculated (Umm al-Qura); Kerala follows local moon sighting – users can shift the Hijri date ±2 days in Settings.

## New in v3.0
* Home: Arabic salam, abstract emerald-sapphire background with glass cards, shortcuts Qibla · Adhkar · Tasbih · Quran · Ramadan.
* Location: **My location** (GPS, shows your town name) or **Kerala** with the 14 districts.
* Tap a prayer to open its page: after-prayer adhkar (Arabic only) with counters, the after-prayer tasbih, and that prayer's duas.
* **Adding your duas:** edit `www/js/duas.js` and put the Arabic text under each prayer, e.g. `fajr: [ { ar: "…" }, { ar: "…", count: 3 } ]`.
* Quran: all 114 surahs (Uthmani text from Tanzil, bundled at build time), search, continue reading, text size, recitation by Mishary Alafasy (streamed, needs internet).
* Qibla: corrected from magnetic to true north (World Magnetic Model), smoother needle, calibration and "hold flat" warnings, accuracy shown.
* 8 adhans: added Makkah Maghrib, Istanbul and Central Asian (Shalkar) recordings.

## New in v3.1
* **Adhan fix:** the phone plugins (notifications, GPS, storage…) are now bundled into `www/js/native.js` during the build. Before this the notification module could fail to load, so no adhan was scheduled. Settings › Adhan reliability check now shows "Adhan alerts scheduled" with the next alert.
* Your ICF duas for Fajr, Dhuhr, Asr, Maghrib and Isha, plus the adhan / iqamah duas, on each prayer page.
* Tapping a prayer on the Times page or home page opens its adhkar and duas.
* 16 Quran reciters (Sudais, Shuraim, Maher Al-Muaiqly, Abdul Basit, Husary, Ajamy, Hudhaify…).
* Quran streak: read or listen for one minute a day; rewards at 3, 7, 10 (flower), 15, 21, 30, 40, 50, 75, 100, 150, 200 and 365 days.
* New light home theme (Settings › Home background: Light, Night or Pattern). Sunrise now shows its Malayalam and Arabic name.

## New in v3.2
* Hijri page: upcoming special days shown above the calendar.
* Home: quick buttons for the adhan / between adhan & iqamah / iqamah duas.
* Quran reopens at the exact surah and ayah you left, even after closing the app.
* Reciter Ahmad Al-Nufais (MP3Quran.net, whole-surah audio with ayah timings).
* Tap any ayah → "This ayah" (plays only that ayah) or "From here".
* Mushaf marks: sajdah ayahs underlined with ۩ and a "سجدة" label, juz headings, waqf signs highlighted, full Amiri Quran font.

## New in v3.3
* Ramadan page: "Duas & dhikr" tab with the Ramadan handbook duas (new moon, fasting niyyah, after every prayer, the three tens – current ten highlighted, Laylat al-Qadr, Tarawih niyyah and dhikr, after Tarawih and Witr). Timetable in the second tab.
* Quran reader on a white background; only the sajdah word is underlined.

## New in v3.4
* App renamed to **Basmalah** (Android/iPhone app name, widget, store texts, privacy policy).
* Reminders: birthdays, wedding anniversaries, death anniversaries (Hijri or English date), yearly notification on the day and/or 1–7 days before. Shown on the home page and in the Hijri calendar.
* New home header colours: deep teal to royal blue with gold accents.

## New in v3.6
* Home: "My daily list" – add your own prayers, duas and dhikr (name, optional Arabic text, count such as 100 Swalath, optional daily reminder time). Tap +1 to count; shows Done when complete; resets every day; flower celebration when the whole list is done. Quick presets: Swalath, Istighfar, Yasin, Al-Mulk, Al-Waqi'ah, Duha, Tahajjud, morning/evening adhkar.
* About message shortened.
