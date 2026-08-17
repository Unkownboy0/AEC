import Foundation
import Capacitor
import Security

/**
 * CampusOS Native Secure Storage Plugin for iOS
 *
 * Uses Apple Keychain Services API:
 * - kSecClass: kSecClassGenericPassword
 * - kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
 * - Hardware-backed Keychain encryption
 *
 * Zero plaintext persistence of JWT tokens, refresh tokens, or session secrets in UserDefaults or plist files.
 */
@objc(CampusOSSecureStoragePlugin)
public class CampusOSSecureStoragePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CampusOSSecureStoragePlugin"
    public let jsName = "CampusOSSecureStorage"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "remove", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "keys", returnType: CAPPluginReturnPromise)
    ]

    private let serviceName = "com.campusos.app.securevault"

    @objc func get(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.isEmpty else {
            call.reject("Key must be provided")
            return
        }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)

        if status == errSecSuccess, let data = item as? Data, let value = String(data: data, encoding: .utf8) {
            call.resolve(["value": value])
        } else if status == errSecItemNotFound {
            call.resolve(["value": NSNull()])
        } else {
            call.reject("Keychain get failed with OSStatus: \(status)")
        }
    }

    @objc func set(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.isEmpty else {
            call.reject("Key must be provided")
            return
        }
        guard let value = call.getString("value"), let data = value.data(using: .utf8) else {
            call.reject("Value must be provided")
            return
        }

        // Delete existing item first to ensure clean atomic write
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(deleteQuery as CFDictionary)

        let addQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]

        let status = SecItemAdd(addQuery as CFDictionary, nil)
        if status == errSecSuccess {
            call.resolve()
        } else {
            call.reject("Keychain set failed with OSStatus: \(status)")
        }
    }

    @objc func remove(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), !key.isEmpty else {
            call.reject("Key must be provided")
            return
        }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key
        ]

        let status = SecItemDelete(query as CFDictionary)
        if status == errSecSuccess || status == errSecItemNotFound {
            call.resolve()
        } else {
            call.reject("Keychain remove failed with OSStatus: \(status)")
        }
    }

    @objc func clear(_ call: CAPPluginCall) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName
        ]

        let status = SecItemDelete(query as CFDictionary)
        if status == errSecSuccess || status == errSecItemNotFound {
            call.resolve()
        } else {
            call.reject("Keychain clear failed with OSStatus: \(status)")
        }
    }

    @objc func keys(_ call: CAPPluginCall) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecReturnAttributes as String: true,
            kSecMatchLimit as String: kSecMatchLimitAll
        ]

        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        if status == errSecSuccess, let items = result as? [[String: Any]] {
            var keysList: [String] = []
            for item in items {
                if let account = item[kSecAttrAccount as String] as? String {
                    keysList.append(account)
                }
            }
            call.resolve(["keys": keysList])
        } else if status == errSecItemNotFound {
            call.resolve(["keys": []])
        } else {
            call.reject("Keychain keys query failed with OSStatus: \(status)")
        }
    }
}
