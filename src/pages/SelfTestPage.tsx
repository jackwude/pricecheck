import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    addRecord,
    deleteRecord,
    exportData,
    getAllRecords,
    getRecordById,
    getRecordsByProduct,
    importData,
    searchRecords,
    updateRecord,
} from '../services/storage'
import { PriceRecord } from '../types'
import { calculateUnitPrice, getTodayDateString } from '../utils/calculator'

type SelfTestStatus = 'idle' | 'running' | 'pass' | 'fail'

export default function SelfTestPage() {
    const navigate = useNavigate()
    const [status, setStatus] = useState<SelfTestStatus>('idle')
    const [message, setMessage] = useState('')

    const runSelfTest = () => {
        const testProductName = 'SelfTest 商品'
        const testBrand = 'SelfTest 品牌'
        const testCategory = 'SelfTest 分类'
        const testChannel = 'SelfTest 渠道'
        const testPurchaseDate = getTodayDateString()

        const now = Date.now()
        const recordA: PriceRecord = {
            id: 'selftest_a',
            productName: testProductName,
            brand: testBrand,
            category: testCategory,
            purchaseDate: testPurchaseDate,
            channel: testChannel,
            totalPrice: 70,
            quantity: 10,
            unitSpec: 70,
            unitType: '抽',
            unitPrice: calculateUnitPrice(70, 10, 70),
            notes: 'SelfTest A',
            createdAt: new Date(now - 10_000).toISOString(),
        }

        const recordB: PriceRecord = {
            id: 'selftest_b',
            productName: testProductName,
            brand: testBrand,
            category: testCategory,
            purchaseDate: testPurchaseDate,
            channel: testChannel,
            totalPrice: 60,
            quantity: 10,
            unitSpec: 70,
            unitType: '抽',
            unitPrice: calculateUnitPrice(60, 10, 70),
            notes: 'SelfTest B',
            createdAt: new Date(now).toISOString(),
        }

        setStatus('running')
        setMessage('运行中…')

        const backup = exportData()

        try {
            importData('[]')

            addRecord(recordA)
            addRecord(recordB)

            const all1 = getAllRecords()
            if (all1.length !== 2) {
                throw new Error(`新增失败：期望 2 条记录，实际 ${all1.length} 条`)
            }

            const productHistory = getRecordsByProduct(testProductName, testBrand)
            if (productHistory.length !== 2) {
                throw new Error(`查询失败：期望 2 条记录，实际 ${productHistory.length} 条`)
            }
            if (productHistory[0].id !== 'selftest_b') {
                throw new Error(`排序失败：期望最低价记录置顶（selftest_b），实际为 ${productHistory[0].id}`)
            }

            const updatedA: PriceRecord = {
                ...recordA,
                totalPrice: 100,
                unitPrice: calculateUnitPrice(100, recordA.quantity, recordA.unitSpec),
                notes: 'SelfTest A Updated',
            }
            updateRecord(recordA.id, updatedA)
            const fetchedA = getRecordById(recordA.id)
            if (!fetchedA || fetchedA.totalPrice !== 100) {
                throw new Error('更新失败：未能读取到更新后的记录')
            }

            const searchResult = searchRecords('SelfTest')
            if (searchResult.length < 2) {
                throw new Error(`搜索失败：期望至少 2 条结果，实际 ${searchResult.length} 条`)
            }

            deleteRecord(recordB.id)
            const all2 = getAllRecords()
            if (all2.length !== 1) {
                throw new Error(`删除失败：期望剩余 1 条记录，实际 ${all2.length} 条`)
            }

            setStatus('pass')
            setMessage('自测通过：新增/查询/更新/删除/排序均正常')
            console.warn('SELFTEST:PASS')
        } catch (error) {
            setStatus('fail')
            setMessage(error instanceof Error ? error.message : '自测失败')
            console.error('SELFTEST:FAIL', error)
        } finally {
            importData(backup)
        }
    }

    useEffect(() => {
        runSelfTest()
    }, [])

    return (
        <div className="page">
            <header className="page-header">
                <button className="back-button" onClick={() => navigate('/')}>
                    ← 返回
                </button>
                <h1>自测</h1>
            </header>

            <div className="calculator-container">
                <div className="calculator-form">
                    <div className="calculator-description">
                        <p>用于快速验证本地存储的增删改查与排序规则，不会保留测试数据。</p>
                    </div>

                    <div className="form-field">
                        <label>状态</label>
                        <input value={status} readOnly />
                    </div>

                    <div className="form-field">
                        <label>结果</label>
                        <textarea value={message} readOnly rows={4} />
                    </div>

                    <button className="button-primary" type="button" onClick={runSelfTest}>
                        重新运行
                    </button>
                </div>
            </div>
        </div>
    )
}
