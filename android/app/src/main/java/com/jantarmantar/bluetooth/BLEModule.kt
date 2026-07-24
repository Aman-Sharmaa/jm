package com.jantarmantar.bluetooth

import android.bluetooth.BluetoothAdapter
import android.bluetooth.le.*
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.os.ParcelUuid
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.UUID

class BLEModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var bluetoothAdapter: BluetoothAdapter? = BluetoothAdapter.getDefaultAdapter()
    private var advertiser: BluetoothLeAdvertiser? = null
    private var scanner: BluetoothLeScanner? = null
    private val handler = Handler(Looper.getMainLooper())

    private var advertiseCallback: AdvertiseCallback? = null
    private var scanCallback: ScanCallback? = null

    override fun getName(): String {
        return "BLEModule"
    }

    @ReactMethod
    fun startAdvertising(serviceUuidStr: String, characteristicUuidStr: String, devicePayload: String, promise: Promise) {
        val adapter = bluetoothAdapter
        if (adapter == null || !adapter.isEnabled) {
            promise.reject("BLE_DISABLED", "Bluetooth adapter is not enabled")
            return
        }

        advertiser = adapter.bluetoothLeAdvertiser
        if (advertiser == null) {
            promise.reject("BLE_ADV_UNSUPPORTED", "BLE Advertising is not supported on this device")
            return
        }

        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(true)
            .build()

        val serviceUuid = ParcelUuid(UUID.fromString(serviceUuidStr))
        
        // Compact payload into device name/manufacturer data to fit BLE advertising packet (31 bytes limit)
        // In real app, we chunk payload or set up GATT service to read complete identity.
        val truncatedPayload = if (devicePayload.length > 20) devicePayload.take(20) else devicePayload
        val data = AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .setIncludeTxPowerLevel(true)
            .addServiceUuid(serviceUuid)
            .addServiceData(serviceUuid, truncatedPayload.toByteArray(Charsets.UTF_8))
            .build()

        advertiseCallback = object : AdvertiseCallback() {
            override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
                super.onStartSuccess(settingsInEffect)
                promise.resolve(true)
            }

            override fun onStartFailure(errorCode: Int) {
                super.onStartFailure(errorCode)
                promise.reject("BLE_ADV_FAILED", "BLE Advertise failed with error code: $errorCode")
            }
        }

        advertiser?.startAdvertising(settings, data, advertiseCallback)
    }

    @ReactMethod
    fun startScanning(serviceUuidStr: String, promise: Promise) {
        val adapter = bluetoothAdapter
        if (adapter == null || !adapter.isEnabled) {
            promise.reject("BLE_DISABLED", "Bluetooth adapter is not enabled")
            return
        }

        scanner = adapter.bluetoothLeScanner
        if (scanner == null) {
            promise.reject("BLE_SCAN_UNSUPPORTED", "BLE Scanning is not supported on this device")
            return
        }

        val filters = mutableListOf<ScanFilter>()
        filters.add(ScanFilter.Builder()
            .setServiceUuid(ParcelUuid(UUID.fromString(serviceUuidStr)))
            .build())

        val settings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .build()

        scanCallback = object : ScanCallback() {
            override fun onScanResult(callbackType: Int, result: ScanResult?) {
                super.onScanResult(callbackType, result)
                result?.let {
                    val device = it.device
                    val rssi = it.rssi
                    val record = it.scanRecord
                    val serviceUuid = ParcelUuid(UUID.fromString(serviceUuidStr))
                    val serviceDataBytes = record?.getServiceData(serviceUuid)
                    val rawPayload = if (serviceDataBytes != null) String(serviceDataBytes, Charsets.UTF_8) else ""

                    val map = Arguments.createMap().apply {
                        putString("deviceId", device.address)
                        putString("displayName", device.name ?: "Peer-${device.address.takeLast(5)}")
                        putInt("rssi", rssi)
                        putString("rawPayload", rawPayload)
                    }
                    sendEvent("BLE_PEER_DISCOVERED", map)
                }
            }

            override fun onScanFailed(errorCode: Int) {
                super.onScanFailed(errorCode)
                sendEvent("BLE_ERROR", Arguments.createMap().apply {
                    putString("error", "Scan failed with error code: $errorCode")
                })
            }
        }

        scanner?.startScan(filters, settings, scanCallback)
        promise.resolve(true)
    }

    @ReactMethod
    fun stopAll(promise: Promise) {
        advertiseCallback?.let {
            advertiser?.stopAdvertising(it)
            advertiseCallback = null
        }
        scanCallback?.let {
            scanner?.stopScan(it)
            scanCallback = null
        }
        promise.resolve(true)
    }

    @ReactMethod
    fun sendData(deviceAddress: String, characteristicUuidStr: String, data: String, promise: Promise) {
        // BLE direct GATT client connection simulation
        // In real app, connectGatt is called, MTU is negotiated, and characteric write occurs.
        // For scaffold, we mock success.
        handler.postDelayed({
            promise.resolve(true)
        }, 300)
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
