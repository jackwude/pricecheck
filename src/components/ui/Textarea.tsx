import * as React from 'react'
import { cx } from '../../utils/cx'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => {
        return <textarea ref={ref} className={cx('ui-textarea', className)} {...props} />
    }
)

Textarea.displayName = 'Textarea'

