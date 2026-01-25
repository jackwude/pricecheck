import * as React from 'react'
import { cx } from '../../utils/cx'

export interface FormFieldProps {
    label: string
    required?: boolean
    hint?: string
    error?: string
    children: React.ReactNode
    className?: string
}

export function FormField({ label, required, hint, error, children, className }: FormFieldProps) {
    return (
        <div className={cx('ui-field', className)}>
            <div className="ui-field-label-row">
                <span className="ui-field-label">{label}</span>
                {required ? <span className="ui-field-required">*</span> : null}
            </div>
            <div className={cx('ui-field-control', error ? 'ui-field-control-error' : undefined)}>{children}</div>
            {error ? <div className="ui-field-error">{error}</div> : null}
            {!error && hint ? <div className="ui-field-hint">{hint}</div> : null}
        </div>
    )
}

