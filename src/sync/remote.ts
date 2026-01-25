export type SyncRemoteState = {
    rev: number
    blob: string | null
}

export class SyncRemoteClient {
    private apiUrl: string

    constructor(apiUrl: string) {
        this.apiUrl = apiUrl.replace(/\/+$/, '')
    }

    async fetchState(syncId: string): Promise<SyncRemoteState> {
        const url = `${this.apiUrl}?sid=${encodeURIComponent(syncId)}`
        const res = await fetch(url, { method: 'GET' })
        if (!res.ok) {
            throw new Error(`Sync GET failed: ${res.status}`)
        }
        const data = (await res.json()) as any
        return {
            rev: Number(data.rev) || 0,
            blob: typeof data.blob === 'string' ? data.blob : null,
        }
    }

    async pushState(syncId: string, rev: number, blob: string): Promise<number> {
        const url = `${this.apiUrl}?sid=${encodeURIComponent(syncId)}`
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ rev, blob }),
        })

        if (res.status === 409) {
            const data = (await res.json().catch(() => null)) as any
            const nextRev = data && Number.isFinite(Number(data.rev)) ? Number(data.rev) : rev
            const err = new Error('Conflict')
            ;(err as any).code = 409
            ;(err as any).rev = nextRev
            throw err
        }

        if (!res.ok) {
            throw new Error(`Sync PUT failed: ${res.status}`)
        }
        const data = (await res.json()) as any
        return Number(data.rev) || rev + 1
    }
}
