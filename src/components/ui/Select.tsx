import * as React from 'react'
import { cx } from '../../utils/cx'

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className, ...props }, ref) => {
        return <select ref={ref} className={cx('ui-select', className)} {...props} />
    }
)

Select.displayName = 'Select'

