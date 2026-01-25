import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllCategories, getRecordsByCategory } from '../services/storage'
import { PriceRecord } from '../types'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { FolderOpen } from 'lucide-react'

export default function CategoryPage() {
    const navigate = useNavigate()
    const [categories, setCategories] = useState<string[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [records, setRecords] = useState<PriceRecord[]>([])

    useEffect(() => {
        const cats = getAllCategories()
        setCategories(cats)
    }, [])

    const handleCategoryClick = (category: string) => {
        setSelectedCategory(category)
        const categoryRecords = getRecordsByCategory(category)
        setRecords(categoryRecords)
    }

    const handleProductClick = (record: PriceRecord) => {
        navigate(`/product/${encodeURIComponent(record.productName)}/${encodeURIComponent(record.brand)}`)
    }

    return (
        <div className="page">
            <header className="page-header">
                <button className="back-button" onClick={() => navigate('/')}>
                    ← 返回
                </button>
                <h1>分类浏览</h1>
            </header>

            {!selectedCategory ? (
                <div className="categories-grid">
                    {categories.length === 0 ? (
                            <EmptyState
                                icon={<FolderOpen size={44} />}
                                title="还没有分类"
                                description="添加记录后，这里会按分类聚合展示。"
                                action={
                                    <Button variant="secondary" size="sm" onClick={() => navigate('/add')}>
                                        新增记录
                                    </Button>
                                }
                            />
                    ) : (
                        categories.map(category => {
                            const count = getRecordsByCategory(category).length
                            return (
                                <div
                                    key={category}
                                    className="category-card"
                                    onClick={() => handleCategoryClick(category)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                handleCategoryClick(category)
                                            }
                                        }}
                                >
                                    <div className="category-name">{category}</div>
                                    <div className="category-count">{count} 条记录</div>
                                </div>
                            )
                        })
                    )}
                </div>
            ) : (
                <div>
                    <div className="category-header">
                            <Button variant="secondary" size="sm" onClick={() => setSelectedCategory(null)}>
                                ← 返回分类列表
                            </Button>
                        <h2>{selectedCategory}</h2>
                        <p className="category-subtitle">{records.length} 条记录</p>
                    </div>

                    <div className="products-list">
                        {records.map(record => (
                            <div
                                key={record.id}
                                className="product-item"
                                onClick={() => handleProductClick(record)}
                            >
                                <div className="product-info">
                                    <h3>{record.productName}</h3>
                                    <p className="product-brand">{record.brand}</p>
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
