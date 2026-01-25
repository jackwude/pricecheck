import { PriceRecord, PriceComparison } from '../types'

// 计算单位价格
export function calculateUnitPrice(
    totalPrice: number,
    quantity: number,
    unitSpec: number
): number {
    if (totalPrice <= 0 || quantity <= 0) {
        return 0
    }
    const normalizedUnitSpec = Number.isFinite(unitSpec) && unitSpec > 0 ? unitSpec : 1
    return totalPrice / quantity / normalizedUnitSpec
}

// 对比历史价格
export function compareWithHistory(
    currentPrice: number,
    records: PriceRecord[]
): PriceComparison {
    // 如果没有历史记录
    if (records.length === 0) {
        return {
            isLowestPrice: true,
            lowestPrice: null,
            priceDifference: 0,
            percentageDifference: 0,
        }
    }

    // 找出历史最低价
    const lowestPrice = Math.min(...records.map(r => r.unitPrice))

    // 计算价格差异
    const priceDifference = currentPrice - lowestPrice
    const percentageDifference = lowestPrice > 0
        ? (priceDifference / lowestPrice) * 100
        : 0

    return {
        isLowestPrice: currentPrice <= lowestPrice,
        lowestPrice,
        priceDifference,
        percentageDifference,
    }
}

// 格式化价格（保留2位小数）
export function formatPrice(price: number): string {
    return price.toFixed(2)
}

// 格式化百分比
export function formatPercentage(percentage: number): string {
    const sign = percentage > 0 ? '+' : ''
    return `${sign}${percentage.toFixed(1)}%`
}

// 生成唯一ID
export function generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 格式化日期
export function formatDate(dateString: string): string {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

// 获取今天的日期字符串
export function getTodayDateString(): string {
    return new Date().toISOString().split('T')[0]
}
