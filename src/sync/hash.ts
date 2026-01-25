import { randomId } from './encoding'

export type SyncHash = {
    syncId: string
    api?: string
}

function parseHash(): Record<string, string> {
    const raw = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
    const parts = raw.split('&').filter(Boolean)
    const out: Record<string, string> = {}
    for (const part of parts) {
        const [k, v] = part.split('=')
        if (!k) continue
        out[decodeURIComponent(k)] = decodeURIComponent(v || '')
    }
    return out
}

function buildHash(params: Record<string, string | undefined>): string {
    const parts: string[] = []
    for (const [k, v] of Object.entries(params)) {
        if (!v) continue
        parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    }
    return parts.length ? `#${parts.join('&')}` : ''
}

export function ensureSyncHash(): SyncHash {
    const parsed = parseHash()
    const existingSyncId = parsed.sync
    const storedSyncId = localStorage.getItem('pricecheck_sync_id') || ''
    const syncId = (existingSyncId || storedSyncId || randomId(24)).trim()

    const api = (parsed.api || '').trim() || undefined

    localStorage.setItem('pricecheck_sync_id', syncId)

    const nextHash = buildHash({ sync: syncId, api })
    if (window.location.hash !== nextHash) {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`)
    }

    return { syncId, api }
}

export function buildSyncLink(syncId: string, api?: string): string {
    const base = `${window.location.origin}${window.location.pathname}`
    const hash = buildHash({ sync: syncId, api })
    return `${base}${hash}`
}
