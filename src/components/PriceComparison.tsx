import { PriceComparison } from '../types'
import { formatPrice, formatPercentage } from '../utils/calculator'
import { Sparkles, Trophy, ThumbsUp, TrendingUp } from 'lucide-react'

interface PriceComparisonProps {
    comparison: PriceComparison
    currentPrice: number
}

export default function PriceComparisonDisplay({ comparison, currentPrice }: PriceComparisonProps) {
    const { isLowestPrice, lowestPrice, percentageDifference } = comparison

    // 首次记录
    if (lowestPrice === null) {
        return (
            <div className="price-comparison first-record">
                <div className="comparison-icon" aria-hidden="true">
                    <Sparkles size={32} />
                </div>
                <div className="comparison-text">
                    <p className="comparison-title">首次记录</p>
                    <p className="comparison-desc">这是第一次记录此商品</p>
                </div>
            </div>
        )
    }

    // 新低价
    if (isLowestPrice && currentPrice < lowestPrice) {
        return (
            <div className="price-comparison new-low">
                <div className="comparison-icon" aria-hidden="true">
                    <Trophy size={32} />
                </div>
                <div className="comparison-text">
                    <p className="comparison-title">新低价！</p>
                    <p className="comparison-desc">
                        比历史最低价便宜 ¥{formatPrice(Math.abs(comparison.priceDifference))}
                    </p>
                </div>
            </div>
        )
    }

    // 持平
    if (isLowestPrice && currentPrice === lowestPrice) {
        return (
            <div className="price-comparison same-low">
                <div className="comparison-icon" aria-hidden="true">
                    <ThumbsUp size={32} />
                </div>
                <div className="comparison-text">
                    <p className="comparison-title">历史最低价</p>
                    <p className="comparison-desc">与历史最低价持平</p>
                </div>
            </div>
        )
    }

    // 比最低价贵
    return (
        <div className="price-comparison higher">
            <div className="comparison-icon" aria-hidden="true">
                <TrendingUp size={32} />
            </div>
            <div className="comparison-text">
                <p className="comparison-title">比历史最低价贵 {formatPercentage(percentageDifference)}</p>
                <p className="comparison-desc">
                    历史最低: ¥{formatPrice(lowestPrice)}/{' '}
                    当前: ¥{formatPrice(currentPrice)}
                </p>
            </div>
        </div>
    )
}
