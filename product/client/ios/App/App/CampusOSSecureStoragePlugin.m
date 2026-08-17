#import <Capacitor/Capacitor.h>

CAP_PLUGIN(CampusOSSecureStoragePlugin, "CampusOSSecureStorage",
    CAP_PLUGIN_METHOD(get, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(set, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(remove, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(clear, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(keys, CAPPluginReturnPromise);
)
