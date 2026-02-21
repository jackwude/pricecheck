import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllRecords, refreshRecords, deleteRecordsByUniqueName } from '../services/storage'
import { PriceRecord } from '../types'
import { IconButton } from '../components/ui/IconButton'
import { Input } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/ui/ToastProvider'
import { Calculator, Folder, Settings, Plus, PackageSearch, X } from 'lucide-react'

const LONG_PRESS_DELAY_MS = 1000
const LONG_PRESS_CONFIRM_MS = 450

export default function HomePage() {
    const [records, setRecords] = useState<PriceRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [pendingDeleteUniqueName, setPendingDeleteUniqueName] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [pressingUniqueName, setPressingUniqueName] = useState<string | null>(null)
    const [suppressClickUniqueName, setSuppressClickUniqueName] = useState<string | null>(null)
    const navigate = useNavigate()
    const { push } = useToast()
    const longPressDelayTimerRef = useRef<number | null>(null)
    const longPressConfirmTimerRef = useRef<number | null>(null)

    useEffect(() => {
        void loadRecords()
        const onChanged = () => {
            setIsRefreshing(true)
            refreshRecords()
                .then((newRecords) => {
                    setRecords(newRecords)
                })
                .catch((error) => {
                    console.error('刷新记录失败:', error)
                    push({ title: '刷新失败', description: '请稍后重试。', variant: 'danger' })
                })
                .finally(() => {
                    setIsRefreshing(false)
                })
        }
        window.addEventListener('pricecheck:records-changed', onChanged)
        return () => window.removeEventListener('pricecheck:records-changed', onChanged)
    }, [push])

    const loadRecords = async () => {
        setIsLoading(true)
        try {
            const allRecords = await getAllRecords()
            setRecords(allRecords)
        } catch (error) {
            console.error('加载记录失败:', error)
            push({ title: '加载失败', description: '请稍后重试。', variant: 'danger' })
        } finally {
            setIsLoading(false)
        }
    }

    const groupedRecords = useMemo(() => {
        const groups = new Map<string, { record: PriceRecord; count: number }>()

        for (const record of records) {
            const existing = groups.get(record.uniqueName)
            if (!existing) {
                groups.set(record.uniqueName, { record, count: 1 })
            } else {
                existing.count++
                if (record.unitPrice < existing.record.unitPrice) {
                    existing.record = record
                }
            }
        }

        return groups
    }, [records])

    const filteredUniqueNames = useMemo(() => {
        const uniqueNames = Array.from(groupedRecords.keys())
        if (!searchQuery) return uniqueNames

        return uniqueNames.filter((uniqueName) => {
            return uniqueName.toLowerCase().includes(searchQuery.toLowerCase())
        })
    }, [groupedRecords, searchQuery])

    const handleRecordClick = (uniqueName: string) => {
        if (suppressClickUniqueName === uniqueName) {
            setSuppressClickUniqueName(null)
            return
        }
        navigate(`/product/${encodeURIComponent(uniqueName)}`)
    }

    const clearLongPressTimer = () => {
        if (longPressDelayTimerRef.current !== null) {
            window.clearTimeout(longPressDelayTimerRef.current)
            longPressDelayTimerRef.current = null
        }
        if (longPressConfirmTimerRef.current !== null) {
            window.clearTimeout(longPressConfirmTimerRef.current)
            longPressConfirmTimerRef.current = null
        }
    }

    const cancelLongPress = () => {
        clearLongPressTimer()
        setPressingUniqueName(null)
    }

    const startLongPress = (uniqueName: string) => {
        cancelLongPress()
        longPressDelayTimerRef.current = window.setTimeout(() => {
            setPressingUniqueName(uniqueName)
            longPressConfirmTimerRef.current = window.setTimeout(() => {
                setPendingDeleteUniqueName(uniqueName)
                setSuppressClickUniqueName(uniqueName)
                setPressingUniqueName(null)
                if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
                    navigator.vibrate(18)
                }
            }, LONG_PRESS_CONFIRM_MS)
        }, LONG_PRESS_DELAY_MS)
    }

    const handleConfirmDelete = async () => {
        if (!pendingDeleteUniqueName) return

        setIsDeleting(true)
        try {
            const deletedCount = await deleteRecordsByUniqueName(pendingDeleteUniqueName)
            push({
                title: '删除成功',
                description: `已删除 ${deletedCount} 条记录。`,
                variant: 'success',
            })
        } catch (error) {
            console.error('删除记录失败:', error)
            push({ title: '删除失败', description: '请稍后重试。', variant: 'danger' })
        } finally {
            setIsDeleting(false)
            setPendingDeleteUniqueName(null)
        }
    }

    useEffect(() => {
        return () => {
            cancelLongPress()
        }
    }, [])

    return (
        <div className="page">
            <header className="page-header home-header">
                <div>
                    <h1>价格追踪</h1>
                    <p className="home-header-subtitle">移动端优先 · 快速查历史最低价</p>
                </div>
                <div className="header-actions">
                    <IconButton label="快速计算器" onClick={() => navigate('/calculator')}>
                        <Calculator size={18} />
                    </IconButton>
                    <IconButton label="分类浏览" onClick={() => navigate('/categories')}>
                        <Folder size={18} />
                    </IconButton>
                    <IconButton label="设置" onClick={() => navigate('/settings')}>
                        <Settings size={18} />
                    </IconButton>
                </div>
            </header>

            <div className="search-bar">
                <div className="home-search-row">
                    <Input
                        type="text"
                        placeholder="搜索商品..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery ? (
                        <button
                            type="button"
                            className="home-clear-button"
                            onClick={() => setSearchQuery('')}
                            aria-label="清除搜索"
                            title="清除"
                        >
                            <X size={18} />
                        </button>
                    ) : null}
                </div>
                <div className="home-search-hint">点击查看详情，长按卡片可删除整组记录</div>
            </div>

            <div className="records-grid">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="record-mini-card skeleton-card">
                            <div className="skeleton skeleton-title" />
                            <div className="skeleton skeleton-price" />
                            <div className="skeleton skeleton-brand" />
                        </div>
                    ))
                ) : filteredUniqueNames.length === 0 ? (
                    <div className="records-grid-empty">
                        <EmptyState
                            icon={<PackageSearch size={44} />}
                            title={searchQuery ? '没有找到匹配记录' : '还没有记录'}
                            description={searchQuery ? '试试换个关键词，或者清除搜索条件。' : '点击右上角新增按钮，添加第一条记录。'}
                            action={
                                searchQuery ? (
                                    <Button variant="secondary" size="sm" onClick={() => setSearchQuery('')}>
                                        清除搜索
                                    </Button>
                                ) : (
                                    <Button variant="primary" size="sm" onClick={() => navigate('/add')}>
                                        新增记录
                                    </Button>
                                )
                            }
                        />
                    </div>
                ) : (
                    filteredUniqueNames.map((uniqueName) => {
                        const group = groupedRecords.get(uniqueName)
                        if (!group) return null
                        const { record, count } = group
                        const isPressing = pressingUniqueName === uniqueName
                        return (
                            <div
                                key={uniqueName}
                                className={`record-mini-card ${isRefreshing ? 'is-refreshing' : ''} ${isPressing ? 'is-pressing' : ''}`}
                                onClick={() => handleRecordClick(uniqueName)}
                                onMouseDown={(e) => {
                                    if (e.button !== 0) return
                                    startLongPress(uniqueName)
                                }}
                                onMouseUp={cancelLongPress}
                                onMouseLeave={cancelLongPress}
                                onTouchStart={() => startLongPress(uniqueName)}
                                onTouchEnd={cancelLongPress}
                                onTouchCancel={cancelLongPress}
                                role="button"
                                tabIndex={0}
                                aria-label={`${record.uniqueName}，当前最低价 ${(record.unitPrice).toFixed(2)} 元每${record.unitType}`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        handleRecordClick(uniqueName)
                                    }
                                }}
                            >
                                <div className="mini-card-header">
                                    <div className="mini-card-title-group">
                                        <span className="mini-card-name">{record.uniqueName}</span>
                                        {count > 1 && <span className="mini-card-count">{count}</span>}
                                    </div>
                                    <div className="mini-card-price">
                                        ¥{(record.unitPrice).toFixed(2)}
                                        <span className="mini-card-unit">/{record.unitType}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <ConfirmDialog
                show={Boolean(pendingDeleteUniqueName)}
                title={isDeleting ? '删除中...' : '确认删除'}
                message={pendingDeleteUniqueName ? `确定删除「${pendingDeleteUniqueName}」全部历史记录吗？` : ''}
                confirmText={isDeleting ? '删除中...' : '确认删除'}
                confirmVariant="danger"
                onConfirm={() => {
                    if (!isDeleting) {
                        void handleConfirmDelete()
                    }
                }}
                onCancel={() => setPendingDeleteUniqueName(null)}
            />

            <button className="fab" type="button" aria-label="新增记录" title="新增记录" onClick={() => navigate('/add')}>
                <Plus size={26} />
            </button>
        </div>
    )
}
