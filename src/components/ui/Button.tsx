import * as React from 'react'
import { cx } from '../../utils/cx'

type ButtonVariant = 'primary' | 'secondary' | 'danger'
type ButtonSize = 'md' | 'sm'
type ButtonTone = 'neutral' | 'brand' | 'danger'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    tone?: ButtonTone
    fullWidth?: boolean
    loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'secondary', size = 'md', tone, fullWidth, loading, disabled, children, ...props }, ref) => {
        const isDisabled = disabled || loading
        const resolvedTone =
            tone ??
            (variant === 'primary' ? 'brand' : variant === 'danger' ? 'danger' : 'neutral')

        return (
            <button
                ref={ref}
                className={cx(
                    'ui-button',
                    `ui-button-${variant}`,
                    `ui-button-tone-${resolvedTone}`,
                    size === 'sm' ? 'ui-button-sm' : 'ui-button-md',
                    fullWidth ? 'ui-button-full' : undefined,
                    loading ? 'ui-button-loading' : undefined,
                    className
                )}
                disabled={isDisabled}
                {...props}
            >
                {loading ? <span className="ui-spinner" aria-hidden="true" /> : null}
                <span className="ui-button-content">{children}</span>
            </button>
        )
    }
)

Button.displayName = 'Button'
