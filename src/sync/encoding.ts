export function bytesToBase64Url(bytes: Uint8Array): string {
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function base64UrlToBytes(base64Url: string): Uint8Array {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes
}

export function randomId(bytesLength = 16): string {
    const bytes = new Uint8Array(bytesLength)
    crypto.getRandomValues(bytes)
    return bytesToBase64Url(bytes)
}
