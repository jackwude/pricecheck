export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || ''
        const allowedOrigin = env.ALLOWED_ORIGIN || 'https://jackwude.github.io'
        const headers = {
            'content-type': 'application/json; charset=utf-8',
            'access-control-allow-origin': origin === allowedOrigin ? origin : allowedOrigin,
            'access-control-allow-methods': 'GET,PUT,OPTIONS',
            'access-control-allow-headers': 'content-type',
            'access-control-max-age': '86400',
        }

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers })
        }

        const url = new URL(request.url)
        if (url.pathname !== '/sync') {
            return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers })
        }

        const sid = url.searchParams.get('sid') || ''
        if (!sid || sid.length < 16) {
            return new Response(JSON.stringify({ error: 'Invalid sid' }), { status: 400, headers })
        }

        const key = `sync:${sid}`

        if (request.method === 'GET') {
            const raw = await env.SYNC_KV.get(key)
            if (!raw) {
                return new Response(JSON.stringify({ rev: 0, blob: null }), { status: 200, headers })
            }
            return new Response(raw, { status: 200, headers })
        }

        if (request.method === 'PUT') {
            const body = await request.json().catch(() => null)
            if (!body || typeof body !== 'object') {
                return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400, headers })
            }
            const incomingRev = Number(body.rev)
            const incomingBlob = typeof body.blob === 'string' ? body.blob : null
            if (!Number.isFinite(incomingRev) || incomingRev < 0 || !incomingBlob) {
                return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers })
            }

            const raw = await env.SYNC_KV.get(key)
            const current = raw ? JSON.parse(raw) : { rev: 0, blob: null }
            const currentRev = Number(current.rev) || 0

            if (incomingRev !== currentRev) {
                return new Response(JSON.stringify({ error: 'Conflict', rev: currentRev }), { status: 409, headers })
            }

            const nextRev = currentRev + 1
            await env.SYNC_KV.put(key, JSON.stringify({ rev: nextRev, blob: incomingBlob }))
            return new Response(JSON.stringify({ rev: nextRev }), { status: 200, headers })
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers })
    },
}
