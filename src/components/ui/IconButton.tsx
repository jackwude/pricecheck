import * as React from 'react'
import { cx } from '../../utils/cx'

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label: string
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ className, label, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cx('ui-icon-button', className)}
                aria-label={label}
                title={label}
                {...props}
            />
        )
    }
)

IconButton.displayName = 'IconButton'

