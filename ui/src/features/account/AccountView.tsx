import { useCallback, useState, type FormEvent } from 'react'
import { usersApi } from '../../api/usersApi'
import { Alert } from '../../components/common/Alert'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { Spinner } from '../../components/common/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { isApiError, toErrorMessage } from '../../lib/ApiError'
import { formatTimestamp } from '../../lib/date'
import { LIMITS, USERNAME_PATTERN, type UserResponse } from '../../types/api'

interface AccountViewProps {
  readonly user: UserResponse
}

type FieldErrors = Readonly<Record<string, string>>

interface ProfileFormProps {
  readonly user: UserResponse
}

function ProfileForm({ user }: ProfileFormProps) {
  const { applyUser } = useAuth()
  const [username, setUsername] = useState(user.username)
  const [email, setEmail] = useState(user.email)
  const [profilePhoto, setProfilePhoto] = useState(user.profilePhoto ?? '')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const validate = useCallback((): FieldErrors => {
    const errors: Record<string, string> = {}
    const trimmedName = username.trim()

    if (
      trimmedName.length < LIMITS.usernameMin ||
      trimmedName.length > LIMITS.usernameMax
    ) {
      errors.username = 'Username must be between 3 and 50 characters.'
    } else if (!USERNAME_PATTERN.test(trimmedName)) {
      errors.username = 'Use only letters, numbers, underscores and hyphens.'
    }

    if (!email.includes('@')) {
      errors.email = 'Enter a valid email address.'
    }

    const photo = profilePhoto.trim()
    if (photo.length > 0) {
      if (!/^https?:\/\/\S+$/i.test(photo)) {
        errors.profilePhoto = 'Enter a full URL starting with http:// or https://'
      } else if (photo.length > LIMITS.profilePhotoMax) {
        errors.profilePhoto = 'URL cannot exceed 512 characters.'
      }
    }

    return errors
  }, [username, email, profilePhoto])

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const errors = validate()
      setFieldErrors(errors)
      setError(null)
      setSavedAt(null)

      if (Object.keys(errors).length > 0) {
        return
      }

      setIsSaving(true)
      const photo = profilePhoto.trim()

      usersApi
        .update({
          username: username.trim(),
          email: email.trim(),
          profilePhoto: photo.length > 0 ? photo : null,
        })
        .then((updated) => {
          applyUser(updated)
          setSavedAt(new Date().toLocaleTimeString())
        })
        .catch((cause: unknown) => {
          if (isApiError(cause) && Object.keys(cause.fieldErrors).length > 0) {
            setFieldErrors(cause.fieldErrors)
          }
          setError(toErrorMessage(cause))
        })
        .finally(() => {
          setIsSaving(false)
        })
    },
    [validate, username, email, profilePhoto, applyUser],
  )

  return (
    <form className="stack" onSubmit={handleSubmit} noValidate>
      <h3 className="micro">Profile</h3>

      {error !== null && <Alert tone="error" message={error} />}
      {savedAt !== null && <Alert tone="success" message={`Profile saved at ${savedAt}.`} />}

      <label className="field">
        <span className="field__label">Username</span>
        <input
          className={
            fieldErrors.username !== undefined
              ? 'field__input field__input--invalid'
              : 'field__input'
          }
          type="text"
          value={username}
          maxLength={LIMITS.usernameMax}
          autoComplete="username"
          disabled={isSaving}
          onChange={(event) => {
            setUsername(event.target.value)
          }}
        />
        {fieldErrors.username !== undefined && (
          <span className="field__error">{fieldErrors.username}</span>
        )}
      </label>

      <label className="field">
        <span className="field__label">Email</span>
        <input
          className={
            fieldErrors.email !== undefined
              ? 'field__input field__input--invalid'
              : 'field__input'
          }
          type="email"
          value={email}
          autoComplete="email"
          disabled={isSaving}
          onChange={(event) => {
            setEmail(event.target.value)
          }}
        />
        {fieldErrors.email !== undefined && (
          <span className="field__error">{fieldErrors.email}</span>
        )}
      </label>

      <label className="field">
        <span className="field__label">
          Profile photo URL <span className="field__optional">optional</span>
        </span>
        <input
          className={
            fieldErrors.profilePhoto !== undefined
              ? 'field__input field__input--invalid'
              : 'field__input'
          }
          type="url"
          value={profilePhoto}
          maxLength={LIMITS.profilePhotoMax}
          placeholder="https://"
          disabled={isSaving}
          onChange={(event) => {
            setProfilePhoto(event.target.value)
          }}
        />
        {fieldErrors.profilePhoto !== undefined && (
          <span className="field__error">{fieldErrors.profilePhoto}</span>
        )}
      </label>

      <div>
        <button type="submit" className="m-primary" disabled={isSaving}>
          {isSaving && <Spinner label="Saving" size="sm" />}
          Save profile
        </button>
      </div>
    </form>
  )
}

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setError(null)
      setSuccess(false)

      if (newPassword.length < LIMITS.passwordMin) {
        setError('The new password must be at least 8 characters.')
        return
      }
      if (newPassword !== confirmation) {
        setError('The new password and its confirmation do not match.')
        return
      }

      setIsSaving(true)

      usersApi
        .changePassword({ currentPassword, newPassword })
        .then(() => {
          setSuccess(true)
          setCurrentPassword('')
          setNewPassword('')
          setConfirmation('')
        })
        .catch((cause: unknown) => {
          setError(toErrorMessage(cause))
        })
        .finally(() => {
          setIsSaving(false)
        })
    },
    [currentPassword, newPassword, confirmation],
  )

  return (
    <form className="stack" onSubmit={handleSubmit} noValidate>
      <h3 className="micro">Password</h3>

      {error !== null && <Alert tone="error" message={error} />}
      {success && (
        <Alert
          tone="success"
          message="Password changed. Existing sessions stay signed in."
        />
      )}

      <label className="field">
        <span className="field__label">Current password</span>
        <input
          className="field__input"
          type="password"
          value={currentPassword}
          autoComplete="current-password"
          disabled={isSaving}
          onChange={(event) => {
            setCurrentPassword(event.target.value)
          }}
        />
      </label>

      <label className="field">
        <span className="field__label">New password</span>
        <input
          className="field__input"
          type="password"
          value={newPassword}
          maxLength={LIMITS.passwordMax}
          autoComplete="new-password"
          disabled={isSaving}
          onChange={(event) => {
            setNewPassword(event.target.value)
          }}
        />
        <span className="field__hint">At least 8 characters.</span>
      </label>

      <label className="field">
        <span className="field__label">Confirm new password</span>
        <input
          className="field__input"
          type="password"
          value={confirmation}
          maxLength={LIMITS.passwordMax}
          autoComplete="new-password"
          disabled={isSaving}
          onChange={(event) => {
            setConfirmation(event.target.value)
          }}
        />
      </label>

      <div>
        <button
          type="submit"
          className="m-primary"
          disabled={isSaving || currentPassword.length === 0 || newPassword.length === 0}
        >
          {isSaving && <Spinner label="Saving" size="sm" />}
          Change password
        </button>
      </div>
    </form>
  )
}

/** Account deletion. Requires the current password in the request body. */
function DangerZone({ username }: { readonly username: string }) {
  const { logout } = useAuth()
  const [password, setPassword] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = useCallback(async (): Promise<void> => {
    await usersApi.deleteAccount({ password })
    await logout()
  }, [password, logout])

  const handleOpen = useCallback(() => {
    if (password.length === 0) {
      setError('Enter your password to delete the account.')
      return
    }
    setError(null)
    setIsConfirming(true)
  }, [password])

  return (
    <div className="stack danger-zone">
      <h3 className="micro">Delete account</h3>
      <p className="meta">
        This permanently removes your tasks, subtasks and categories. It cannot be
        undone.
      </p>

      {error !== null && <Alert tone="error" message={error} />}

      <label className="field">
        <span className="field__label">Confirm your password</span>
        <input
          className="field__input"
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(event) => {
            setPassword(event.target.value)
          }}
        />
      </label>

      <div>
        <button type="button" className="m-oauth m-danger" onClick={handleOpen}>
          Delete my account
        </button>
      </div>

      {isConfirming && (
        <ConfirmDialog
          title="Delete account"
          body={`This deletes ${username} and everything in it. There is no recovery.`}
          confirmLabel="Delete permanently"
          confirmationPhrase={username}
          onConfirm={handleDelete}
          onClose={() => {
            setIsConfirming(false)
          }}
        />
      )}
    </div>
  )
}

export function AccountView({ user }: AccountViewProps) {
  return (
    <div className="panel-split">
      <section className="panel-split__aside">
        <h2 className="panel-split__title">Account</h2>
        <p className="panel-split__lede display-accent">
          Your details, your password, your data.
        </p>
        <dl className="detail__meta">
          <div>
            <dt className="micro">Username</dt>
            <dd className="meta">{user.username}</dd>
          </div>
          <div>
            <dt className="micro">Member since</dt>
            <dd className="meta">{formatTimestamp(user.createdAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="panel-split__main account-sections">
        <ProfileForm user={user} />
        <div className="detail__divider" role="presentation" />
        <PasswordForm />
        <div className="detail__divider" role="presentation" />
        <DangerZone username={user.username} />
      </section>
    </div>
  )
}
