'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login, signup } from './actions'

type LoginFormProps = {
  error?: string
  initialIsSignup?: boolean
}

export default function LoginForm({ error, initialIsSignup = false }: LoginFormProps) {
  const isSignup = initialIsSignup
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const passwordMismatch = isSignup && confirmPassword.length > 0 && password !== confirmPassword

  function handleSignupSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!isSignup) return

    if (passwordMismatch) event.preventDefault()
  }

  return (
    <div className="login-form-content">
      <div className="login-form-heading">
        <p className="login-form-kicker">{isSignup ? 'New student account' : 'AI academic advisor'}</p>
        <h2>
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h2>
        <p>
          {isSignup ? 'Create your account to access your intelligent campus memory.' : 'Sign in to access your intelligent campus memory.'}
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error.replace(/_/g, ' ')}
        </div>
      )}

      <form action={isSignup ? signup : login} onSubmit={handleSignupSubmit} className="login-form-fields">
        <div>
          <label htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="form-control"
            placeholder="student@university.edu"
          />
        </div>

        <div>
          <label htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
            className="form-control"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {isSignup && (
          <div>
            <label htmlFor="confirm-password">
              Confirm password
            </label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value)
              }}
              className="form-control"
              placeholder="••••••••"
              aria-invalid={passwordMismatch}
              aria-describedby={passwordMismatch ? 'password-mismatch' : undefined}
            />
            {passwordMismatch && (
              <p id="password-mismatch" className="mt-1.5 text-sm text-red-600">
                Passwords do not match.
              </p>
            )}
          </div>
        )}

        <div className="login-form-actions">
          <button
            type="submit"
            className="button-primary w-full"
            disabled={isSignup && (!password || !confirmPassword || passwordMismatch)}
          >
            {isSignup ? 'Create account' : 'Sign in'}
          </button>
          <Link href={isSignup ? '/login' : '/login?mode=signup'} className="button-secondary w-full login-secondary-action">
            {isSignup ? 'Back to sign in' : 'Create account'}
          </Link>
        </div>
      </form>
    </div>
  )
}
