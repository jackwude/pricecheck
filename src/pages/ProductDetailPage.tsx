import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getRecordsByProduct, deleteRecord, addRecord } from '../services/storage'
import { PriceRecord, UNIT_TYPES } from '../types'
import RecordCard from '../components/RecordCard'
import ConfirmDialog from '../components/ConfirmDialog'
import PriceComparisonDisplay from '../components/PriceComparison'
import { calculateUnitPrice, compareWithHistory, formatPrice, generateId, getTodayDateString } from '../utils/calculator'
import { Card } from '../components/ui/Card'
import { FormField } from '../components/ui/FormField'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Banner } from '../components/ui/Banner'
import { EmptyState } from '../components/ui/EmptyState'
import { useToast } from '../components/ui/ToastProvider'
import { PackageSearch } from 'lucide-react'

export default function ProductDetailPage() {
    const navigate = useNavigate()
    const { productName, brand } = useParams<{ productName: string; brand: string }>()
    const { push } = useToast()
    const [records, setRecords] = useState<PriceRecord[]>([])
    const [showConfirm, setShowConfirm] = useState(false)
    const [recordToDelete, setRecordToDelete] = useState<PriceRecord | null>(null)
    const [tryFormData, setTryFormData] = useState({
        totalPrice: '',
        quantity: '',
        unitSpec: '',
        unitType: '抽',
    })

    useEffect(() => {
        const load = async () => {
            if (!productName || !brand) return
            const history = await getRecordsByProduct(decodeURIComponent(productName), decodeURIComponent(brand))
            setRecords(history)
        }
        load()
        const onChanged = () => load()
        window.addEventListener('pricecheck:records-changed', onChanged)
        return () => window.removeEventListener('pricecheck:records-changed', onChanged)
    }, [productName, brand])

    useEffect(() => {
        const latest = records[0]
        if (!latest) return

        setTryFormData(prev => ({
            ...prev,
            quantity: prev.quantity || String(latest.quantity),
            unitSpec: prev.unitSpec || String(latest.unitSpec),
            unitType: prev.unitType === '抽' ? latest.unitType : prev.unitType,
        }))
    }, [records])

    const lowestPrice = records.length > 0
        ? Math.min(...records.map(r => r.unitPrice))
        : 0

    const currentTryUnitPrice = useMemo(() => {
        return calculateUnitPrice(
            Number(tryFormData.totalPrice) || 0,
            Number(tryFormData.quantity) || 0,
            tryFormData.unitSpec ? Number(tryFormData.unitSpec) : 1
        )
    }, [tryFormData.totalPrice, tryFormData.quantity, tryFormData.unitSpec])

    const tryComparison = useMemo(() => {
        if (currentTryUnitPrice <= 0) return null
        return compareWithHistory(currentTryUnitPrice, records)
    }, [currentTryUnitPrice, records])

    const hasUnitTypeMismatch = useMemo(() => {
        return records.some(r => r.unitType !== tryFormData.unitType)
    }, [records, tryFormData.unitType])

    const [tryErrors, setTryErrors] = useState<Record<string, string>>({})

    const handleTryChange = (field: string, value: string) => {
        setTryErrors((prev) => {
            if (!prev[field]) return prev
            const next = { ...prev }
            delete next[field]
            return next
        })
        setTryFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleAddTryToHistory = async () => {
        const decodedProductName = decodeURIComponent(productName || '')
        const decodedBrand = decodeURIComponent(brand || '')
        const totalPrice = Number(tryFormData.totalPrice)
        const quantity = Number(tryFormData.quantity)
        const unitSpec = tryFormData.unitSpec ? Number(tryFormData.unitSpec) : 1

        if (!decodedProductName || !decodedBrand) return

        const nextErrors: Record<string, string> = {}
        if (!Number.isFinite(totalPrice) || totalPrice <= 0) nextErrors.totalPrice = '请输入有效的总价'
        if (!Number.isFinite(quantity) || quantity <= 0) nextErrors.quantity = '请输入有效的数量'
        if (!Number.isFinite(unitSpec) || unitSpec <= 0) nextErrors.unitSpec = '单品规格需要为正数（不填写则按 1 计算）'
        if (Object.keys(nextErrors).length > 0) {
            setTryErrors(nextErrors)
            push({ title: '请先补全试算信息', description: '总价与数量需要填写有效数字；规格可选，不填默认按 1。', variant: 'warning' })
            return
        }

        const latest = records[0]
        const nowIso = new Date().toISOString()
        const record: PriceRecord = {
            id: generateId(),
            productName: decodedProductName,
            brand: decodedBrand,
            category: latest?.category || '未分类',
            purchaseDate: getTodayDateString(),
            channel: latest?.channel || '价格试算',
            totalPrice,
            quantity,
            unitSpec,
            unitType: tryFormData.unitType,
            unitPrice: currentTryUnitPrice,
            notes: '价格试算添加',
            createdAt: nowIso,
            updatedAt: nowIso,
        }

        await addRecord(record)
        const history = await getRecordsByProduct(decodedProductName, decodedBrand)
        setRecords(history)
        setTryFormData(prev => ({ ...prev, totalPrice: '' }))
        push({ title: '已添加到购买历史', description: '你可以在下方历史列表中继续编辑或删除。', variant: 'success' })
    }

    const handleEdit = (record: PriceRecord) => {
        navigate(`/edit/${record.id}`)
    }

    const handleDelete = (record: PriceRecord) => {
        setRecordToDelete(record)
        setShowConfirm(true)
    }

    const confirmDelete = async () => {
        if (recordToDelete) {
            await deleteRecord(recordToDelete.id)
            const updatedRecords = records.filter(r => r.id !== recordToDelete.id)
            setRecords(updatedRecords)

            if (updatedRecords.length === 0) {
                navigate('/')
            }
        }
        setShowConfirm(false)
        setRecordToDelete(null)
    }

    const cancelDelete = () => {
        setShowConfirm(false)
        setRecordToDelete(null)
    }

    if (records.length === 0) {
        return (
            <div className="page">
                <header className="page-header">
                    <button className="back-button" onClick={() => navigate('/')}>
                        ← 返回
                    </button>
                    <h1>商品详情</h1>
                </header>
                <EmptyState
                    icon={<PackageSearch size={44} />}
                    title="没有找到记录"
                    description="该商品可能已被删除，或链接参数不正确。"
                    action={
                        <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
                            返回首页
                        </Button>
                    }
                />
            </div>
        )
    }


    return (
        <div className="page">
            <header className="page-header">
                <button className="back-button" onClick={() => navigate('/')}>
                    ← 返回
                </button>
                <h1>商品详情</h1>
            </header>

            <div className="product-summary">
                <h2>{decodeURIComponent(productName || '')}</h2>
                <p className="product-brand">{decodeURIComponent(brand || '')}</p>
                <div className="product-stats product-stats-highlight">
                    <div className="stat-item stat-item-highlight">
                        <span className="stat-label">历史最低价</span>
                        <span className="stat-value">¥{formatPrice(lowestPrice)}</span>
                    </div>
                </div>
            </div>

            <div className="section-title">
                <h3>价格试算</h3>
            </div>

            <div className="calculator-container">
                <Card className="form-card">
                    <FormField label="总价 (¥)" error={tryErrors.totalPrice}>
                        <Input
                            type="number"
                            step="0.01"
                            value={tryFormData.totalPrice}
                            onChange={(e) => handleTryChange('totalPrice', e.target.value)}
                            placeholder="例如：70"
                            inputMode="decimal"
                        />
                    </FormField>

                    <div className="form-row">
                        <FormField label="数量" error={tryErrors.quantity}>
                            <Input
                                type="number"
                                value={tryFormData.quantity}
                                onChange={(e) => handleTryChange('quantity', e.target.value)}
                                placeholder="例如：10"
                                inputMode="numeric"
                            />
                        </FormField>

                        <FormField label="单品规格（可选，默认 1）" error={tryErrors.unitSpec}>
                            <Input
                                type="number"
                                value={tryFormData.unitSpec}
                                onChange={(e) => handleTryChange('unitSpec', e.target.value)}
                                placeholder="例如：70（不填则按 1 计算）"
                                inputMode="numeric"
                            />
                        </FormField>

                        <FormField label="单位">
                            <Select value={tryFormData.unitType} onChange={(e) => handleTryChange('unitType', e.target.value)}>
                                {UNIT_TYPES.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                ))}
                            </Select>
                        </FormField>
                    </div>

                    {currentTryUnitPrice > 0 && (
                        <div className="unit-price-display">
                            <span className="unit-price-label">当前单位价格</span>
                            <span className="unit-price-value">¥{currentTryUnitPrice.toFixed(4)} / {tryFormData.unitType}</span>
                        </div>
                    )}

                    {currentTryUnitPrice > 0 && hasUnitTypeMismatch && (
                        <Banner variant="info">提示：该商品历史记录的单位不完全一致，比较结果可能不准确。</Banner>
                    )}

                    {tryComparison && (
                        <PriceComparisonDisplay comparison={tryComparison} currentPrice={currentTryUnitPrice} />
                    )}

                    <Button
                        type="button"
                        variant="primary"
                        fullWidth
                        onClick={handleAddTryToHistory}
                        disabled={currentTryUnitPrice <= 0}
                    >
                        添加到购买历史
                    </Button>
                </Card>
            </div>

            <div className="section-title">
                <h3>购买历史</h3>
            </div>

            <div className="records-container">
                {records.map(record => (
                    <div key={record.id} className="record-with-actions">
                        <RecordCard
                            record={record}
                            isLowestPrice={record.unitPrice === lowestPrice}
                        />
                        <div className="record-actions">
                            <Button size="sm" variant="secondary" onClick={() => handleEdit(record)}>
                                编辑
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(record)}>
                                删除
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmDialog
                show={showConfirm}
                title="确认删除"
                message="确定要删除这条记录吗？此操作无法撤销。"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    )
}
