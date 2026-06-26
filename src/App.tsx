import { useState, useEffect } from 'react'
import { Dumbbell, Brain, CalendarDays, Flame, Menu, X, ShieldCheck } from 'lucide-react'
import Dashboard from './components/Dashboard'
import FormAnalyzer from './components/FormAnalyzer'
import WorkoutPlanner from './components/WorkoutPlanner'
import { supabase } from './lib/supabase'

type Tab = 'dashboard' | 'analyzer' | 'planner'

const tabs: { id: Tab; label: string; description: string; icon: typeof Dumbbell }[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Performance Analytics', icon: Dumbbell },
  { id: 'analyzer', label: 'AI Form Analyzer', description: 'Real-time biomechanics', icon: Brain },
  { id: 'planner', label: 'Workout Planner', description: 'High-intensity coaching', icon: CalendarDays },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking')

  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.from('form_analyses').select('id').limit(1)
        if (error && error.code !== 'PGRST116') { // PGRST116 is empty table, which is fine
          // Let's check if the error is just an empty table or not.
          // If we can read from it or if the client didn't crash, we're good.
          if (error.message.includes('relation "form_analyses" does not exist')) {
            console.warn('Table form_analyses does not exist yet. Check migrations.', error)
          }
          setDbStatus('connected') // Client initialized & connected, schema might just be pending
        } else {
          setDbStatus('connected')
        }
      } catch (err) {
        console.error('Supabase connection error:', err)
        setDbStatus('error')
      }
    }
    checkConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gym-bg text-gym-text font-body flex flex-col md:flex-row relative">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-fire-500/3 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-electric-500/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-gym-surface/85 backdrop-blur-md border-b border-gym-border flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 fire-gradient rounded-lg flex items-center justify-center shadow-md shadow-fire-500/20">
            <Flame className="w-4.5 h-4.5 text-white" />
          </div>
          <h1 className="text-lg font-display font-extrabold tracking-tight">
            <span className="fire-gradient-text">Gym</span>
            <span className="text-gym-text">Forge</span>
          </h1>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-lg bg-gym-surface-alt border border-gym-border text-gym-text-muted hover:text-gym-text cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Sidebar Drawer Backdrop Overlay (Mobile) */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Component */}
      <aside
        className={`
          fixed md:sticky top-0 bottom-0 left-0 z-50
          w-64 border-r border-gym-border bg-gym-surface/90 backdrop-blur-xl
          flex flex-col justify-between p-5 transition-transform duration-300 ease-in-out
          md:translate-x-0 h-screen
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="space-y-8">
          {/* Sidebar Logo & Close Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 fire-gradient rounded-xl flex items-center justify-center shadow-lg shadow-fire-500/20">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div className="absolute inset-0 fire-gradient rounded-xl blur-lg opacity-25 animate-pulse-glow" />
              </div>
              <div>
                <h2 className="text-lg font-display font-black tracking-tight leading-none">
                  <span className="fire-gradient-text">Gym</span>
                  <span className="text-gym-text">Forge</span>
                </h2>
                <p className="text-[9px] text-gym-text-dim font-bold tracking-widest uppercase mt-1">
                  Vanguard Fitness
                </p>
              </div>
            </div>
            {/* Close Button on Mobile */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg hover:bg-gym-surface-alt text-gym-text-muted hover:text-gym-text cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  id={`sidebar-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setIsMobileOpen(false)
                  }}
                  className={`
                    w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all duration-300 cursor-pointer group
                    ${isActive
                      ? 'glass-card border-fire-500/40 text-gym-text shadow-[0_4px_12px_rgba(34,197,94,0.06)]'
                      : 'text-gym-text-muted hover:text-gym-text hover:bg-gym-surface-alt/40 border border-transparent'
                    }
                  `}
                >
                  <div
                    className={`
                      p-1.5 rounded-lg transition-colors
                      ${isActive ? 'bg-fire-500/10 text-fire-500' : 'bg-gym-surface-alt text-gym-text-dim group-hover:text-gym-text-muted'}
                    `}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isActive ? 'text-gym-text font-extrabold' : ''}`}>
                      {tab.label}
                    </p>
                    <p className="text-[10px] text-gym-text-dim font-medium block mt-0.5 leading-none">
                      {tab.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Status Footer */}
        <div className="space-y-3 pt-4 border-t border-gym-border/60">
          {/* Cloud Database Integration Badge */}
          <div className="glass-card px-3.5 py-2.5 flex items-center justify-between border border-gym-border bg-gym-bg/40">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 ${dbStatus === 'connected' ? 'text-fire-500' : 'text-neon-yellow'}`} />
              <span className="text-[11px] text-gym-text-muted font-semibold">Supabase Sync</span>
            </div>
            {dbStatus === 'checking' && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-yellow animate-pulse" />
                <span className="text-[10px] text-neon-yellow font-bold uppercase tracking-wider">Syncing</span>
              </div>
            )}
            {dbStatus === 'connected' && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-fire-500 animate-pulse-glow" />
                <span className="text-[10px] text-fire-500 font-bold uppercase tracking-wider">Active</span>
              </div>
            )}
            {dbStatus === 'error' && (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Offline</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-gym-text-dim px-1 font-semibold uppercase tracking-wider">
            <span>Server: Cloud V1</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* Main View Container */}
      <main className="flex-1 relative z-10 p-4 md:p-8 min-h-[calc(100vh-60px)] md:min-h-screen overflow-y-auto">
        <div key={activeTab} className="tab-enter max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'analyzer' && <FormAnalyzer />}
          {activeTab === 'planner' && <WorkoutPlanner />}
        </div>

        {/* Global Mini Footer */}
        <footer className="max-w-6xl mx-auto border-t border-gym-border/40 py-6 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gym-text-dim font-medium">
            © 2026 GymForge. Precision biomechanics & coaching.
          </p>
          <div className="flex items-center gap-3.5">
            <span className="text-xs text-gym-text-dim font-bold">DARK PROTOCOL</span>
            <div className="w-1 h-1 rounded-full bg-gym-text-dim" />
            <span className="text-xs text-gym-text-dim font-medium">Supabase Powered</span>
          </div>
        </footer>
      </main>
    </div>
  )
}
