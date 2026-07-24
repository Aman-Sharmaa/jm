package com.jantarmantar.crypto

import android.util.Base64
import com.facebook.react.bridge.*
import java.security.*
import java.security.spec.ECGenParameterSpec
import java.security.spec.PKCS8EncodedKeySpec
import java.security.spec.X509EncodedKeySpec
import javax.crypto.Cipher
import javax.crypto.KeyAgreement
import javax.crypto.KeyGenerator
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

class CryptoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "CryptoModule"
    }

    @ReactMethod
    fun generateKeyPair(curve: String, promise: Promise) {
        try {
            val keyGen = KeyPairGenerator.getInstance("EC")
            val ecSpec = ECGenParameterSpec(curve)
            keyGen.initialize(ecSpec, SecureRandom())
            val kp = keyGen.generateKeyPair()

            val publicKeyBase64 = Base64.encodeToString(kp.public.encoded, Base64.NO_WRAP)
            val privateKeyBase64 = Base64.encodeToString(kp.private.encoded, Base64.NO_WRAP)

            val result = Arguments.createMap().apply {
                putString("publicKey", publicKeyBase64)
                putString("privateKey", privateKeyBase64)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("KEYGEN_ERR", e.message, e)
        }
    }

    @ReactMethod
    fun deriveSharedSecret(privateKeyBase64: String, publicKeyBase64: String, promise: Promise) {
        try {
            val kf = KeyFactory.getInstance("EC")
            
            val privateKeyBytes = Base64.decode(privateKeyBase64, Base64.NO_WRAP)
            val privateKey = kf.generatePrivate(PKCS8EncodedKeySpec(privateKeyBytes))

            val publicKeyBytes = Base64.decode(publicKeyBase64, Base64.NO_WRAP)
            val publicKey = kf.generatePublic(X509EncodedKeySpec(publicKeyBytes))

            val ka = KeyAgreement.getInstance("ECDH")
            ka.init(privateKey)
            ka.doPhase(publicKey, true)
            val sharedSecret = ka.generateSecret()

            val secretBase64 = Base64.encodeToString(sharedSecret, Base64.NO_WRAP)
            promise.resolve(secretBase64)
        } catch (e: Exception) {
            promise.reject("DERIVE_ERR", e.message, e)
        }
    }

    @ReactMethod
    fun encrypt(plaintext: String, keyBase64: String, promise: Promise) {
        try {
            val keyBytes = Base64.decode(keyBase64, Base64.NO_WRAP)
            val secretKey = SecretKeySpec(keyBytes, "AES")

            val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
            val iv = ByteArray(16)
            SecureRandom().nextBytes(iv)
            val ivSpec = IvParameterSpec(iv)

            cipher.init(Cipher.ENCRYPT_MODE, secretKey, ivSpec)
            val ciphertextBytes = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))

            val ciphertextBase64 = Base64.encodeToString(ciphertextBytes, Base64.NO_WRAP)
            val ivBase64 = Base64.encodeToString(iv, Base64.NO_WRAP)

            val result = Arguments.createMap().apply {
                putString("ciphertext", ciphertextBase64)
                putString("iv", ivBase64)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ENCRYPT_ERR", e.message, e)
        }
    }

    @ReactMethod
    fun decrypt(ciphertextBase64: String, ivBase64: String, keyBase64: String, promise: Promise) {
        try {
            val keyBytes = Base64.decode(keyBase64, Base64.NO_WRAP)
            val secretKey = SecretKeySpec(keyBytes, "AES")

            val iv = Base64.decode(ivBase64, Base64.NO_WRAP)
            val ivSpec = IvParameterSpec(iv)

            val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
            cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec)

            val ciphertextBytes = Base64.decode(ciphertextBase64, Base64.NO_WRAP)
            val decryptedBytes = cipher.doFinal(ciphertextBytes)

            promise.resolve(String(decryptedBytes, Charsets.UTF_8))
        } catch (e: Exception) {
            promise.reject("DECRYPT_ERR", e.message, e)
        }
    }

    @ReactMethod
    fun sign(message: String, privateKeyBase64: String, promise: Promise) {
        try {
            val kf = KeyFactory.getInstance("EC")
            val privateKeyBytes = Base64.decode(privateKeyBase64, Base64.NO_WRAP)
            val privateKey = kf.generatePrivate(PKCS8EncodedKeySpec(privateKeyBytes))

            val signature = Signature.getInstance("SHA256withECDSA")
            signature.initSign(privateKey)
            signature.update(message.toByteArray(Charsets.UTF_8))
            val sigBytes = signature.sign()

            promise.resolve(Base64.encodeToString(sigBytes, Base64.NO_WRAP))
        } catch (e: Exception) {
            promise.reject("SIGN_ERR", e.message, e)
        }
    }

    @ReactMethod
    fun verify(message: String, signatureBase64: String, publicKeyBase64: String, promise: Promise) {
        try {
            val kf = KeyFactory.getInstance("EC")
            val publicKeyBytes = Base64.decode(publicKeyBase64, Base64.NO_WRAP)
            val publicKey = kf.generatePublic(X509EncodedKeySpec(publicKeyBytes))

            val signature = Signature.getInstance("SHA256withECDSA")
            signature.initVerify(publicKey)
            signature.update(message.toByteArray(Charsets.UTF_8))
            val sigBytes = Base64.decode(signatureBase64, Base64.NO_WRAP)

            promise.resolve(signature.verify(sigBytes))
        } catch (e: Exception) {
            promise.reject("VERIFY_ERR", e.message, e)
        }
    }

    @ReactMethod
    fun sha256(data: String, promise: Promise) {
        try {
            val digest = MessageDigest.getInstance("SHA-256")
            val hashBytes = digest.digest(data.toByteArray(Charsets.UTF_8))
            val hexString = hashBytes.joinToString("") { "%02x".format(it) }
            promise.resolve(hexString)
        } catch (e: Exception) {
            promise.reject("HASH_ERR", e.message, e)
        }
    }

    @ReactMethod
    fun generateNonce(promise: Promise) {
        try {
            val secureRandom = SecureRandom()
            val nonce = ByteArray(16)
            secureRandom.nextBytes(nonce)
            promise.resolve(Base64.encodeToString(nonce, Base64.NO_WRAP))
        } catch (e: Exception) {
            promise.reject("NONCE_ERR", e.message, e)
        }
    }

    @ReactMethod
    fun generateAESKey(keyLength: Int, promise: Promise) {
        try {
            val keyGen = KeyGenerator.getInstance("AES")
            keyGen.init(keyLength, SecureRandom())
            val key = keyGen.generateKey()
            promise.resolve(Base64.encodeToString(key.encoded, Base64.NO_WRAP))
        } catch (e: Exception) {
            promise.reject("KEYGEN_ERR", e.message, e)
        }
    }
}
