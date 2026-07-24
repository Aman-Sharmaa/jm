package com.jantarmantar.nearby

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class NearbyModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "NearbyModule"
    }

    @ReactMethod
    fun startAdvertising(serviceId: String, localDeviceName: String, promise: Promise) {
        // Google Nearby Connections advertising simulation
        // In fully offline environment, the app calls Nearby.getConnectionsClient(context).startAdvertising()
        // We resolve successfully.
        promise.resolve(true)
    }

    @ReactMethod
    fun startDiscovery(serviceId: String, promise: Promise) {
        // Nearby Connections discovery simulation
        promise.resolve(true)
    }

    @ReactMethod
    fun connect(endpointId: String, promise: Promise) {
        // Connection simulation
        val eventParams = Arguments.createMap().apply {
            putString("endpointId", endpointId)
            putString("deviceId", "peer-uuid-$endpointId")
            putString("status", "OK")
        }
        sendEvent("NEARBY_CONNECTION_RESULT", eventParams)
        promise.resolve(true)
    }

    @ReactMethod
    fun disconnect(endpointId: String, promise: Promise) {
        promise.resolve(true)
    }

    @ReactMethod
    fun sendBytesPayload(endpointId: String, data: String, promise: Promise) {
        promise.resolve(true)
    }

    @ReactMethod
    fun sendFilePayload(endpointId: String, filePath: String, transferId: String, promise: Promise) {
        promise.resolve(true)
    }

    @ReactMethod
    fun stopAll(promise: Promise) {
        promise.resolve(true)
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
