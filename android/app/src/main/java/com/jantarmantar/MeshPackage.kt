package com.jantarmantar

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.jantarmantar.bluetooth.BLEModule
import com.jantarmantar.crypto.CryptoModule
import com.jantarmantar.nearby.NearbyModule
import com.jantarmantar.wifi.WiFiDirectModule

class MeshPackage : ReactPackage {

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        val modules = ArrayList<NativeModule>()
        modules.add(CryptoModule(reactContext))
        modules.add(BLEModule(reactContext))
        modules.add(NearbyModule(reactContext))
        modules.add(WiFiDirectModule(reactContext))
        return modules
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
