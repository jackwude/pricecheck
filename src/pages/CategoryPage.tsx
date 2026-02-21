import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllUniqueNames, getRecordsByUniqueName } from '../services/storage'
import { PriceRecord } from '../types'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/ToastProvider'
import { FolderOpen } from 'lucide-react'

export default function CategoryPage() {
    const navigate = useNavigate()
    const [uniqueNames, setUniqueNames] = useState<string[]>([])
    const [selectedUniqueName, setSelectedUniqueName] = useState<string | null>(null)
    const [records, setRecords] = useState<PriceRecord[]>([])
    const [uniqueNameCounts, setUniqueNameCounts] = useState<Map<string, number>>(new Map())
    const { push } = useToast()

    useEffect(() => {
        const load = async () => {
            try {
                const names = await getAllUniqueNames()
                setUniqueNames(names)

                const counts = new Map<string, number>()
                for (const name of names) {
                    const nameRecords = await getRecordsByUniqueName(name)
                    counts.set(name, nameRecords.length)
                }
                setUniqueNameCounts(counts)

                if (selectedUniqueName) {
                    const nameRecords = await getRecordsByUniqueName(selectedUniqueName)
                    setRecords(nameRecords)
                }
            } catch (error) {
                console.error('加载分类数据失败:', error)
                push({ title: '加载失败', description: '请稍后重试。', variant: 'danger' })
            }
        }
        const onChanged = () => {
            void load()
        }

        void load()
        window.addEventListener('pricecheck:records-changed', onChanged)
        return () => window.removeEventListener('pricecheck:records-changed', onChanged)
    }, [push, selectedUniqueName])

    const handleUniqueNameClick = async (uniqueName: string) => {
        setSelectedUniqueName(uniqueName)
        try {
            const nameRecords = await getRecordsByUniqueName(uniqueName)
            setRecords(nameRecords)
        } catch (error) {
            console.error('加载商品记录失败:', error)
            push({ title: '加载失败', description: '请稍后重试。', variant: 'danger' })
        }
    }

    const handleRecordClick = (record: PriceRecord) => {
        navigate(`/product/${encodeURIComponent(record.uniqueName)}`)
    }

    return (
        <div className="page">
            <header className="page-header">
                <button className="back-button" onClick={() => navigate('/')}>
                    ← 返回
                </button>
                <h1>分类浏览</h1>
            </header>

            {!selectedUniqueName ? (
                <div className="categories-grid">
                    {uniqueNames.length === 0 ? (
                            <EmptyState
                                icon={<FolderOpen size={44} />}
                                title="还没有商品分类"
                                description="添加记录后，这里会按商品唯一名称聚合展示。"
                                action={
                                    <Button variant="secondary" size="sm" onClick={() => navigate('/add')}>
                                        新增记录
                                    </Button>
                                }
                            />
                    ) : (
                        uniqueNames.map(uniqueName => {
                            const count = uniqueNameCounts.get(uniqueName) || 0
                            return (
                                <div
                                    key={uniqueName}
                                    className="category-card"
                                    onClick={() => handleUniqueNameClick(uniqueName)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                handleUniqueNameClick(uniqueName)
                                            }
                                        }}
                                >
                                    <div className="category-name">{uniqueName}</div>
                                    <div className="category-count">{count} 条记录</div>
                                </div>
                            )
                        })
                    )}
                </div>
            ) : (
                <div>
                    <div className="category-header">
                            <Button variant="secondary" size="sm" onClick={() => setSelectedUniqueName(null)}>
                                ← 返回分类列表
                            </Button>
                        <h2>{selectedUniqueName}</h2>
                        <p className="category-subtitle">{records.length} 条记录</p>
                    </div>

                    <div className="products-list">
                        {records.map(record => (
                            <div
                                key={record.id}
                                className="product-item"
                                onClick={() => handleRecordClick(record)}
                            >
                                <div className="product-info">
                                    <h3>{record.uniqueName}</h3>
                                </div>
                                <div className="product-price">
                                    ¥{record.unitPrice.toFixed(2)}/{record.unitType}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
