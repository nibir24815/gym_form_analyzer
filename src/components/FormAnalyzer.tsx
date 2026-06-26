import { useState, useRef, useCallback, useEffect } from "react"
import {
  Brain,
  Upload,
  FileVideo,
  X,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Play,
  Database,
  CloudLightning,
  RefreshCw
} from "lucide-react"
import { supabase } from "../lib/supabase"

/* ─── Types ─── */
interface FormMetric {
  label: string
  value: number
  color: string
  barColor: string
  status: string
}

interface Recommendation {
  icon: React.ElementType
  text: string
  severity: "warning" | "success" | "info"
}

interface AnalysisResult {
  overallScore: number
  exercise: string
  metrics: FormMetric[]
  recommendations: Recommendation[]
}

interface SupabaseLog {
  id: string | number
  created_at: string
  exercise_type: string
  safety_percentage: number
  feedback: string
}

/* ─── Mock Video Assets ─── */
const DEMO_SQUAT_VIDEO = "https://assets.mixkit.co/videos/preview/mixkit-man-performing-squats-with-barbell-in-gym-40545-large.mp4"
const DEMO_BENCH_VIDEO = "https://assets.mixkit.co/videos/preview/mixkit-athlete-training-in-the-gym-40544-large.mp4"

const SQUAT_RESULT: AnalysisResult = {
  overallScore: 94,
  exercise: "Barbell Back Squat",
  metrics: [
    { label: "Depth Accuracy", value: 96, color: "bg-neon-green", barColor: "#22c55e", status: "Parallel Met (-1.8\")" },
    { label: "Path Vertically", value: 91, color: "bg-neon-green", barColor: "#22c55e", status: "Slight Sway (0.3\")" },
    { label: "Ascent Tempo", value: 88, color: "bg-neon-green", barColor: "#22c55e", status: "1.2s Concentric" },
    { label: "Knee Tracking", value: 93, color: "bg-neon-green", barColor: "#22c55e", status: "Zero Valgus Drop" }
  ],
  recommendations: [
    { icon: CheckCircle2, text: "Excellent parallel depth. Foot arches remain grounded.", severity: "success" },
    { icon: AlertTriangle, text: "Hips rose slightly faster than shoulders on rep 4. Lock your core brace.", severity: "warning" },
    { icon: Lightbulb, text: "Keep head neutral. Try alignment with a spot 4 feet ahead on the floor.", severity: "info" }
  ]
}

const BENCH_RESULT: AnalysisResult = {
  overallScore: 86,
  exercise: "Barbell Bench Press",
  metrics: [
    { label: "Path Symmetry", value: 92, color: "bg-neon-green", barColor: "#22c55e", status: "0.1s Left-Right Lag" },
    { label: "Touch Point Accuracy", value: 80, color: "bg-neon-yellow", barColor: "#eab308", status: "0.8\" Sternum Drift" },
    { label: "Elbow Tucking", value: 88, color: "bg-neon-green", barColor: "#22c55e", status: "Strict ~45° Angle" },
    { label: "Lockout Speed", value: 84, color: "bg-neon-green", barColor: "#22c55e", status: "Smooth Acceleration" }
  ],
  recommendations: [
    { icon: CheckCircle2, text: "Outstanding leg drive. Heels are anchored firmly for power.", severity: "success" },
    { icon: AlertTriangle, text: "Left elbow flared out early on concentric set 5. Keep scapula retracted.", severity: "warning" },
    { icon: Lightbulb, text: "Adjust hand width about 1 inch outward to improve chest activation.", severity: "info" }
  ]
}

const SEVERITY_BORDER: Record<string, string> = {
  warning: "border-l-[#eab308] border-l-3",
  success: "border-l-[#22c55e] border-l-3",
  info: "border-l-[#60a5fa] border-l-3"
}

const SEVERITY_BG: Record<string, string> = {
  warning: "bg-yellow-500/5",
  success: "bg-green-500/5",
  info: "bg-blue-500/5"
}

const SEVERITY_ICON_COLOR: Record<string, string> = {
  warning: "text-[#eab308]",
  success: "text-[#22c55e]",
  info: "text-[#60a5fa]"
}

export default function FormAnalyzer() {
  const [selectedExercise, setSelectedExercise] = useState<"Squat" | "Bench">("Squat")
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoName, setVideoName] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState<AnalysisResult | null>(null)
  const [dbStatusMsg, setDbStatusMsg] = useState<string | null>(null)
  const [historyLogs, setHistoryLogs] = useState<SupabaseLog[]>([])
  const [fetchingHistory, setFetchingHistory] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoPlayerRef = useRef<HTMLVideoElement>(null)

  // Fetch Supabase History
  const fetchHistory = useCallback(async () => {
    setFetchingHistory(true)
    try {
      const { data, error } = await supabase
        .from("form_analyses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)
      
      if (error) throw error
      if (data) {
        setHistoryLogs(data)
      }
    } catch (err: any) {
      console.warn("Failed to fetch Supabase history logs:", err.message)
    } finally {
      setFetchingHistory(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Drag handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
      setVideoName(file.name)
      setResults(null)
      setDbStatusMsg(null)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const url = URL.createObjectURL(file)
      setVideoUrl(url)
      setVideoName(file.name)
      setResults(null)
      setDbStatusMsg(null)
    }
  }

  const loadDemo = (type: "Squat" | "Bench") => {
    setSelectedExercise(type)
    setVideoUrl(type === "Squat" ? DEMO_SQUAT_VIDEO : DEMO_BENCH_VIDEO)
    setVideoName(`Demo_${type}_Form.mp4`)
    setResults(null)
    setDbStatusMsg(null)
  }

  const clearVideo = () => {
    setVideoUrl(null)
    setVideoName(null)
    setResults(null)
    setDbStatusMsg(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleAnalyze = async () => {
    if (!videoUrl) return
    setAnalyzing(true)
    setResults(null)
    setDbStatusMsg(null)

    // Simulate AI pipeline delay
    setTimeout(async () => {
      const activeResult = selectedExercise === "Squat" ? SQUAT_RESULT : BENCH_RESULT
      setResults(activeResult)
      setAnalyzing(false)

      // Supabase insertion hook
      try {
        setDbStatusMsg("Syncing...")
        const feedbackText = activeResult.recommendations.map(r => r.text).join(" | ")
        const payload = {
          exercise_type: selectedExercise,
          safety_percentage: activeResult.overallScore,
          feedback: feedbackText
        }

        const { error } = await supabase.from("form_analyses").insert([payload])
        if (error) {
          throw error
        }
        setDbStatusMsg("Saved in Cloud Database")
        fetchHistory()
      } catch (err: any) {
        console.error("Database hook error details:", err)
        setDbStatusMsg(`Offline Sync (${err.message || 'Unknown network error'})`)
      }
    }, 2000)
  }

  // Calculate Needle Coordinates for SVG Speedometer
  const getNeedleCoords = (score: number) => {
    const minAngle = 180 // left
    const maxAngle = 360 // right
    const angle = minAngle + (score / 100) * (maxAngle - minAngle)
    const rad = (angle * Math.PI) / 180
    const centerX = 90
    const centerY = 90
    const needleLength = 55
    const tipX = centerX + needleLength * Math.cos(rad)
    const tipY = centerY + needleLength * Math.sin(rad)
    return { tipX, tipY, centerX, centerY }
  }

  const needle = results ? getNeedleCoords(results.overallScore) : getNeedleCoords(0)

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-gym-text">
            AI Form <span className="fire-gradient-text">Analyzer</span>
          </h1>
          <p className="text-gym-text-muted mt-1 text-sm">
            Instant skeletal tracking, speed check, and bio-mechanical coach assessment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadDemo("Squat")}
            className="px-3.5 py-2 rounded-xl bg-gym-surface-alt border border-gym-border text-xs font-bold text-gym-text hover:text-fire-500 hover:border-fire-500/30 transition-all cursor-pointer"
          >
            Load Demo Squat
          </button>
          <button
            onClick={() => loadDemo("Bench")}
            className="px-3.5 py-2 rounded-xl bg-gym-surface-alt border border-gym-border text-xs font-bold text-gym-text hover:text-fire-500 hover:border-fire-500/30 transition-all cursor-pointer"
          >
            Load Demo Bench
          </button>
        </div>
      </div>

      {/* Large File Drag & Drop Upload Zone */}
      <div
        className={`
          glass-card py-10 px-6 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl transition-all duration-300 relative
          ${dragActive ? "drop-zone-active" : "border-gym-border"}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {!videoUrl ? (
          <div
            className="flex flex-col items-center justify-center gap-4 text-center cursor-pointer w-full h-full py-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-14 h-14 bg-gym-surface-alt border border-gym-border rounded-full flex items-center justify-center text-fire-500 shadow-md shadow-fire-500/5 animate-float">
              <Upload className="w-6 h-6 animate-pulse-glow" />
            </div>
            <div>
              <p className="text-base font-bold text-gym-text">
                Drag and drop your lift video here
              </p>
              <p className="text-xs text-gym-text-dim mt-1.5">
                Supports MP4, MOV, AVI (Up to 150MB) or click to browse files
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex items-center gap-3 bg-gym-surface border border-gym-border px-5 py-3 rounded-xl max-w-md w-full relative">
              <FileVideo className="w-6 h-6 text-fire-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gym-text truncate pr-2">
                  {videoName}
                </p>
                <p className="text-[10px] text-gym-text-dim font-semibold uppercase mt-0.5">
                  Ready to process
                </p>
              </div>
              <button
                onClick={clearVideo}
                className="p-1 rounded-lg hover:bg-gym-surface-alt text-gym-text-muted hover:text-fire-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value as "Squat" | "Bench")}
                className="bg-gym-surface border border-gym-border px-3 py-2 rounded-xl text-xs font-bold text-gym-text focus:outline-none focus:border-fire-500 cursor-pointer"
              >
                <option value="Squat">Back Squat Profile</option>
                <option value="Bench">Bench Press Profile</option>
              </select>

              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="fire-gradient flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-xs font-black shadow-lg shadow-fire-500/20 hover:shadow-fire-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-65 disabled:pointer-events-none"
              >
                <Play className="w-4 h-4 fill-white" />
                {analyzing ? "AI Scanning Biomechanics..." : "Analyze Form"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Split Pane Layout for Active Analysis */}
      {(videoUrl || analyzing || results) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Pane - Uploaded Media Preview */}
          <div className="glass-card p-4 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gym-border/60">
              <span className="text-xs font-bold text-gym-text-muted uppercase tracking-wider">
                Video Telemetry Overlay
              </span>
              <span className="text-[10px] text-gym-text-dim font-bold uppercase">{selectedExercise} Tracker</span>
            </div>

            <div className="w-full aspect-[4/3] sm:aspect-video bg-black/90 rounded-xl overflow-hidden relative border border-gym-border/40 flex items-center justify-center">
              {analyzing && (
                <div className="absolute inset-0 z-20 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-4">
                  <Sparkles className="w-10 h-10 text-fire-500 animate-pulse-glow" />
                  <p className="text-sm font-bold text-gym-text animate-pulse">Running Skeletal Angle Scan...</p>
                  <div className="w-48 h-1 bg-gym-surface-alt rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full animate-shimmer"
                      style={{
                        background: "linear-gradient(90deg, transparent 0%, var(--color-fire-500) 50%, transparent 100%)",
                        backgroundSize: "200% 100%"
                      }}
                    />
                  </div>
                </div>
              )}

              {videoUrl ? (
                <video
                  ref={videoPlayerRef}
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-gym-text-dim text-xs">
                  Awaiting media source...
                </div>
              )}
            </div>
          </div>

          {/* Right Pane - Coach's Assessment Dashboard */}
          <div className="glass-card p-5 space-y-6">
            <div className="flex items-center justify-between pb-3.5 border-b border-gym-border/60">
              <h3 className="text-sm font-bold text-gym-text uppercase tracking-wider flex items-center gap-2">
                <Brain className="w-4.5 h-4.5 text-fire-500" />
                Coach's Assessment
              </h3>
              {dbStatusMsg && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-fire-400">
                  <CloudLightning className="w-3.5 h-3.5" />
                  <span>{dbStatusMsg}</span>
                </div>
              )}
            </div>

            {results ? (
              <div className="space-y-6 animate-fade-in">
                {/* 1. Speedometer Dial Gauge */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="relative w-44 h-28 flex items-center justify-center overflow-hidden">
                    <svg viewBox="0 0 180 110" className="w-full h-full overflow-visible">
                      {/* Scale Background Arc */}
                      <path
                        d="M 20 90 A 70 70 0 0 1 160 90"
                        fill="none"
                        stroke="var(--color-gym-border)"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />

                      {/* Colored Indicator Arc */}
                      <path
                        d="M 20 90 A 70 70 0 0 1 160 90"
                        fill="none"
                        stroke="url(#speedGrad)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={220}
                        strokeDashoffset={220 - (results.overallScore / 100) * 220}
                        className="transition-all duration-1000 ease-out"
                      />

                      {/* Needle Path */}
                      <line
                        x1={needle.centerX}
                        y1={needle.centerY}
                        x2={needle.tipX}
                        y2={needle.tipY}
                        stroke="var(--color-gym-text)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out origin-[90px_90px]"
                      />

                      {/* Needle Anchor Center Circle */}
                      <circle cx="90" cy="90" r="7" fill="var(--color-gym-bg)" stroke="var(--color-gym-text)" strokeWidth="3" />

                      <defs>
                        <linearGradient id="speedGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="60%" stopColor="#eab308" />
                          <stop offset="100%" stopColor="#22c55e" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div className="absolute bottom-0 text-center">
                      <span className="text-3xl font-display font-black text-gym-text leading-none">
                        {results.overallScore}%
                      </span>
                      <p className="text-[10px] text-gym-text-dim font-bold uppercase tracking-wider mt-0.5">
                        Safety Rating
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. HUD Metric Tables */}
                <div className="space-y-3">
                  <span className="text-[10px] text-gym-text-dim font-bold uppercase block tracking-wider">
                    Anatomical Alignments
                  </span>
                  <div className="border border-gym-border/80 rounded-xl overflow-hidden bg-gym-bg/20">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gym-border bg-gym-surface-alt/40 text-gym-text-dim font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3">Metric</th>
                          <th className="py-2.5 px-3 text-right">Alignment</th>
                          <th className="py-2.5 px-3 text-right">Accuracy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gym-border/60">
                        {results.metrics.map((metric) => (
                          <tr key={metric.label} className="hover:bg-gym-surface-alt/20 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-gym-text-muted">{metric.label}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-gym-text">{metric.status}</td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-fire-500">{metric.value}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Stylized Alert Recommendations */}
                <div className="space-y-2.5">
                  <span className="text-[10px] text-gym-text-dim font-bold uppercase block tracking-wider">
                    Bio-Feedback Corrective Advice
                  </span>
                  <div className="space-y-2">
                    {results.recommendations.map((rec, idx) => {
                      const Icon = rec.icon
                      return (
                        <div
                          key={idx}
                          className={`
                            flex items-start gap-3 px-3.5 py-3 rounded-xl border border-gym-border
                            ${SEVERITY_BORDER[rec.severity]} ${SEVERITY_BG[rec.severity]}
                          `}
                        >
                          <Icon className={`w-4.5 h-4.5 shrink-0 mt-0.5 ${SEVERITY_ICON_COLOR[rec.severity]}`} />
                          <p className="text-xs text-gym-text-muted leading-normal">{rec.text}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-gym-text-dim text-xs space-y-2">
                <Brain className="w-10 h-10 mx-auto text-gym-border animate-pulse" />
                <p>Upload a lifter's video to run the AI Biomechanical scan.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cloud Database Integration Logs Feed (Verifies Sync works) */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gym-border/60">
          <h3 className="text-sm font-bold text-gym-text uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4.5 h-4.5 text-fire-500" />
            Live Cloud Sync History (`form_analyses` table)
          </h3>
          <button
            onClick={fetchHistory}
            disabled={fetchingHistory}
            className="p-1 rounded-lg hover:bg-gym-surface-alt text-gym-text-dim hover:text-gym-text cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${fetchingHistory ? "animate-spin text-fire-500" : ""}`} />
          </button>
        </div>

        {fetchingHistory && historyLogs.length === 0 ? (
          <div className="py-6 text-center text-xs text-gym-text-dim">Fetching cloud records...</div>
        ) : historyLogs.length > 0 ? (
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {historyLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gym-bg/40 border border-gym-border/80 rounded-xl text-xs hover:bg-gym-surface-alt/10 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gym-text bg-gym-surface-alt px-2 py-0.5 rounded border border-gym-border text-[10.5px]">
                      {log.exercise_type}
                    </span>
                    <span className="text-[10px] text-gym-text-dim font-medium">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-gym-text-muted leading-tight truncate max-w-xl">
                    {log.feedback}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-gym-text-dim font-bold block uppercase">Rating</span>
                  <span className="text-sm font-black text-fire-500">{log.safety_percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-gym-text-dim space-y-1">
            <p>No remote database logs found.</p>
            <p className="text-[10.5px] text-gym-text-dim/80">Rows inserted during analysis will display here in real-time.</p>
          </div>
        )}
      </div>
    </div>
  )
}
