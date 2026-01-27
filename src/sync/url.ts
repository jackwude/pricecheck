export function normalizeSyncApiUrl(raw: string): string {
    const trimmed = raw.trim()
    if (!trimmed) return ''

    const withoutHash = trimmed.split('#')[0] || ''
    const withoutQuery = withoutHash.split('?')[0] || ''
    const base = withoutQuery.replace(/\/+$/, '')

    if (!base) return ''
    if (base.startsWith('/')) return base

    let parsed: URL
    try {
        parsed = new URL(base)
    } catch {
        return ''
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return ''
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`
}
