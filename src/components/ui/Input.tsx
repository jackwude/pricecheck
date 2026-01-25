import * as React from 'react'
import { cx } from '../../utils/cx'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => {
        return <input ref={ref} className={cx('ui-input', className)} {...props} />
    }
)

Input.displayName = 'Input'

