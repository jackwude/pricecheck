import { Button } from './ui/Button'

interface ConfirmDialogProps {
    show: boolean
    title: string
    message: string
    onConfirm: () => void
    onCancel: () => void
    confirmText?: string
    confirmVariant?: 'primary' | 'secondary' | 'danger'
}

export default function ConfirmDialog({
    show,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = '确定删除',
    confirmVariant = 'danger',
}: ConfirmDialogProps) {
    if (!show) return null

    return (
        <div className="dialog-overlay" onClick={onCancel}>
            <div className="dialog-container" onClick={(e) => e.stopPropagation()}>
                <div className="dialog-header">
                    <h3>{title}</h3>
                </div>
                <div className="dialog-body">
                    <p>{message}</p>
                </div>
                <div className="dialog-footer">
                    <Button variant="secondary" onClick={onCancel}>
                        取消
                    </Button>
                    <Button variant={confirmVariant} onClick={onConfirm}>
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    )
}
