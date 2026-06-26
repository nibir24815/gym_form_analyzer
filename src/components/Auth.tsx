import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Flame, Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!email || !password) {
      setErrorMsg('Please fill in all fields.')
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        if (data?.user && data.session === null) {
          setSuccessMsg('Registration successful! Please check your email inbox to verify your account.')
        } else {
          setSuccessMsg('Account created successfully! Logging you in...')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An authentication error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gym-bg text-gym-text flex items-center justify-center p-4 relative font-body">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-fire-500/5 rounded-full blur-3xl animate-float" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <div className="relative mb-3">
            <div className="w-14 h-14 fire-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-fire-500/25">
              <Flame className="w-7.5 h-7.5 text-white" />
            </div>
            <div className="absolute inset-0 fire-gradient rounded-2xl blur-lg opacity-30 animate-pulse-glow" />
          </div>
          <h1 className="text-3xl font-display font-black tracking-tight">
            <span className="fire-gradient-text">Gym</span>
            <span className="text-gym-text">Forge</span>
          </h1>
          <p className="text-xs text-gym-text-dim font-bold tracking-widest uppercase mt-1">
            Precision Biomechanics Platform
          </p>
        </div>

        {/* Glass Card Auth Box */}
        <div className="glass-card p-8 border border-gym-border">
          {/* Tabs */}
          <div className="flex bg-gym-surface border border-gym-border p-1 rounded-xl gap-1 mb-6">
            <button
              onClick={() => {
                setIsSignUp(false)
                setErrorMsg(null)
                setSuccessMsg(null)
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isSignUp
                  ? 'fire-gradient text-white shadow-md shadow-fire-500/20'
                  : 'text-gym-text-muted hover:text-gym-text'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true)
                setErrorMsg(null)
                setSuccessMsg(null)
              }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isSignUp
                  ? 'fire-gradient text-white shadow-md shadow-fire-500/20'
                  : 'text-gym-text-muted hover:text-gym-text'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Notifications */}
            {errorMsg && (
              <div className="flex items-start gap-3 p-3 bg-red-500/10 border-l-2 border-red-500 rounded-r-xl text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-normal">{errorMsg}</p>
              </div>
            )}
            {successMsg && (
              <div className="flex items-start gap-3 p-3 bg-green-500/10 border-l-2 border-green-500 rounded-r-xl text-xs text-green-400">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-normal">{successMsg}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gym-text-dim font-bold uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gym-text-dim">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-gym-surface border border-gym-border rounded-xl pl-10 pr-4 py-3 text-xs text-gym-text placeholder-gym-text-dim focus:outline-none focus:border-fire-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gym-text-dim font-bold uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gym-text-dim">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gym-surface border border-gym-border rounded-xl pl-10 pr-4 py-3 text-xs text-gym-text placeholder-gym-text-dim focus:outline-none focus:border-fire-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full fire-gradient text-white flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black shadow-lg shadow-fire-500/25 hover:shadow-fire-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Secure Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Global Footer Notes */}
        <p className="text-[10px] text-gym-text-dim text-center mt-6 uppercase tracking-widest leading-normal">
          Secure Authentication Layer · Powered by Supabase
        </p>
      </div>
    </div>
  )
}
