package com.jantarmantar.wifi

import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class WiFiDirectModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WiFiDirectModule"
    }

    @ReactMethod
    fun discoverPeers(serviceType: String, promise: Promise) {
        // WiFi Direct NSD or Peering scans simulation
        promise.resolve(true)
    }

    @ReactMethod
    fun connect(deviceAddress: String, deviceId: String, promise: Promise) {
        // WiFi Direct group establishment simulation
        val eventParams = Arguments.createMap().apply {
            putString("deviceId", deviceId)
            putBoolean("groupOwner", true)
            putString("groupOwnerAddress", "192.168.49.1")
        }
        sendEvent("WIFI_DIRECT_CONNECTED", eventParams)
        promise.resolve(true)
    }

    @ReactMethod
    fun disconnect(deviceId: String, promise: Promise) {
        promise.resolve(true)
    }

    @ReactMethod
    fun sendData(address: String, data: String, promise: Promise) {
        promise.resolve(true)
    }

    @ReactMethod
    fun sendFile(deviceId: String, filePath: String, promise: Promise) {
        promise.resolve(true)
    }

    @ReactMethod
    fun stopDiscovery(promise: Promise) {
        promise.resolve(true)
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
