import * as React from 'react'
import { cx } from '../../utils/cx'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    padded?: boolean
}

export function Card({ className, padded = true, ...props }: CardProps) {
    return <div className={cx('ui-card', padded ? 'ui-card-padded' : undefined, className)} {...props} />
}

