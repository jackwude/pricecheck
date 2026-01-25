import * as React from 'react'
import { cx } from '../../utils/cx'

export interface EmptyStateProps {
    icon?: React.ReactNode
    title?: string
    description?: string
    action?: React.ReactNode
    className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cx('ui-empty', className)}>
            {icon ? <div className="ui-empty-icon">{icon}</div> : null}
            {title ? <div className="ui-empty-title">{title}</div> : null}
            {description ? <div className="ui-empty-desc">{description}</div> : null}
            {action ? <div className="ui-empty-action">{action}</div> : null}
        </div>
    )
}

