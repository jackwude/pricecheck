import { PriceRecord } from '../types'

const STORAGE_KEY = 'pricecheck_records'
const SETTINGS_KEY = 'pricecheck_settings'

// 获取所有记录
export function getAllRecords(): PriceRecord[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : []
    } catch (error) {
        console.error('读取记录失败:', error)
        return []
    }
}

// 获取单条记录
export function getRecordById(id: string): PriceRecord | null {
    const records = getAllRecords()
    return records.find(record => record.id === id) || null
}

// 新增记录
export function addRecord(record: PriceRecord): void {
    try {
        const records = getAllRecords()
        records.unshift(record) // 添加到开头
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    } catch (error) {
        console.error('保存记录失败:', error)
        throw error
    }
}

// 更新记录
export function updateRecord(id: string, updatedRecord: PriceRecord): void {
    try {
        const records = getAllRecords()
        const index = records.findIndex(record => record.id === id)
        if (index !== -1) {
            records[index] = updatedRecord
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
        }
    } catch (error) {
        console.error('更新记录失败:', error)
        throw error
    }
}

// 删除记录
export function deleteRecord(id: string): void {
    try {
        const records = getAllRecords()
        const filteredRecords = records.filter(record => record.id !== id)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecords))
    } catch (error) {
        console.error('删除记录失败:', error)
        throw error
    }
}

// 获取同商品的历史记录
export function getRecordsByProduct(productName: string, brand: string): PriceRecord[] {
    const records = getAllRecords()
    const filtered = records.filter(
        record =>
            record.productName.toLowerCase() === productName.toLowerCase() &&
            record.brand.toLowerCase() === brand.toLowerCase()
    )

    if (filtered.length === 0) return []

    const lowestPrice = Math.min(...filtered.map(r => r.unitPrice))
    const getSortTime = (record: PriceRecord) => {
        const createdAtTime = new Date(record.createdAt).getTime()
        if (!Number.isNaN(createdAtTime)) return createdAtTime
        const purchaseAtTime = new Date(record.purchaseDate).getTime()
        return Number.isNaN(purchaseAtTime) ? 0 : purchaseAtTime
    }

    return filtered.sort((a, b) => {
        const aIsLowest = a.unitPrice === lowestPrice
        const bIsLowest = b.unitPrice === lowestPrice

        if (aIsLowest && !bIsLowest) return -1
        if (!aIsLowest && bIsLowest) return 1

        return getSortTime(b) - getSortTime(a)
    })
}

// 按分类获取记录
export function getRecordsByCategory(category: string): PriceRecord[] {
    const records = getAllRecords()
    return records.filter(
        record => record.category.toLowerCase() === category.toLowerCase()
    )
}

// 获取所有分类
export function getAllCategories(): string[] {
    const records = getAllRecords()
    const categories = new Set(records.map(record => record.category))
    return Array.from(categories).sort()
}

// 搜索记录
export function searchRecords(keyword: string): PriceRecord[] {
    const records = getAllRecords()
    const lowerKeyword = keyword.toLowerCase()
    return records.filter(record =>
        record.productName.toLowerCase().includes(lowerKeyword) ||
        record.brand.toLowerCase().includes(lowerKeyword) ||
        record.category.toLowerCase().includes(lowerKeyword) ||
        record.channel.toLowerCase().includes(lowerKeyword)
    )
}

// 导出数据
export function exportData(): string {
    const records = getAllRecords()
    return JSON.stringify(records, null, 2)
}

// 导入数据
export function importData(jsonData: string): void {
    try {
        const records = JSON.parse(jsonData) as PriceRecord[]
        // 验证数据格式
        if (!Array.isArray(records)) {
            throw new Error('数据格式错误')
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    } catch (error) {
        console.error('导入数据失败:', error)
        throw error
    }
}

// 获取设置
export function getSettings() {
    try {
        const data = localStorage.getItem(SETTINGS_KEY)
        return data ? JSON.parse(data) : { theme: 'light' }
    } catch (error) {
        console.error('读取设置失败:', error)
        return { theme: 'light' }
    }
}

// 保存设置
export function saveSettings(settings: any): void {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch (error) {
        console.error('保存设置失败:', error)
        throw error
    }
}
