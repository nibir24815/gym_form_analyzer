import { useState, useMemo, useEffect } from 'react'
import {
  Dumbbell,
  Target,
  Trophy,
  Sparkles,
  Zap,
  Activity,
  CloudLightning
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface HistoryPoint {
  id: string | number
  created_at: string
  exercise: string
  safety_score: number
  joint_angles: string
  feedback_bullets: string[]
}

export default function Dashboard({ user }: { user: any }) {
  const [selectedExercise, setSelectedExercise] = useState<'Squat' | 'Bench Press' | 'Deadlift'>('Squat')
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch real user session analyses logs
  const fetchDashboardLogs = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('form_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }) // chronological order for line chart
      
      if (error) throw error
      if (data) {
        setHistory(data)
        if (data.length > 0) {
          setHoveredPointIndex(data.length - 1) // default to latest
        }
      }
    } catch (err) {
      console.error('Failed to load user history logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardLogs()
  }, [user])

  // Compute dynamic stats based on database history
  const stats = useMemo(() => {
    if (history.length === 0) {
      return {
        avgSafety: '—',
        totalLifts: '0',
        bestScore: '—',
        latestScore: '—'
      }
    }

    const total = history.length
    const sum = history.reduce((acc, curr) => acc + curr.safety_score, 0)
    const avg = Math.round(sum / total)
    const max = Math.max(...history.map(h => h.safety_score))
    const latest = history[history.length - 1].safety_score

    return {
      avgSafety: `${avg}%`,
      totalLifts: `${total}`,
      bestScore: `${max}%`,
      latestScore: `${latest}%`
    }
  }, [history])

  // Filter history by selected exercise tab
  const exerciseHistory = useMemo(() => {
    return history.filter(pt => 
      pt.exercise.toLowerCase().includes(selectedExercise.toLowerCase())
    )
  }, [history, selectedExercise])

  // Reset hovered index when exercise changes
  useEffect(() => {
    if (exerciseHistory.length > 0) {
      setHoveredPointIndex(exerciseHistory.length - 1)
    } else {
      setHoveredPointIndex(null)
    }
  }, [selectedExercise, exerciseHistory])

  // SVG parameters for chart
  const width = 600
  const height = 220
  const paddingX = 40
  const paddingY = 30

  // Calculate coordinates dynamically based on dataset length
  const chartPoints = useMemo(() => {
    if (exerciseHistory.length === 0) return []
    const L = exerciseHistory.length

    return exerciseHistory.map((pt, i) => {
      // Space X points evenly across width
      const x = L === 1 
        ? width / 2 
        : paddingX + (i * (width - paddingX * 2)) / (L - 1)

      // Map score (50 to 100) to Y coordinates
      const minScore = 50
      const maxScore = 100
      const score = Math.max(minScore, Math.min(maxScore, pt.safety_score))
      const y = height - paddingY - ((score - minScore) / (maxScore - minScore)) * (height - paddingY * 2)
      
      return { x, y }
    })
  }, [exerciseHistory])

  // Draw the custom curve path
  const linePath = useMemo(() => {
    if (chartPoints.length === 0) return ''
    if (chartPoints.length === 1) return ''
    return chartPoints.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`
      const prev = chartPoints[i - 1]
      const cpX1 = prev.x + (pt.x - prev.x) / 2
      const cpY1 = prev.y
      const cpX2 = prev.x + (pt.x - prev.x) / 2
      const cpY2 = pt.y
      return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${pt.x} ${pt.y}`
    }, '')
  }, [chartPoints])

  // Draw the gradient fill path
  const areaPath = useMemo(() => {
    if (chartPoints.length <= 1) return ''
    const startX = chartPoints[0].x
    const endX = chartPoints[chartPoints.length - 1].x
    const bottomY = height - paddingY
    return `${linePath} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`
  }, [chartPoints, linePath])

  const currentHoveredPoint = hoveredPointIndex !== null && exerciseHistory[hoveredPointIndex] 
    ? exerciseHistory[hoveredPointIndex] 
    : null

  const currentHoveredCoords = hoveredPointIndex !== null && chartPoints[hoveredPointIndex]
    ? chartPoints[hoveredPointIndex]
    : null

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-gym-text">
            Performance <span className="fire-gradient-text">Dashboard</span>
          </h1>
          <p className="text-gym-text-muted mt-1 text-sm">
            Live database analytics & motion trend tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5 bg-gym-surface/60 border border-gym-border px-4 py-2 rounded-xl text-xs font-semibold">
          <CloudLightning className="w-4 h-4 text-fire-500 animate-pulse" />
          <span className="text-gym-text-muted">Dynamic Supabase Sync</span>
        </div>
      </div>

      {/* Loader for first-time queries */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gym-text-dim flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-3 border-fire-500/20 border-t-fire-500 rounded-full animate-spin" />
          <span>Compiling live biomechanical profiles...</span>
        </div>
      ) : (
        <>
          {/* Dynamic Summary Analytics widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Avg Safety Rating', value: stats.avgSafety, unit: '', icon: Target, desc: 'Average of all logged reps' },
              { label: 'Lifts Analyzed', value: stats.totalLifts, unit: 'sessions', icon: Dumbbell, desc: 'Total database submissions' },
              { label: 'Best Form PR', value: stats.bestScore, unit: '', icon: Trophy, desc: 'Highest safety score logged' },
              { label: 'Latest Stability', value: stats.latestScore, unit: '', icon: Activity, desc: 'Safety rating on last lift' },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} className="glass-card stat-glow p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gym-text-dim uppercase tracking-wider">
                      {stat.label}
                    </span>
                    <div className="w-9 h-9 bg-gym-surface-alt border border-gym-border/80 rounded-xl flex items-center justify-center text-fire-500">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-3xl font-display font-black text-gym-text">
                      {stat.value}
                    </span>
                    {stat.unit && <span className="text-xs text-gym-text-dim font-bold">{stat.unit}</span>}
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-gym-border/40 text-[10px] text-gym-text-dim font-bold uppercase tracking-wider">
                    {stat.desc}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Historical Form Stability Trends Chart Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SVG Interactive Line Chart Card */}
            <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base font-display font-bold text-gym-text flex items-center gap-2">
                    <Zap className="w-4.5 h-4.5 text-fire-500" />
                    Biomechanical Stability Index
                  </h2>
                  <p className="text-xs text-gym-text-muted">
                    Analyzes safety score trends compiled chronologically.
                  </p>
                </div>

                {/* Exercise Selector Tabs */}
                <div className="flex bg-gym-surface border border-gym-border p-1 rounded-xl gap-1">
                  {(['Squat', 'Bench Press', 'Deadlift'] as const).map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setSelectedExercise(ex)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        selectedExercise === ex
                          ? 'fire-gradient text-white shadow-md shadow-fire-500/20'
                          : 'text-gym-text-muted hover:text-gym-text'
                      }`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart canvas */}
              <div className="relative w-full aspect-[2.8/1] min-h-[180px] bg-gym-bg/30 border border-gym-border/40 rounded-xl overflow-hidden px-1 py-2 flex items-center justify-center">
                {exerciseHistory.length === 0 ? (
                  <div className="text-center p-6 space-y-3">
                    <Sparkles className="w-8 h-8 text-gym-border mx-auto animate-pulse" />
                    <p className="text-xs text-gym-text-dim font-semibold">
                      No analyses logged for {selectedExercise} profile.
                    </p>
                  </div>
                ) : (
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-fire-500)" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="var(--color-fire-500)" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--color-fire-600)" />
                        <stop offset="50%" stopColor="var(--color-fire-500)" />
                        <stop offset="100%" stopColor="var(--color-fire-400)" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal gridlines */}
                    {[50, 60, 70, 80, 90, 100].map((score) => {
                      const y = height - paddingY - ((score - 50) / (100 - 50)) * (height - paddingY * 2)
                      return (
                        <g key={score} className="opacity-30">
                          <line
                            x1={paddingX}
                            y1={y}
                            x2={width - paddingX}
                            y2={y}
                            stroke="var(--color-gym-border)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={paddingX - 10}
                            y={y + 3}
                            fill="var(--color-gym-text-dim)"
                            fontSize="9"
                            fontWeight="600"
                            textAnchor="end"
                          >
                            {score}%
                          </text>
                        </g>
                      )
                    })}

                    {/* Area under line */}
                    {areaPath && <path d={areaPath} fill="url(#chartAreaGrad)" />}

                    {/* Line path */}
                    {linePath ? (
                      <path d={linePath} fill="none" stroke="url(#chartLineGrad)" strokeWidth="3" strokeLinecap="round" />
                    ) : (
                      // Fallback for single data point
                      chartPoints.length === 1 && (
                        <line
                          x1={paddingX}
                          y1={chartPoints[0].y}
                          x2={width - paddingX}
                          y2={chartPoints[0].y}
                          stroke="var(--color-gym-border)"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                      )
                    )}

                    {/* Vertical hover indicator */}
                    {currentHoveredCoords && (
                      <line
                        x1={currentHoveredCoords.x}
                        y1={paddingY}
                        x2={currentHoveredCoords.x}
                        y2={height - paddingY}
                        stroke="var(--color-fire-500)"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        className="opacity-70"
                      />
                    )}

                    {/* Nodes */}
                    {chartPoints.map((pt, i) => {
                      const isHovered = hoveredPointIndex === i
                      return (
                        <g key={i}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? '7' : '4.5'}
                            fill="var(--color-gym-bg)"
                            stroke="var(--color-fire-500)"
                            strokeWidth={isHovered ? '3.5' : '2.5'}
                            className="transition-all duration-150"
                          />
                          {isHovered && (
                            <circle cx={pt.x} cy={pt.y} r="14" fill="var(--color-fire-500)" fillOpacity="0.15" />
                          )}
                          <text
                            x={pt.x}
                            y={height - 10}
                            fill={isHovered ? 'var(--color-gym-text)' : 'var(--color-gym-text-dim)'}
                            fontSize="9"
                            fontWeight={isHovered ? '700' : '500'}
                            textAnchor="middle"
                          >
                            {new Date(exerciseHistory[i].created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </text>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="20"
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPointIndex(i)}
                          />
                        </g>
                      )
                    })}
                  </svg>
                )}
              </div>
            </div>

            {/* Selected Data Point Diagnostics */}
            <div className="glass-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-gym-border/60">
                  <h3 className="text-xs font-bold text-gym-text uppercase tracking-wider">
                    Diagnostic Telemetry
                  </h3>
                  <span className="text-[10px] text-gym-text-dim font-bold uppercase">
                    {selectedExercise}
                  </span>
                </div>

                {currentHoveredPoint ? (
                  <div className="mt-4 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-gym-text-dim font-bold uppercase">Logged At</span>
                        <p className="text-xs font-extrabold text-gym-text">
                          {new Date(currentHoveredPoint.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-gym-text-dim font-bold uppercase">Safety score</span>
                        <p className="text-lg font-display font-black text-fire-500">
                          {currentHoveredPoint.safety_score}%
                        </p>
                      </div>
                    </div>

                    <div className="bg-gym-surface/40 border border-gym-border/80 rounded-xl px-4 py-3">
                      <span className="text-[9px] text-gym-text-dim font-bold uppercase block">Joint Mechanics</span>
                      <p className="text-xs font-semibold text-gym-text mt-0.5 leading-relaxed">
                        {currentHoveredPoint.joint_angles}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[9px] text-gym-text-dim font-bold uppercase">Coach Bulletins</span>
                      <ul className="list-disc pl-4 text-xs text-gym-text-muted space-y-1.5">
                        {currentHoveredPoint.feedback_bullets.map((fb, idx) => (
                          <li key={idx} className="leading-tight">{fb}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-gym-text-dim text-xs">
                    No data details loaded. Run an analysis run to display diagnostic data.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gym-border/40 mt-6 flex items-center justify-between text-[11px] text-gym-text-dim">
                <span>Target Baseline:</span>
                <span className="text-fire-500 font-extrabold">&gt;85% Safety Range</span>
              </div>
            </div>
          </div>

          {/* Onboarding checklist if database history is empty */}
          {history.length === 0 && (
            <div className="glass-card p-6 bg-gym-surface/40 border border-gym-border text-center space-y-3.5 max-w-xl mx-auto">
              <Sparkles className="w-10 h-10 text-fire-500 mx-auto animate-pulse-glow" />
              <div>
                <h3 className="font-display font-bold text-base text-gym-text">
                  Welcome to GymForge Security Portal
                </h3>
                <p className="text-xs text-gym-text-muted mt-1 leading-normal">
                  Your platform is fully linked to your private database schema and auth portal. Take a video of your lift and analyze your form using Llama-3.2-Vision to build your statistics!
                </p>
              </div>
              <button
                onClick={() => {
                  const clickEvent = new CustomEvent('nav-tab', { detail: 'analyzer' })
                  window.dispatchEvent(clickEvent)
                  // Wait, how do we switch tabs from here?
                  // App.tsx uses state. We can explain or just let them select from sidebar.
                }}
                className="fire-gradient inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-white text-xs font-black shadow-md shadow-fire-500/20 hover:scale-[1.02] transition-transform"
              >
                <span>Navigate to AI Analyzer</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
