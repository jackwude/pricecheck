import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addRecord, updateRecord, getRecordById, getRecordsByProduct } from '../services/storage'
import { PriceRecord, UNIT_TYPES } from '../types'
import { calculateUnitPrice, generateId, getTodayDateString, compareWithHistory } from '../utils/calculator'
import PriceComparisonDisplay from '../components/PriceComparison'
import { Card } from '../components/ui/Card'
import { FormField } from '../components/ui/FormField'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/ToastProvider'

export default function AddRecordPage() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const isEditMode = Boolean(id)
    const { push } = useToast()

    const [formData, setFormData] = useState({
        productName: '',
        brand: '',
        category: '',
        purchaseDate: getTodayDateString(),
        channel: '',
        totalPrice: '',
        quantity: '',
        unitSpec: '',
        unitType: '抽',
        notes: '',
    })

    const [unitPrice, setUnitPrice] = useState(0)
    const [showComparison, setShowComparison] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (isEditMode && id) {
            const record = getRecordById(id)
            if (record) {
                setFormData({
                    productName: record.productName,
                    brand: record.brand,
                    category: record.category,
                    purchaseDate: record.purchaseDate,
                    channel: record.channel,
                    totalPrice: String(record.totalPrice),
                    quantity: String(record.quantity),
                    unitSpec: String(record.unitSpec),
                    unitType: record.unitType,
                    notes: record.notes || '',
                })
            }
        }
    }, [id, isEditMode])

    useEffect(() => {
        const price = calculateUnitPrice(
            Number(formData.totalPrice) || 0,
            Number(formData.quantity) || 0,
            formData.unitSpec ? Number(formData.unitSpec) : 1
        )
        setUnitPrice(price)

        // 当有商品名和品牌时，显示价格对比
        if (formData.productName && formData.brand && price > 0) {
            setShowComparison(true)
        } else {
            setShowComparison(false)
        }
    }, [formData.totalPrice, formData.quantity, formData.unitSpec, formData.productName, formData.brand])

    const handleChange = (field: string, value: string) => {
        setErrors((prev) => {
            if (!prev[field]) return prev
            const next = { ...prev }
            delete next[field]
            return next
        })
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const nextErrors: Record<string, string> = {}
        if (!formData.productName) nextErrors.productName = '请输入商品名称'
        if (!formData.brand) nextErrors.brand = '请输入品牌'
        if (!formData.category) nextErrors.category = '请输入分类'
        if (!formData.channel) nextErrors.channel = '请输入购买渠道'
        if (!formData.totalPrice) nextErrors.totalPrice = '请输入总价'
        if (!formData.quantity) nextErrors.quantity = '请输入数量'
        if (formData.unitSpec) {
            const unitSpecValue = Number(formData.unitSpec)
            if (!Number.isFinite(unitSpecValue) || unitSpecValue <= 0) {
                nextErrors.unitSpec = '请输入有效的单品规格（不填则按 1 计算）'
            }
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors)
            push({ title: '请先完善必填项', description: '带 * 的字段需要填写后才能保存。', variant: 'warning' })
            return
        }

        const record: PriceRecord = {
            id: isEditMode && id ? id : generateId(),
            productName: formData.productName,
            brand: formData.brand,
            category: formData.category,
            purchaseDate: formData.purchaseDate,
            channel: formData.channel,
            totalPrice: Number(formData.totalPrice),
            quantity: Number(formData.quantity),
            unitSpec: formData.unitSpec ? Number(formData.unitSpec) : 1,
            unitType: formData.unitType,
            unitPrice: unitPrice,
            notes: formData.notes,
            createdAt: isEditMode && id ? getRecordById(id)?.createdAt || new Date().toISOString() : new Date().toISOString(),
        }

        if (isEditMode && id) {
            updateRecord(id, record)
        } else {
            addRecord(record)
        }

        navigate('/')
    }

    // 获取价格对比数据
    const getPriceComparison = () => {
        if (!formData.productName || !formData.brand) {
            return null
        }

        let history = getRecordsByProduct(formData.productName, formData.brand)

        // 编辑模式下，排除当前记录
        if (isEditMode && id) {
            history = history.filter(r => r.id !== id)
        }

        return compareWithHistory(unitPrice, history)
    }

    const comparison = getPriceComparison()

    return (
        <div className="page">
            <header className="page-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    ← 返回
                </button>
                <h1>{isEditMode ? '编辑记录' : '新增记录'}</h1>
            </header>

            <form className="record-form" onSubmit={handleSubmit}>
                <div className="form-section">
                    <Card className="form-card">
                        <div className="form-card-title">商品信息</div>
                        <FormField label="商品名称" required error={errors.productName}>
                            <Input
                                type="text"
                                value={formData.productName}
                                onChange={(e) => handleChange('productName', e.target.value)}
                                placeholder="例如：维达抽纸"
                            />
                        </FormField>

                        <FormField label="品牌" required error={errors.brand}>
                            <Input
                                type="text"
                                value={formData.brand}
                                onChange={(e) => handleChange('brand', e.target.value)}
                                placeholder="例如：维达"
                            />
                        </FormField>

                        <FormField label="分类" required error={errors.category}>
                            <Input
                                type="text"
                                value={formData.category}
                                onChange={(e) => handleChange('category', e.target.value)}
                                placeholder="例如：纸巾"
                            />
                        </FormField>
                    </Card>
                </div>

                <div className="form-section">
                    <Card className="form-card">
                        <div className="form-card-title">购买信息</div>
                        <FormField label="购买日期" required>
                            <Input
                                type="date"
                                value={formData.purchaseDate}
                                onChange={(e) => handleChange('purchaseDate', e.target.value)}
                            />
                        </FormField>

                        <FormField label="购买渠道" required error={errors.channel}>
                            <Input
                                type="text"
                                value={formData.channel}
                                onChange={(e) => handleChange('channel', e.target.value)}
                                placeholder="例如：京东、天猫、盒马"
                            />
                        </FormField>
                    </Card>
                </div>

                <div className="form-section">
                    <Card className="form-card">
                        <div className="form-card-title">价格信息</div>
                        <FormField label="总价 (¥)" required error={errors.totalPrice}>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.totalPrice}
                                onChange={(e) => handleChange('totalPrice', e.target.value)}
                                placeholder="例如：70"
                                inputMode="decimal"
                            />
                        </FormField>

                        <div className="form-row">
                            <FormField label="数量" required error={errors.quantity}>
                                <Input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => handleChange('quantity', e.target.value)}
                                    placeholder="例如：10"
                                    inputMode="numeric"
                                />
                            </FormField>

                            <FormField label="单品规格（可选，默认 1）" error={errors.unitSpec}>
                                <Input
                                    type="number"
                                    value={formData.unitSpec}
                                    onChange={(e) => handleChange('unitSpec', e.target.value)}
                                    placeholder="例如：70（不填则按 1 计算）"
                                    inputMode="numeric"
                                />
                            </FormField>

                            <FormField label="单位" required>
                                <Select value={formData.unitType} onChange={(e) => handleChange('unitType', e.target.value)}>
                                    {UNIT_TYPES.map(unit => (
                                        <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                </Select>
                            </FormField>
                        </div>

                        {unitPrice > 0 ? (
                            <div className="unit-price-display">
                                <span className="unit-price-label">单位价格</span>
                                <span className="unit-price-value">¥{unitPrice.toFixed(4)} / {formData.unitType}</span>
                            </div>
                        ) : null}
                    </Card>
                </div>

                {showComparison && comparison && (
                    <div className="form-section">
                        <Card className="form-card">
                            <div className="form-card-title">价格对比</div>
                            <PriceComparisonDisplay comparison={comparison} currentPrice={unitPrice} />
                        </Card>
                    </div>
                )}

                <div className="form-section">
                    <Card className="form-card">
                        <div className="form-card-title">备注</div>
                        <FormField label="备注" hint="可选：添加备注信息">
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                placeholder="例如：活动价、叠券、到手价说明"
                                rows={3}
                            />
                        </FormField>
                    </Card>
                </div>

                <div className="form-actions">
                    <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
                        取消
                    </Button>
                    <Button type="submit" variant="primary">
                        {isEditMode ? '保存' : '添加'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
