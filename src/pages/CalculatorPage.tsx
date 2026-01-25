import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UNIT_TYPES } from '../types'
import { calculateUnitPrice, formatPrice } from '../utils/calculator'
import { Card } from '../components/ui/Card'
import { FormField } from '../components/ui/FormField'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'

export default function CalculatorPage() {
    const navigate = useNavigate()
    const [totalPrice, setTotalPrice] = useState('')
    const [quantity, setQuantity] = useState('')
    const [unitSpec, setUnitSpec] = useState('')
    const [unitType, setUnitType] = useState('抽')

    const unitPrice = calculateUnitPrice(
        Number(totalPrice) || 0,
        Number(quantity) || 0,
        unitSpec ? Number(unitSpec) : 1
    )

    const handleReset = () => {
        setTotalPrice('')
        setQuantity('')
        setUnitSpec('')
        setUnitType('抽')
    }

    return (
        <div className="page">
            <header className="page-header">
                <button className="back-button" onClick={() => navigate('/')}>
                    ← 返回
                </button>
                <h1>快速计算器</h1>
            </header>

            <div className="calculator-container">
                <Card className="form-card">
                    <div className="form-card-title">快速计算</div>
                    <FormField label="总价 (¥)">
                        <Input
                            type="number"
                            step="0.01"
                            value={totalPrice}
                            onChange={(e) => setTotalPrice(e.target.value)}
                            placeholder="输入总价"
                            inputMode="decimal"
                        />
                    </FormField>

                    <FormField label="数量">
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="输入数量"
                            inputMode="numeric"
                        />
                    </FormField>

                    <FormField label="单品规格（可选，默认 1）">
                        <Input
                            type="number"
                            value={unitSpec}
                            onChange={(e) => setUnitSpec(e.target.value)}
                            placeholder="不填则按 1 计算"
                            inputMode="numeric"
                        />
                    </FormField>

                    <FormField label="单位">
                        <Select value={unitType} onChange={(e) => setUnitType(e.target.value)}>
                            {UNIT_TYPES.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </Select>
                    </FormField>

                    {unitPrice > 0 && (
                        <div className="calculator-result">
                            <div className="result-label">单位价格</div>
                            <div className="result-value">
                                ¥{formatPrice(unitPrice)} <span className="result-unit">/ {unitType}</span>
                            </div>
                        </div>
                    )}

                    <Button variant="secondary" fullWidth type="button" onClick={handleReset}>
                        重置
                    </Button>
                </Card>

                <div className="calculator-example">
                    <h3>示例</h3>
                    <p>购买 10 包纸巾，每包 70 抽，总价 70 元</p>
                    <p className="example-calc">70 ÷ 10 ÷ 70 = ¥0.10 / 抽</p>
                </div>
            </div>
        </div>
    )
}
