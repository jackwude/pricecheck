export type SyncStatus = 'disabled' | 'idle' | 'syncing' | 'error'

type Listener = () => void

let status: SyncStatus = 'disabled'
let lastError: string | null = null
let lastSyncedAt: string | null = null
const listeners = new Set<Listener>()

export function setSyncState(next: { status: SyncStatus; lastError?: string | null; lastSyncedAt?: string | null }) {
    status = next.status
    if (next.lastError !== undefined) lastError = next.lastError
    if (next.lastSyncedAt !== undefined) lastSyncedAt = next.lastSyncedAt
    for (const l of listeners) l()
}

export function getSyncState() {
    return { status, lastError, lastSyncedAt }
}

export function subscribeSyncState(listener: Listener) {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}
