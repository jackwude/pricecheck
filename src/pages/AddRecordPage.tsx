import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { addRecord, updateRecord, getRecordById, getRecordsByUniqueName } from '../services/storage'
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

const CHANNEL_PRESETS = ['拼多多', '京东', '淘宝', '唯品会'] as const

const REQUIRED_FIELDS: Array<keyof FormDataState> = [
    'uniqueName',
    'channel',
    'totalPrice',
    'quantity',
]

type FormDataState = {
    uniqueName: string
    purchaseDate: string
    channel: string
    totalPrice: string
    quantity: string
    unitSpec: string
    unitType: string
    notes: string
}

export default function AddRecordPage() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const isEditMode = Boolean(id)
    const { push } = useToast()

    const [formData, setFormData] = useState<FormDataState>({
        uniqueName: '',
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
    const [comparison, setComparison] = useState<ReturnType<typeof compareWithHistory> | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isEditMode && id) {
            getRecordById(id).then((record) => {
                if (record) {
                    setFormData({
                        uniqueName: record.uniqueName,
                        purchaseDate: record.purchaseDate,
                        channel: record.channel,
                        totalPrice: String(record.totalPrice),
                        quantity: String(record.quantity),
                        unitSpec: String(record.unitSpec),
                        unitType: record.unitType,
                        notes: record.notes || '',
                    })
                }
            })
        }
    }, [id, isEditMode])

    useEffect(() => {
        const price = calculateUnitPrice(
            Number(formData.totalPrice) || 0,
            Number(formData.quantity) || 0,
            formData.unitSpec ? Number(formData.unitSpec) : 1
        )
        setUnitPrice(price)

        if (formData.uniqueName && price > 0) {
            setShowComparison(true)
            getRecordsByUniqueName(formData.uniqueName).then((history) => {
                const filteredHistory = isEditMode && id ? history.filter((r) => r.id !== id) : history
                setComparison(compareWithHistory(price, filteredHistory))
            })
        } else {
            setShowComparison(false)
            setComparison(null)
        }
    }, [formData.totalPrice, formData.quantity, formData.unitSpec, formData.uniqueName, id, isEditMode])

    const completion = useMemo(() => {
        const filled = REQUIRED_FIELDS.filter((field) => formData[field].trim() !== '').length
        const percent = Math.round((filled / REQUIRED_FIELDS.length) * 100)
        return { filled, total: REQUIRED_FIELDS.length, percent }
    }, [formData])

    const validateField = (field: keyof FormDataState, value: string): string | null => {
        if (REQUIRED_FIELDS.includes(field) && value.trim() === '') {
            switch (field) {
                case 'uniqueName':
                    return '请输入商品唯一名称'
                case 'channel':
                    return '请输入购买渠道'
                case 'totalPrice':
                    return '请输入总价'
                case 'quantity':
                    return '请输入数量'
                default:
                    return '请完善必填项'
            }
        }

        if (field === 'unitSpec' && value) {
            const unitSpecValue = Number(value)
            if (!Number.isFinite(unitSpecValue) || unitSpecValue <= 0) {
                return '请输入有效的单品规格（不填则按 1 计算）'
            }
        }

        return null
    }

    const handleChange = (field: keyof FormDataState, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        setErrors((prev) => {
            if (!prev[field]) return prev
            const next = { ...prev }
            delete next[field]
            return next
        })
    }

    const handleBlur = (field: keyof FormDataState) => {
        const error = validateField(field, formData[field])
        if (!error) return
        setErrors((prev) => ({ ...prev, [field]: error }))
    }

    const runFullValidation = () => {
        const nextErrors: Record<string, string> = {}
        for (const field of [...REQUIRED_FIELDS, 'unitSpec'] as Array<keyof FormDataState>) {
            const error = validateField(field, formData[field])
            if (error) nextErrors[field] = error
        }
        return nextErrors
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const nextErrors = runFullValidation()

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors)
            push({ title: '请先完善表单', description: '请优先修复标红字段。', variant: 'warning' })
            return
        }

        const nowIso = new Date().toISOString()
        const existing = isEditMode && id ? await getRecordById(id) : null
        const record: PriceRecord = {
            id: isEditMode && id ? id : generateId(),
            uniqueName: formData.uniqueName,
            productName: existing?.productName || formData.uniqueName,
            brand: existing?.brand || '',
            category: existing?.category || '',
            purchaseDate: formData.purchaseDate,
            channel: formData.channel,
            totalPrice: Number(formData.totalPrice),
            quantity: Number(formData.quantity),
            unitSpec: formData.unitSpec ? Number(formData.unitSpec) : 1,
            unitType: formData.unitType,
            unitPrice,
            notes: formData.notes,
            createdAt: existing?.createdAt || nowIso,
            updatedAt: nowIso,
            deletedAt: existing?.deletedAt,
        }

        setIsSubmitting(true)
        try {
            if (isEditMode && id) {
                await updateRecord(id, record)
                push({ title: '更新成功', description: '记录已保存。', variant: 'success' })
            } else {
                await addRecord(record)
                push({ title: '添加成功', description: '记录已保存。', variant: 'success' })
            }
            navigate('/')
        } catch (error) {
            console.error('保存记录失败:', error)
            push({
                title: isEditMode ? '更新失败' : '添加失败',
                description: '保存记录时发生错误，请稍后重试。',
                variant: 'danger',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="page">
            <header className="page-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    ← 返回
                </button>
                <h1>{isEditMode ? '编辑记录' : '新增记录'}</h1>
            </header>

            <form className="record-form" onSubmit={handleSubmit}>
                <Card className="form-progress-card" density="compact">
                    <div className="form-progress-head">
                        <span>填写进度</span>
                        <strong>
                            {completion.filled}/{completion.total}
                        </strong>
                    </div>
                    <div className="form-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion.percent}>
                        <div className="form-progress-fill" style={{ width: `${completion.percent}%` }} />
                    </div>
                    <p className="form-progress-desc">先完善必填项，再保存记录。</p>
                </Card>

                {Object.keys(errors).length > 0 ? (
                    <Card className="form-error-summary" density="compact">
                        <strong>还有 {Object.keys(errors).length} 个字段需要修正</strong>
                        <p>请检查标红的输入项后再提交。</p>
                    </Card>
                ) : null}

                <div className="form-section">
                    <Card className="form-card" interactive>
                        <div className="form-card-title">步骤 1 · 商品信息</div>
                        <FormField label="商品唯一名称" required error={errors.uniqueName} hint="用于分类管理，相同名称的商品会被归为一类">
                            <Input
                                type="text"
                                value={formData.uniqueName}
                                onChange={(e) => handleChange('uniqueName', e.target.value)}
                                onBlur={() => handleBlur('uniqueName')}
                                placeholder="例如：维达抽纸超韧"
                            />
                        </FormField>
                    </Card>
                </div>

                <div className="form-section">
                    <Card className="form-card" interactive>
                        <div className="form-card-title">步骤 2 · 购买信息</div>
                        <FormField label="购买日期" required className="date-field">
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
                                onBlur={() => handleBlur('channel')}
                                placeholder="例如：京东、天猫、盒马"
                            />
                            <div className="channel-presets">
                                {CHANNEL_PRESETS.map((channel) => (
                                    <button
                                        key={channel}
                                        type="button"
                                        className={`channel-preset-chip ${formData.channel === channel ? 'is-active' : ''}`}
                                        onClick={() => handleChange('channel', channel)}
                                    >
                                        {channel}
                                    </button>
                                ))}
                            </div>
                        </FormField>
                    </Card>
                </div>

                <div className="form-section">
                    <Card className="form-card" interactive>
                        <div className="form-card-title">步骤 3 · 价格信息</div>
                        <FormField label="总价 (¥)" required error={errors.totalPrice}>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.totalPrice}
                                onChange={(e) => handleChange('totalPrice', e.target.value)}
                                onBlur={() => handleBlur('totalPrice')}
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
                                    onBlur={() => handleBlur('quantity')}
                                    placeholder="例如：10"
                                    inputMode="numeric"
                                />
                            </FormField>

                            <FormField label="单品规格（可选，默认 1）" error={errors.unitSpec}>
                                <Input
                                    type="number"
                                    value={formData.unitSpec}
                                    onChange={(e) => handleChange('unitSpec', e.target.value)}
                                    onBlur={() => handleBlur('unitSpec')}
                                    placeholder="例如：70（不填则按 1 计算）"
                                    inputMode="numeric"
                                />
                            </FormField>

                            <FormField label="单位" required>
                                <Select value={formData.unitType} onChange={(e) => handleChange('unitType', e.target.value)}>
                                    {UNIT_TYPES.map((unit) => (
                                        <option key={unit} value={unit}>
                                            {unit}
                                        </option>
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

                {showComparison && comparison ? (
                    <div className="form-section">
                        <Card className="form-card" interactive>
                            <div className="form-card-title">价格对比</div>
                            <PriceComparisonDisplay comparison={comparison} currentPrice={unitPrice} />
                        </Card>
                    </div>
                ) : null}

                <div className="form-section">
                    <Card className="form-card" interactive>
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

                <div className="form-actions form-actions-sticky">
                    <Button type="button" variant="secondary" tone="neutral" onClick={() => navigate(-1)}>
                        取消
                    </Button>
                    <Button type="submit" variant="primary" tone="brand" loading={isSubmitting}>
                        {isEditMode ? '保存' : '添加'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
