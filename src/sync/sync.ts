import { getAllRecordsForSync, getSettings, replaceAllRecordsForSync, saveSettings } from '../services/storage'
import { PriceRecord } from '../types'
import { decryptJson, encryptJson } from './crypto'
import { ensureSyncHash } from './hash'
import { mergeRecords } from './merge'
import { SyncRemoteClient } from './remote'
import { setSyncState } from './state'
import { normalizeSyncApiUrl } from './url'

type SyncPayloadV1 = {
    v: 1
    records: PriceRecord[]
}

function getApiUrlFromSettingsOrHash(hashApi?: string): string | null {
    const normalizedHashApi = hashApi ? normalizeSyncApiUrl(hashApi) : ''
    if (normalizedHashApi) return normalizedHashApi

    const settings = getSettings()
    const normalizedSettingsApi =
        typeof settings?.syncApiUrl === 'string' ? normalizeSyncApiUrl(settings.syncApiUrl) : ''
    if (normalizedSettingsApi) return normalizedSettingsApi

    const host = window.location.hostname
    const port = window.location.port
    const isGitHubPages = host.endsWith('github.io')
    const isViteDev = host === 'localhost' && port === '5173'
    if (isGitHubPages || isViteDev) return null

    return '/api/sync'
}

function persistApiUrlFromHash(hashApi?: string) {
    if (!hashApi) return
    const normalized = normalizeSyncApiUrl(hashApi)
    if (!normalized) return
    const settings = getSettings()
    const current = typeof settings?.syncApiUrl === 'string' ? settings.syncApiUrl.trim() : ''
    if (current === normalized) return
    saveSettings({ ...settings, syncApiUrl: normalized })
}

function isConflictError(error: unknown): error is { code: number } {
    return Boolean(error && typeof error === 'object' && (error as any).code === 409)
}

function normalizePayload(data: any): SyncPayloadV1 {
    if (!data || typeof data !== 'object') return { v: 1, records: [] }
    const records = Array.isArray(data.records) ? (data.records as PriceRecord[]) : []
    return { v: 1, records }
}

let cleanup: (() => void) | null = null

export function initSync() {
    if (typeof window === 'undefined') return
    if (cleanup) {
        cleanup()
        cleanup = null
    }

    const { syncId, api } = ensureSyncHash()
    persistApiUrlFromHash(api)
    const apiUrl = getApiUrlFromSettingsOrHash(api)
    if (!apiUrl) {
        setSyncState({ status: 'disabled', lastError: null })
        return
    }

    const client = new SyncRemoteClient(apiUrl)
    let queued = false
    let syncing = false
    let retryTimer: number | null = null

    const onRecordsChanged = () => schedule(false)
    const onOnline = () => schedule(true)

    const schedule = (immediate = false) => {
        queued = true
        if (retryTimer) window.clearTimeout(retryTimer)
        retryTimer = window.setTimeout(() => void runSync(), immediate ? 0 : 600)
    }

    const runSync = async () => {
        if (syncing) return
        if (!queued) return
        queued = false
        syncing = true
        setSyncState({ status: 'syncing', lastError: null })

        try {
            const remote = await client.fetchState(syncId)
            const remoteRev = remote.rev
            const remotePayload = remote.blob ? await decryptJson<SyncPayloadV1>(syncId, remote.blob).catch(() => null) : null
            const remoteRecords = normalizePayload(remotePayload).records

            const localRecords = getAllRecordsForSync()
            const merged = mergeRecords(localRecords, remoteRecords)
            replaceAllRecordsForSync(merged)

            const blob = await encryptJson(syncId, { v: 1, records: merged } satisfies SyncPayloadV1)
            const nextRev = await client.pushState(syncId, remoteRev, blob)
            localStorage.setItem(`pricecheck_sync_rev:${syncId}`, String(nextRev))
            setSyncState({ status: 'idle', lastError: null, lastSyncedAt: new Date().toISOString() })
        } catch (error) {
            if (isConflictError(error)) {
                schedule(true)
            } else {
                setSyncState({ status: 'error', lastError: error instanceof Error ? error.message : '同步失败' })
            }
        } finally {
            syncing = false
        }
    }

    window.addEventListener('pricecheck:records-changed', onRecordsChanged)
    window.addEventListener('online', onOnline)

    cleanup = () => {
        if (retryTimer) window.clearTimeout(retryTimer)
        window.removeEventListener('pricecheck:records-changed', onRecordsChanged)
        window.removeEventListener('online', onOnline)
    }

    schedule(true)
}
