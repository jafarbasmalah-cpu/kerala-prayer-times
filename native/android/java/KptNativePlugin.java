package com.kerala.prayertimes;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Small native helper: home-screen widget data, battery-optimisation status and settings shortcuts. */
@CapacitorPlugin(name = "KptNative")
public class KptNativePlugin extends Plugin {

    @PluginMethod
    public void setWidgetData(PluginCall call) {
        String json = call.getString("json", "");
        Context ctx = getContext();
        ctx.getSharedPreferences(PrayerWidget.PREFS, Context.MODE_PRIVATE).edit().putString("data", json).apply();
        PrayerWidget.updateAll(ctx);
        call.resolve();
    }

    @PluginMethod
    public void batteryStatus(PluginCall call) {
        JSObject r = new JSObject();
        boolean unrestricted = false;
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        if (pm != null) unrestricted = pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
        r.put("unrestricted", unrestricted);
        r.put("manufacturer", Build.MANUFACTURER);
        call.resolve(r);
    }

    @PluginMethod
    public void openBatterySettings(PluginCall call) {
        // App info page: Battery > Unrestricted (works on all Android versions and makers).
        openAppDetails();
        call.resolve();
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        openAppDetails();
        call.resolve();
    }

    @PluginMethod
    public void pinWidget(PluginCall call) {
        JSObject r = new JSObject();
        boolean ok = false;
        if (Build.VERSION.SDK_INT >= 26) {
            AppWidgetManager mgr = AppWidgetManager.getInstance(getContext());
            if (mgr != null && mgr.isRequestPinAppWidgetSupported()) {
                ok = mgr.requestPinAppWidget(new ComponentName(getContext(), PrayerWidget.class), null, null);
            }
        }
        r.put("ok", ok);
        call.resolve(r);
    }

    private void openAppDetails() {
        try {
            Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Exception e) {
            try {
                Intent i = new Intent(Settings.ACTION_SETTINGS);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
            } catch (Exception ignored) { }
        }
    }
}
