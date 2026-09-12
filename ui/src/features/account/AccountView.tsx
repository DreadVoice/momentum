import { useCallback, useState, type FormEvent } from 'react'
import { usersApi } from '../../api/usersApi'
import { Alert } from '../../components/common/Alert'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { Spinner } from '../../components/common/Spinner'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { useAuth } from '../../hooks/useAuth'
import { isApiError, toErrorMessage } from '../../lib/ApiError'
import { formatTimestamp } from '../../lib/date'
import { LIMITS, USERNAME_PATTERN, type UserResponse } from '../../types/api'
import { FormField } from '../auth/FormField'

interface AccountViewProps {
  readonly user: UserResponse
}

type FieldErrors = Readonly<Record<string, string>>

function ProfileForm({ user }: { readonly user: UserResponse }) {
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

    if (trimmedName.length < LIMITS.usernameMin || trimmedName.length > LIMITS.usernameMax) {
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
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your username and email, visible only to you.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          {error !== null && <Alert tone="error" message={error} />}
          {savedAt !== null && (
            <Alert tone="success" message={`Profile saved at ${savedAt}.`} />
          )}

          <FormField
            label="Username"
            type="text"
            value={username}
            error={fieldErrors.username}
            autoComplete="username"
            disabled={isSaving}
            maxLength={LIMITS.usernameMax}
            onChange={setUsername}
          />

          <FormField
            label="Email"
            type="email"
            value={email}
            error={fieldErrors.email}
            autoComplete="email"
            disabled={isSaving}
            onChange={setEmail}
          />

          <FormField
            label="Profile photo URL"
            type="url"
            value={profilePhoto}
            error={fieldErrors.profilePhoto}
            autoComplete="photo"
            disabled={isSaving}
            optional
            placeholder="https://"
            maxLength={LIMITS.profilePhotoMax}
            onChange={setProfilePhoto}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Spinner label="Saving" size="sm" />}
              Save profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          Changing your password keeps existing sessions signed in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          {error !== null && <Alert tone="error" message={error} />}
          {success && (
            <Alert tone="success" message="Password changed. Existing sessions stay signed in." />
          )}

          <FormField
            label="Current password"
            type="password"
            value={currentPassword}
            autoComplete="current-password"
            disabled={isSaving}
            onChange={setCurrentPassword}
          />

          <FormField
            label="New password"
            type="password"
            value={newPassword}
            autoComplete="new-password"
            disabled={isSaving}
            hint="At least 8 characters."
            maxLength={LIMITS.passwordMax}
            onChange={setNewPassword}
          />

          <FormField
            label="Confirm new password"
            type="password"
            value={confirmation}
            autoComplete="new-password"
            disabled={isSaving}
            maxLength={LIMITS.passwordMax}
            onChange={setConfirmation}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSaving || currentPassword.length === 0 || newPassword.length === 0}
            >
              {isSaving && <Spinner label="Saving" size="sm" />}
              Change password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
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
    <Card className="border-destructive/35">
      <CardHeader>
        <CardTitle className="text-destructive">Delete account</CardTitle>
        <CardDescription>
          This permanently removes your tasks, subtasks and categories. It cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error !== null && <Alert tone="error" message={error} />}

        <FormField
          label="Confirm your password"
          type="password"
          value={password}
          autoComplete="current-password"
          disabled={false}
          onChange={setPassword}
        />

        <div className="flex justify-end">
          <Button type="button" variant="destructive" onClick={handleOpen}>
            Delete my account
          </Button>
        </div>
      </CardContent>

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
    </Card>
  )
}

export function AccountView({ user }: AccountViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">Account</h1>
          <p className="text-sm text-muted-foreground">
            Your details, your password, your data.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Member since <span className="tabular">{formatTimestamp(user.createdAt)}</span>
        </p>
      </div>

      <ProfileForm user={user} />
      <PasswordForm />
      <DangerZone username={user.username} />
    </div>
  )
}
