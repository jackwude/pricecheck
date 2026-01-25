import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllRecords, getRecordsByProduct } from '../services/storage'
import { PriceRecord } from '../types'
import RecordCard from '../components/RecordCard'
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
    }, [])

    const loadRecords = () => {
        const allRecords = getAllRecords()
        setRecords(allRecords)
    }

    const filteredRecords = records.filter(record =>
        record.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // 判断是否为最低价
    const isLowestPrice = (record: PriceRecord): boolean => {
        const history = getRecordsByProduct(record.productName, record.brand)
        if (history.length === 0) return false
        const lowestPrice = Math.min(...history.map(r => r.unitPrice))
        return record.unitPrice === lowestPrice
    }

    const handleRecordClick = (record: PriceRecord) => {
        navigate(`/product/${encodeURIComponent(record.productName)}/${encodeURIComponent(record.brand)}`)
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

            <div className="records-container">
                {filteredRecords.length === 0 ? (
                    <EmptyState
                        icon={<PackageSearch size={44} />}
                        title={searchQuery ? '没有找到匹配记录' : '还没有记录'}
                        description={searchQuery ? '试试换个关键词，或者清除搜索条件。' : '先添加第一条记录，后续就能快速对比历史最低价。'}
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
                ) : (
                    filteredRecords.map(record => (
                        <RecordCard
                            key={record.id}
                            record={record}
                            isLowestPrice={isLowestPrice(record)}
                            onClick={() => handleRecordClick(record)}
                        />
                    ))
                )}
            </div>

            <button
                className="fab"
                onClick={() => navigate('/add')}
                title="新增记录"
            >
                <Plus size={28} />
            </button>
        </div>
    )
}
