import { ArrowUpRight, Sparkles } from 'lucide-react'
import LoginForm from './LoginForm'

export default async function LoginPage(props: { searchParams: Promise<{ error?: string; mode?: string }> }) {
  const searchParams = await props.searchParams
  const error = searchParams.error
  const isSignup = searchParams.mode === 'signup'

  return (
    <div className="login-page">
      <div className="login-form-side">
        <div className="login-form-wrap">
          <div className="login-brand-row">
            <div className="login-brand-mark">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="login-brand-name">AI Advisor</p>
              <p className="login-brand-caption">Student workspace</p>
            </div>
          </div>

          <LoginForm error={error} initialIsSignup={isSignup} />
        </div>
      </div>
      
      <div className="login-visual">
        <div className="login-visual-grid" aria-hidden="true" />
        <div className="login-visual-content">
          <div className="login-visual-topline">
            <span className="login-live-dot" />
            <span>Campus intelligence, in context</span>
            <ArrowUpRight className="h-4 w-4" />
          </div>

          <div className="login-visual-copy">
            <p className="login-visual-eyebrow">Your academic day, understood</p>
            <h1>
              A smarter way to move through <span>campus life.</span>
            </h1>
            <p>
              Navigate your campus life with personalized insights, course management, and an intelligent shared memory.
            </p>
          </div>

          <div className="login-insight">
            <div className="login-insight-icon"><Sparkles className="h-5 w-5" /></div>
            <div>
              <p className="login-insight-label">AI Advisor · Shared campus memory</p>
              <p className="login-insight-copy">
                “The quietest study spot during your break is the North Wing of the Central Library.”
              </p>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}
