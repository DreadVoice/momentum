import { useId, type ChangeEvent } from 'react'

interface FormFieldProps {
  readonly label: string
  readonly type: 'text' | 'email' | 'password'
  readonly value: string
  readonly error?: string | undefined
  readonly autoComplete: string
  readonly disabled: boolean
  readonly hint?: string | undefined
  readonly onChange: (value: string) => void
}

export function FormField({
  label,
  type,
  value,
  error,
  autoComplete,
  disabled,
  hint,
  onChange,
}: FormFieldProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  const hasError = error !== undefined

  const describedBy = [hasError ? errorId : null, hint !== undefined ? hintId : null]
    .filter((id): id is string => id !== null)
    .join(' ')

  return (
    <div className="field">
      <label className="field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={hasError ? 'field__input field__input--invalid' : 'field__input'}
        type={type}
        value={value}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={describedBy.length > 0 ? describedBy : undefined}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onChange(event.target.value)
        }}
      />
      {hint !== undefined && !hasError && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      {hasError && (
        <p id={errorId} className="field__error">
          {error}
        </p>
      )}
    </div>
  )
}
