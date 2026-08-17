package com.campusos.app;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * CampusOS Native Secure Storage Plugin for Android
 *
 * Uses Android Keystore-backed EncryptedSharedPreferences:
 * - Master key stored securely in hardware-backed Android Keystore (AES-256 GCM)
 * - SharedPreferences keys encrypted with AES-256 SIV
 * - SharedPreferences values encrypted with AES-256 GCM
 *
 * Zero plaintext persistence of JWT tokens, refresh tokens, or session secrets.
 */
@CapacitorPlugin(name = "CampusOSSecureStorage")
public class CampusOSSecureStoragePlugin extends Plugin {

    private static final String PREFS_NAME = "campusos_secure_keystore_vault";
    private SharedPreferences securePreferences;

    private synchronized SharedPreferences getSecurePreferences() throws Exception {
        if (securePreferences == null) {
            Context context = getContext();
            MasterKey masterKey = new MasterKey.Builder(context)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();

            securePreferences = EncryptedSharedPreferences.create(
                    context,
                    PREFS_NAME,
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
        }
        return securePreferences;
    }

    @PluginMethod
    public void get(PluginCall call) {
        String key = call.getString("key");
        if (key == null || key.isEmpty()) {
            call.reject("Key must be provided");
            return;
        }

        try {
            SharedPreferences prefs = getSecurePreferences();
            String value = prefs.getString(key, null);
            JSObject ret = new JSObject();
            ret.put("value", value);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("SecureStorage get failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void set(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");
        if (key == null || key.isEmpty()) {
            call.reject("Key must be provided");
            return;
        }
        if (value == null) {
            call.reject("Value must be provided");
            return;
        }

        try {
            SharedPreferences prefs = getSecurePreferences();
            prefs.edit().putString(key, value).apply();
            call.resolve();
        } catch (Exception e) {
            call.reject("SecureStorage set failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String key = call.getString("key");
        if (key == null || key.isEmpty()) {
            call.reject("Key must be provided");
            return;
        }

        try {
            SharedPreferences prefs = getSecurePreferences();
            prefs.edit().remove(key).apply();
            call.resolve();
        } catch (Exception e) {
            call.reject("SecureStorage remove failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void clear(PluginCall call) {
        try {
            SharedPreferences prefs = getSecurePreferences();
            prefs.edit().clear().apply();
            call.resolve();
        } catch (Exception e) {
            call.reject("SecureStorage clear failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void keys(PluginCall call) {
        try {
            SharedPreferences prefs = getSecurePreferences();
            Map<String, ?> allEntries = prefs.getAll();
            JSArray keysArray = new JSArray();
            for (String k : allEntries.keySet()) {
                keysArray.put(k);
            }
            JSObject ret = new JSObject();
            ret.put("keys", keysArray);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("SecureStorage keys failed: " + e.getMessage());
        }
    }
}
