import * as React from 'react'
import { cx } from '../../utils/cx'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    padded?: boolean
    interactive?: boolean
    density?: 'comfortable' | 'compact'
}

export function Card({ className, padded = true, interactive = false, density = 'comfortable', ...props }: CardProps) {
    return (
        <div
            className={cx(
                'ui-card',
                padded ? 'ui-card-padded' : undefined,
                interactive ? 'ui-card-interactive' : undefined,
                density === 'compact' ? 'ui-card-compact' : undefined,
                className
            )}
            {...props}
        />
    )
}
