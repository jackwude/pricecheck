export type Env = {
    DB: D1Database
}

function json(data: unknown, init?: ResponseInit) {
    const headers = new Headers(init?.headers)
    headers.set('content-type', 'application/json; charset=utf-8')
    return new Response(JSON.stringify(data), { ...init, headers })
}

function getSid(url: URL) {
    const sid = (url.searchParams.get('sid') || '').trim()
    return sid.length >= 16 ? sid : null
}

export const onRequestOptions: PagesFunction<Env> = async () => {
    return new Response(null, {
        status: 204,
        headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-methods': 'GET,PUT,OPTIONS',
            'access-control-allow-headers': 'content-type',
            'access-control-max-age': '86400',
        },
    })
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    const url = new URL(request.url)
    const sid = getSid(url)
    if (!sid) return json({ error: 'Invalid sid' }, { status: 400 })

    await env.DB.exec(
        'CREATE TABLE IF NOT EXISTS sync_spaces (sid TEXT PRIMARY KEY, rev INTEGER NOT NULL, blob TEXT, updated_at TEXT NOT NULL)'
    )

    const row = await env.DB.prepare('SELECT rev, blob FROM sync_spaces WHERE sid = ?1')
        .bind(sid)
        .first<{ rev: number; blob: string | null }>()

    if (!row) return json({ rev: 0, blob: null })
    return json({ rev: Number(row.rev) || 0, blob: typeof row.blob === 'string' ? row.blob : null })
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
    const url = new URL(request.url)
    const sid = getSid(url)
    if (!sid) return json({ error: 'Invalid sid' }, { status: 400 })

    const body = await request.json().catch(() => null) as any
    const incomingRev = Number(body?.rev)
    const incomingBlob = typeof body?.blob === 'string' ? body.blob : null
    if (!Number.isFinite(incomingRev) || incomingRev < 0 || !incomingBlob) {
        return json({ error: 'Invalid payload' }, { status: 400 })
    }

    await env.DB.exec(
        'CREATE TABLE IF NOT EXISTS sync_spaces (sid TEXT PRIMARY KEY, rev INTEGER NOT NULL, blob TEXT, updated_at TEXT NOT NULL)'
    )

    const nowIso = new Date().toISOString()

    const existing = await env.DB.prepare('SELECT rev FROM sync_spaces WHERE sid = ?1')
        .bind(sid)
        .first<{ rev: number }>()

    if (!existing) {
        if (incomingRev !== 0) return json({ error: 'Conflict', rev: 0 }, { status: 409 })
        await env.DB.prepare('INSERT INTO sync_spaces (sid, rev, blob, updated_at) VALUES (?1, 1, ?2, ?3)')
            .bind(sid, incomingBlob, nowIso)
            .run()
        return json({ rev: 1 })
    }

    const currentRev = Number(existing.rev) || 0
    if (incomingRev !== currentRev) return json({ error: 'Conflict', rev: currentRev }, { status: 409 })

    const nextRev = currentRev + 1
    await env.DB.prepare('UPDATE sync_spaces SET rev = ?1, blob = ?2, updated_at = ?3 WHERE sid = ?4')
        .bind(nextRev, incomingBlob, nowIso, sid)
        .run()

    return json({ rev: nextRev })
}
