import { PriceRecord } from '../types'
import { formatPrice, formatDate } from '../utils/calculator'

interface RecordCardProps {
    record: PriceRecord
    isLowestPrice?: boolean
    recordCount?: number
    onClick?: () => void
}

export default function RecordCard({ record, isLowestPrice = false, recordCount, onClick }: RecordCardProps) {
    const isInteractive = Boolean(onClick)

    const handleClick = () => {
        if (onClick) onClick()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!isInteractive) return
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick?.()
        }
    }

    return (
        <div
            className="record-card"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            data-interactive={isInteractive ? 'true' : 'false'}
        >
            <div className="record-header">
                <div className="record-product">
                    <h3>{record.uniqueName}</h3>
                </div>
                {isLowestPrice && (
                    <span className="lowest-badge">最低价</span>
                )}
            </div>

            <div className="record-details">
                <div className="record-info">
                    <span className="record-label">渠道:</span>
                    <span>{record.channel}</span>
                </div>
                <div className="record-info">
                    <span className="record-label">日期:</span>
                    <span>{formatDate(record.purchaseDate)}</span>
                </div>
                {recordCount !== undefined && recordCount > 1 && (
                    <div className="record-info">
                        <span className="record-label">记录数:</span>
                        <span>{recordCount} 条</span>
                    </div>
                )}
            </div>

            <div className="record-price-section">
                <div className="record-unit-price">
                    <span className="price-value">¥{formatPrice(record.unitPrice)}</span>
                    <span className="price-unit">/{record.unitType}</span>
                </div>
                <div className="record-total">
                    总价: ¥{formatPrice(record.totalPrice)} | {record.quantity} × {record.unitSpec}{record.unitType}
                </div>
            </div>
        </div>
    )
}
