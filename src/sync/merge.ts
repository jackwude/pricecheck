import { PriceRecord } from '../types'

function getVersionTime(record: PriceRecord): number {
    const times: number[] = []
    const created = new Date(record.createdAt).getTime()
    if (!Number.isNaN(created)) times.push(created)
    const updated = new Date(record.updatedAt).getTime()
    if (!Number.isNaN(updated)) times.push(updated)
    if (record.deletedAt) {
        const deleted = new Date(record.deletedAt).getTime()
        if (!Number.isNaN(deleted)) times.push(deleted)
    }
    return times.length ? Math.max(...times) : 0
}

export function mergeRecords(local: PriceRecord[], remote: PriceRecord[]): PriceRecord[] {
    const map = new Map<string, PriceRecord>()

    for (const r of local) {
        map.set(r.id, r)
    }

    for (const r of remote) {
        const current = map.get(r.id)
        if (!current) {
            map.set(r.id, r)
            continue
        }
        const currentTime = getVersionTime(current)
        const nextTime = getVersionTime(r)
        if (nextTime > currentTime) {
            map.set(r.id, r)
        }
    }

    return Array.from(map.values()).sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime()
        const bTime = new Date(b.createdAt).getTime()
        if (Number.isNaN(aTime) && Number.isNaN(bTime)) return b.id.localeCompare(a.id)
        if (Number.isNaN(aTime)) return 1
        if (Number.isNaN(bTime)) return -1
        return bTime - aTime
    })
}
