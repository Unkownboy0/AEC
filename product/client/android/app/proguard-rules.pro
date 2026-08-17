# ============================================================
# CampusOS ProGuard / R8 Rules
# Applied to: release builds (assembleRelease, bundleRelease)
# ============================================================

# ---------- Stack Traces ---------------
# Preserve source file + line number info for crash reporting
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ---------- Capacitor Bridge -----------
# Keep the Capacitor JavaScript bridge & all plugin classes
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.PluginMethod public *;
}

# ---------- CampusOS App ---------------
-keep class com.campusos.app.** { *; }

# ---------- Android WebView JS Bridge --
# Required for Capacitor WebView ↔ Native bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ---------- Firebase -------------------
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# FCM Service (must be kept for push delivery)
-keep class com.google.firebase.messaging.FirebaseMessagingService { *; }

# ---------- AndroidX / Jetpack ----------
-keep class androidx.core.app.** { *; }
-keep class androidx.appcompat.** { *; }
-dontwarn androidx.**

# ---------- AndroidX Security Crypto (Android Keystore / EncryptedSharedPreferences) ----------
-keep class androidx.security.crypto.** { *; }
-dontwarn androidx.security.crypto.**
-keep class com.google.crypto.tink.** { *; }
-dontwarn com.google.crypto.tink.**

# ---------- Kotlin Coroutines / Reflection ----------
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}
-dontwarn kotlinx.coroutines.**

# ---------- Gson / JSON Serialization ----------
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# ---------- OkHttp (used by Capacitor) ----------
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# ---------- Suppress Specific Warnings ----------
-dontwarn org.bouncycastle.**
-dontwarn org.conscrypt.**
-dontwarn org.openjsse.**

