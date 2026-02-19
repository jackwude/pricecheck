import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllRecords } from '../services/storage'
import { PriceRecord } from '../types'
import { IconButton } from '../components/ui/IconButton'
import { Input } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { Calculator, Folder, Settings, Plus, PackageSearch, X } from 'lucide-react'

export default function HomePage() {
    const [records, setRecords] = useState<PriceRecord[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        loadRecords()
        const onChanged = () => loadRecords()
        window.addEventListener('pricecheck:records-changed', onChanged)
        return () => window.removeEventListener('pricecheck:records-changed', onChanged)
    }, [])

    const loadRecords = async () => {
        const allRecords = await getAllRecords()
        setRecords(allRecords)
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
        
        return uniqueNames.filter(uniqueName => {
            const group = groupedRecords.get(uniqueName)
            if (!group) return false
            const record = group.record
            return (
                uniqueName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                record.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                record.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                record.category.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })
    }, [groupedRecords, searchQuery])

    const handleRecordClick = (uniqueName: string) => {
        navigate(`/product/${encodeURIComponent(uniqueName)}`)
    }

    return (
        <div className="page">
            <header className="page-header">
                <h1>价格追踪</h1>
                <div className="header-actions">
                    <IconButton label="快速计算器" onClick={() => navigate('/calculator')}>
                        <Calculator size={20} />
                    </IconButton>
                    <IconButton label="分类浏览" onClick={() => navigate('/categories')}>
                        <Folder size={20} />
                    </IconButton>
                    <IconButton label="设置" onClick={() => navigate('/settings')}>
                        <Settings size={20} />
                    </IconButton>
                </div>
            </header>

            <div className="search-bar">
                <div className="home-search-row">
                    <Input
                        type="text"
                        placeholder="搜索商品、品牌或分类..."
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
            </div>

            <div className="home-add-section">
                <Button variant="primary" onClick={() => navigate('/add')}>
                    <Plus size={18} />
                    新增记录
                </Button>
            </div>

            <div className="records-grid">
                {filteredUniqueNames.length === 0 ? (
                    <div className="records-grid-empty">
                        <EmptyState
                            icon={<PackageSearch size={44} />}
                            title={searchQuery ? '没有找到匹配记录' : '还没有记录'}
                            description={searchQuery ? '试试换个关键词，或者清除搜索条件。' : '点击上方按钮添加第一条记录。'}
                            action={
                                searchQuery ? (
                                    <Button variant="secondary" size="sm" onClick={() => setSearchQuery('')}>
                                        清除搜索
                                    </Button>
                                ) : undefined
                            }
                        />
                    </div>
                ) : (
                    filteredUniqueNames.map(uniqueName => {
                        const group = groupedRecords.get(uniqueName)
                        if (!group) return null
                        const { record, count } = group
                        return (
                            <div
                                key={uniqueName}
                                className="record-mini-card"
                                onClick={() => handleRecordClick(uniqueName)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        handleRecordClick(uniqueName)
                                    }
                                }}
                            >
                                <div className="mini-card-header">
                                    <span className="mini-card-name">{record.uniqueName}</span>
                                    {count > 1 && <span className="mini-card-count">{count}</span>}
                                </div>
                                <div className="mini-card-price">
                                    ¥{(record.unitPrice).toFixed(2)}
                                    <span className="mini-card-unit">/{record.unitType}</span>
                                </div>
                                <div className="mini-card-brand">{record.brand}</div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
