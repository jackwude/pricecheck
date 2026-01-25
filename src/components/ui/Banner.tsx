import * as React from 'react'
import { cx } from '../../utils/cx'

type BannerVariant = 'info' | 'success' | 'warning' | 'danger'

export interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: BannerVariant
}

export function Banner({ className, variant = 'info', ...props }: BannerProps) {
    return <div className={cx('ui-banner', `ui-banner-${variant}`, className)} role="status" {...props} />
}

