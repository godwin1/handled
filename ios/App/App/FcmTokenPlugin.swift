import Capacitor
import FirebaseMessaging

// @capacitor/push-notifications' 'registration' event gives iOS the raw
// APNs device token, not an FCM registration token - but our server sends
// through Firebase Cloud Messaging, which needs the latter. This plugin
// is a thin bridge: it just asks the Firebase SDK (already fed the APNs
// token via AppDelegate.apnsToken) for the real FCM token on demand.
@objc(FcmTokenPlugin)
public class FcmTokenPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "FcmTokenPlugin"
    public let jsName = "FcmToken"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getToken", returnType: CAPPluginReturnPromise)
    ]

    @objc func getToken(_ call: CAPPluginCall) {
        Messaging.messaging().token { token, error in
            if let error = error {
                call.reject(error.localizedDescription)
                return
            }
            call.resolve(["token": token ?? ""])
        }
    }
}
