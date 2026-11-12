package com.kerala.prayertimes;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.SystemClock;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/** Home-screen widget: next prayer, live countdown and today's six times. Data comes from the app (KptNativePlugin). */
public class PrayerWidget extends AppWidgetProvider {
    public static final String PREFS = "kpt_widget";
    public static final String ACTION_REFRESH = "com.kerala.prayertimes.WIDGET_REFRESH";
    private static final int[] NAME_IDS = { R.id.kpt_n0, R.id.kpt_n1, R.id.kpt_n2, R.id.kpt_n3, R.id.kpt_n4, R.id.kpt_n5 };
    private static final int[] TIME_IDS = { R.id.kpt_t0, R.id.kpt_t1, R.id.kpt_t2, R.id.kpt_t3, R.id.kpt_t4, R.id.kpt_t5 };

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        updateAll(context);
    }

    @Override
    public void onEnabled(Context context) {
        updateAll(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_REFRESH.equals(intent.getAction())) updateAll(context);
    }

    public static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, PrayerWidget.class));
        if (ids == null || ids.length == 0) return;
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.kpt_widget);
        long nextRefresh = 0;
        try {
            String raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString("data", null);
            if (raw == null || raw.length() == 0) throw new IllegalStateException("no data");
            JSONObject data = new JSONObject(raw);
            JSONArray names = data.getJSONArray("names");
            JSONArray days = data.getJSONArray("days");
            long now = System.currentTimeMillis();
            int dayIdx = -1;
            int prayerIdx = -1;
            for (int d = 0; d < days.length() && dayIdx < 0; d++) {
                JSONArray t = days.getJSONObject(d).getJSONArray("t");
                for (int i = 0; i < t.length(); i++) {
                    if (t.getLong(i) > now) {
                        dayIdx = d;
                        prayerIdx = i;
                        break;
                    }
                }
            }
            if (dayIdx < 0) throw new IllegalStateException("expired");
            JSONObject day = days.getJSONObject(dayIdx);
            JSONArray t = day.getJSONArray("t");
            JSONArray s = day.getJSONArray("s");
            long target = t.getLong(prayerIdx);
            int accent = Color.parseColor("#9CC8FF");
            views.setTextViewText(R.id.kpt_place, data.optString("place", ""));
            views.setTextViewText(R.id.kpt_date, day.optString("d", ""));
            views.setTextViewText(R.id.kpt_next_lbl, data.optString("nextLbl", "Next prayer"));
            views.setTextViewText(R.id.kpt_next, names.getString(prayerIdx));
            views.setTextViewText(R.id.kpt_at, s.getString(prayerIdx));
            views.setChronometer(R.id.kpt_cd, SystemClock.elapsedRealtime() + (target - now), null, true);
            if (Build.VERSION.SDK_INT >= 24) views.setChronometerCountDown(R.id.kpt_cd, true);
            for (int i = 0; i < 6 && i < s.length() && i < names.length(); i++) {
                int color = (i == prayerIdx) ? accent : Color.WHITE;
                views.setTextViewText(NAME_IDS[i], names.getString(i));
                views.setTextViewText(TIME_IDS[i], s.getString(i).replace(" AM", "").replace(" PM", ""));
                views.setTextColor(NAME_IDS[i], color);
                views.setTextColor(TIME_IDS[i], color);
            }
            nextRefresh = target + 1000;
        } catch (Exception e) {
            views.setTextViewText(R.id.kpt_next, "Open the app");
            views.setTextViewText(R.id.kpt_at, "");
            views.setChronometer(R.id.kpt_cd, SystemClock.elapsedRealtime(), "", false);
        }
        Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (open != null) {
            open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent op = PendingIntent.getActivity(context, 7102, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.kpt_root, op);
        }
        manager.updateAppWidget(ids, views);
        if (nextRefresh > 0) scheduleRefresh(context, nextRefresh);
    }

    private static void scheduleRefresh(Context context, long when) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent intent = new Intent(context, PrayerWidget.class);
        intent.setAction(ACTION_REFRESH);
        PendingIntent pi = PendingIntent.getBroadcast(context, 7101, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        boolean exact = true;
        if (Build.VERSION.SDK_INT >= 31) exact = am.canScheduleExactAlarms();
        try {
            if (exact) am.setExactAndAllowWhileIdle(AlarmManager.RTC, when, pi);
            else am.setAndAllowWhileIdle(AlarmManager.RTC, when, pi);
        } catch (SecurityException e) {
            am.set(AlarmManager.RTC, when, pi);
        }
    }
}
