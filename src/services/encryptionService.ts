
const DB_NAME = 'schoolsphere_e2ee';
const STORE_NAME = 'keys';
const KEY_PAIR_ID = 'user_key_pair';

export class EncryptionService {
    private dbPromise: Promise<IDBDatabase>;

    constructor() {
        this.dbPromise = this.initDB();
    }

    private initDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME); // Key-value store
                }
            };
        });
    }

    // Generate and store RSA-OAEP key pair
    async generateKeyPair(): Promise<CryptoKeyPair> {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            false, // Private key matches storing requirement (not exportable via standard means if strictly handled, but we need to store it in IDB)
            ["encrypt", "decrypt"]
        );

        await this.storeKeyPair(keyPair);
        return keyPair;
    }

    private async storeKeyPair(keyPair: CryptoKeyPair): Promise<void> {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(keyPair, KEY_PAIR_ID);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async loadKeyPair(): Promise<CryptoKeyPair | null> {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(KEY_PAIR_ID);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    // Export public key to PEM/Base64 for server storage
    async exportPublicKey(key: CryptoKey): Promise<string> {
        const exported = await window.crypto.subtle.exportKey("spki", key);
        return this.arrayBufferToBase64(exported);
    }

    // Import public key from server (PEM/Base64)
    async importPublicKey(base64Key: string): Promise<CryptoKey> {
        const binaryDer = this.base64ToArrayBuffer(base64Key);
        return await window.crypto.subtle.importKey(
            "spki",
            binaryDer,
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
            },
            true,
            ["encrypt"]
        );
    }

    // Encrypt message: 
    // 1. Generate AES session key
    // 2. Encrypt Data with AES
    // 3. Encrypt AES key with Recipient Public Key
    // 4. Encrypt AES key with Sender Public Key (for history)
    async encryptMessage(
        text: string,
        recipientPublicKey: CryptoKey,
        senderPublicKey: CryptoKey
    ): Promise<{
        encryptedContent: string;
        iv: string;
        recipientKeyEncrypted: string;
        senderKeyEncrypted: string;
    }> {
        // 1. Generate AES Session Key
        const sessionKey = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        // 2. Encrypt Text
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedText = new TextEncoder().encode(text);
        const encryptedContentBuffer = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            sessionKey,
            encodedText
        );

        // 3. Export Session Key (Raw) to encrypt it
        const sessionKeyRaw = await window.crypto.subtle.exportKey("raw", sessionKey);

        // 4. Encrypt Session Key for Recipient
        const recipientKeyEncryptedBuffer = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            recipientPublicKey,
            sessionKeyRaw
        );

        // 5. Encrypt Session Key for Sender
        const senderKeyEncryptedBuffer = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            senderPublicKey,
            sessionKeyRaw
        );

        return {
            encryptedContent: this.arrayBufferToBase64(encryptedContentBuffer),
            iv: this.arrayBufferToBase64(iv),
            recipientKeyEncrypted: this.arrayBufferToBase64(recipientKeyEncryptedBuffer),
            senderKeyEncrypted: this.arrayBufferToBase64(senderKeyEncryptedBuffer),
        };
    }

    // Decrypt message
    async decryptMessage(
        encryptedContentBase64: string,
        ivBase64: string,
        encryptedSessionKeyBase64: string, // This is the version encrypted for the current user
        privateKey: CryptoKey
    ): Promise<string> {
        try {
            // 1. Decrypt Session Key
            const encryptedSessionKey = this.base64ToArrayBuffer(encryptedSessionKeyBase64);
            const sessionKeyRaw = await window.crypto.subtle.decrypt(
                { name: "RSA-OAEP" },
                privateKey,
                encryptedSessionKey
            );

            // 2. Import Session Key
            const sessionKey = await window.crypto.subtle.importKey(
                "raw",
                sessionKeyRaw,
                { name: "AES-GCM" },
                false,
                ["decrypt"]
            );

            // 3. Decrypt Content
            const encryptedContent = this.base64ToArrayBuffer(encryptedContentBase64);
            const iv = this.base64ToArrayBuffer(ivBase64);

            const decryptedContentBuffer = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                sessionKey,
                encryptedContent
            );

            return new TextDecoder().decode(decryptedContentBuffer);
        } catch (e) {
            console.error("Decryption failed:", e);
            return "[Decryption Failed]";
        }
    }

    // Utilities
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }
}

export const encryptionService = new EncryptionService();
