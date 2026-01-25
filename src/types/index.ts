// 商品购买记录
export interface PriceRecord {
    id: string                    // 唯一标识
    productName: string           // 商品名称
    brand: string                 // 品牌
    category: string              // 分类（自由输入）
    purchaseDate: string          // 购买日期 (ISO格式)
    channel: string               // 购买渠道
    totalPrice: number            // 总价
    quantity: number              // 数量
    unitSpec: number              // 单品规格（如 70 抽/包）
    unitType: string              // 单位类型（抽、克、ml、片等）
    unitPrice: number             // 单位价格（自动计算）
    notes?: string                // 备注
    createdAt: string             // 创建时间 (ISO格式)
    updatedAt: string             // 更新时间 (ISO格式)
    deletedAt?: string            // 删除时间 (ISO格式)
}

// 主题类型
export type Theme = 'light' | 'dark'

// 应用设置
export interface AppSettings {
    theme: Theme
}

// 价格对比结果
export interface PriceComparison {
    isLowestPrice: boolean        // 是否为历史最低价
    lowestPrice: number | null    // 历史最低价
    priceDifference: number       // 价格差异（绝对值）
    percentageDifference: number  // 价格差异百分比
}

// 单位类型选项
export const UNIT_TYPES = [
    '抽',
    '克',
    'ml',
    '片',
    '个',
    '张',
    '包',
    '盒',
    '瓶',
    '听',
    '袋',
    '支',
    '根',
    '颗',
    '粒',
] as const

export type UnitType = typeof UNIT_TYPES[number]
