import * as React from 'react'
import { cx } from '../../utils/cx'

type ToastVariant = 'info' | 'success' | 'warning' | 'danger'

export interface ToastOptions {
    title: string
    description?: string
    variant?: ToastVariant
    durationMs?: number
}

interface ToastItem extends ToastOptions {
    id: string
    createdAt: number
}

interface ToastContextValue {
    push: (options: ToastOptions) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

function createId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = React.useState<ToastItem[]>([])

    const push = React.useCallback((options: ToastOptions) => {
        const item: ToastItem = {
            id: createId(),
            createdAt: Date.now(),
            variant: options.variant || 'info',
            durationMs: options.durationMs ?? 2400,
            title: options.title,
            description: options.description,
        }
        setItems((prev) => [item, ...prev].slice(0, 3))
    }, [])

    React.useEffect(() => {
        if (items.length === 0) return
        const timers = items.map((item) => {
            const ms = item.durationMs ?? 2400
            return window.setTimeout(() => {
                setItems((prev) => prev.filter((x) => x.id !== item.id))
            }, ms)
        })
        return () => {
            timers.forEach((t) => window.clearTimeout(t))
        }
    }, [items])

    return (
        <ToastContext.Provider value={{ push }}>
            {children}
            <div className="ui-toaster" aria-live="polite" aria-relevant="additions">
                {items.map((t) => (
                    <div key={t.id} className={cx('ui-toast', `ui-toast-${t.variant}`)}>
                        <div className="ui-toast-title">{t.title}</div>
                        {t.description ? <div className="ui-toast-desc">{t.description}</div> : null}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = React.useContext(ToastContext)
    if (!ctx) {
        throw new Error('ToastProvider is missing')
    }
    return ctx
}

