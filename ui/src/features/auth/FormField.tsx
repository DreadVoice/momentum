import { useId, type ChangeEvent } from 'react'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

interface FormFieldProps {
  readonly label: string
  readonly type: 'text' | 'email' | 'password' | 'url'
  readonly value: string
  readonly error?: string | undefined
  readonly autoComplete: string
  readonly disabled: boolean
  readonly hint?: string | undefined
  readonly placeholder?: string | undefined
  readonly maxLength?: number | undefined
  readonly optional?: boolean
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
  placeholder,
  maxLength,
  optional = false,
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
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId}>
        {label}
        {optional && <span className="text-xs font-normal text-muted-foreground">optional</span>}
      </Label>
      <Input
        id={inputId}
        type={type}
        value={value}
        autoComplete={autoComplete}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={hasError}
        aria-describedby={describedBy.length > 0 ? describedBy : undefined}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onChange(event.target.value)
        }}
      />
      {hint !== undefined && !hasError && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {hasError && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
