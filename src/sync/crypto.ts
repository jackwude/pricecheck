import { base64UrlToBytes, bytesToBase64Url } from './encoding'

async function deriveKey(syncId: string): Promise<CryptoKey> {
    const data = new TextEncoder().encode(syncId)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

export async function encryptJson(syncId: string, payload: unknown): Promise<string> {
    const key = await deriveKey(syncId)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const plaintext = new TextEncoder().encode(JSON.stringify(payload))
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
    return ['v1', bytesToBase64Url(iv), bytesToBase64Url(new Uint8Array(ciphertext))].join('.')
}

export async function decryptJson<T>(syncId: string, blob: string): Promise<T> {
    const [version, ivB64, dataB64] = blob.split('.')
    if (version !== 'v1' || !ivB64 || !dataB64) {
        throw new Error('Invalid blob')
    }
    const key = await deriveKey(syncId)
    const iv = base64UrlToBytes(ivB64)
    const data = base64UrlToBytes(dataB64)
    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as unknown as BufferSource },
        key,
        data as unknown as BufferSource
    )
    const json = new TextDecoder().decode(plaintext)
    return JSON.parse(json) as T
}
