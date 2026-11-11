# Kerala Prayer Times – Android & iPhone app

A professional, offline prayer-times app for Kerala, built once and shipped to both Android and iPhone (Capacitor 8).

## Features
| | |
|---|---|
| **Main page** | First-launch district picker (all 14 districts) or exact GPS location; change any time from the district chip |
| **Prayer times** | Fajr, **Sunrise**, Dhuhr, Asr, Maghrib, Isha – Kerala standard (18°/18°, Shafi'i), verified 30/30 against the published Kerala timetable |
| **Next prayer** | Live countdown with progress ring; current prayer highlighted |
| **Dates** | Yesterday / Today / **Tomorrow**, any date picker, full **month timetable** |
| **Adhan** | Adhan at each prayer, per-prayer Adhan / Notification / Off, **multiple adhan sounds** with preview, separate Fajr adhan, reminder before prayer |
| **Qibla** | Live compass with Kaaba marker, bearing and distance to Makkah, vibration when aligned |
| **Adhkar & duas** | After-prayer adhkar for each prayer (Arabic, transliteration, meaning, source), tap counters |
| **Other** | English / Malayalam, light / dark theme, 12/24h, Hijri date with ±2-day adjustment, ± minute adjustment per prayer |

## What you need
* **Node.js 22** (https://nodejs.org) and **ffmpeg** (for adhan sounds)
* **Android:** Android Studio (latest) – Windows, Mac or Linux
* **iPhone:** a **Mac** with **Xcode 26+**. Installing on your own iPhone works with a free Apple ID (re-sign every 7 days); App Store needs an Apple Developer account.

## Build – step by step
```bash
# 1. Install
npm install

# 2. Add the platforms
npx cap add android
npx cap add ios            # Mac only

# 3. Icons & splash screens (from /assets)
npm run assets

# 4. (Optional) add adhan MP3s to resources/adhan-source/  – see the txt file there

# 5. Copy sounds + add permissions, then sync
npm run setup:native
npx cap sync

# 6. Open and run
npx cap open android       # Android Studio → Run ▶  or  Build → Build APK(s)
npx cap open ios           # Xcode → choose your iPhone → Run ▶
```
Re-run steps 5 whenever you change adhan files or app code.

### No PC tools? Build the Android APK on GitHub
Upload this folder to a GitHub repository → **Actions** tab → *Build Android APK* runs automatically → download **KeralaPrayerTimes-Android** from the run.

## Adhan notes
* **Android** plays the full adhan as the notification sound. Each sound has its own notification channel, so changing the adhan in Settings takes effect immediately.
* **iPhone** limits notification sounds to **30 seconds**, so the setup makes a 29-second clip. When the app is open, the full adhan plays in the app.
* On Android 12+ the app asks for **exact alarms** so the adhan is on time – allow it when prompted.
* Turn off battery optimisation for the app on phones that kill background apps (Xiaomi, Oppo, Vivo, Samsung).

## Accuracy
Times use the Kerala standard (Karachi 18° Fajr & Isha, Shafi'i Asr, IST) for each district headquarters and matched the published Kerala (Suprabhatham-sourced) timetable to the minute for Kasaragod, Kozhikode, Malappuram, Kochi and Thiruvananthapuram. Use GPS for your exact location, and the ± minute adjustment to match your local masjid exactly.

## Adhkar
The adhkar and duas are standard after-prayer adhkar with hadith/Qur'an references. Please have them reviewed by your local scholar (Usthad) before publishing.

## Publishing
* **Google Play:** Android Studio → Build → Generate Signed Bundle (AAB). Change `appId` in `capacitor.config.json` before your first release.
* **App Store:** Xcode → Product → Archive → Distribute.
