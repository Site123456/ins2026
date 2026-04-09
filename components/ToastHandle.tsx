"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react"
import { CheckCircle2, XCircle, Info, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type ToastType = "success" | "error" | "info"

type Toast = {
  id: number
  type: ToastType
  message: string
  duration: number
}

const ToastContext = createContext<{
  push: (type: ToastType, message: string, duration?: number) => void
} | null>(null)

export function useAccent(defaultAccent = "#c8956c"): string {
  const [accent, setAccent] = useState(defaultAccent)
  useEffect(() => {
    try {
      const match = document.cookie.match(/(?:^|;\s*)cs_settings=([^;]*)/)
      if (match) {
        const data = JSON.parse(decodeURIComponent(match[1]))
        if (data.accent && /^#[0-9a-f]{6}$/i.test(data.accent)) {
          setAccent(data.accent)
        }
      }
    } catch {}
  }, [])
  return accent
}

function ToastItem({
  toast,
  onRemove,
  accent,
}: {
  toast: Toast
  onRemove: (id: number) => void
  accent: string
}) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const step = 100 / (toast.duration / 10)
    const interval = setInterval(() => {
      setProgress((p) => Math.max(0, p - step))
    }, 10)
    return () => clearInterval(interval)
  }, [toast.duration])

  useEffect(() => {
    if (progress <= 0) {
      onRemove(toast.id)
    }
  }, [progress, toast.id, onRemove])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  }

  const themes = {
    success: {
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.08)",
      border: "rgba(16, 185, 129, 0.2)",
    },
    error: {
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.08)",
      border: "rgba(239, 68, 68, 0.2)",
    },
    info: {
      color: accent,
      bg: `${accent}15`,
      border: `${accent}30`,
    },
  }

  const theme = themes[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20, scale: 0.9, filter: "blur(10px)" }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.8, x: 20, filter: "blur(10px)" }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={() => onRemove(toast.id)}
      className="relative group cursor-pointer overflow-hidden flex items-center gap-4 px-5 py-4 min-w-[340px] max-w-md rounded-2xl border backdrop-blur-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-shadow hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6)]"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%), ${theme.bg}`,
        borderColor: theme.border,
      }}
    >
      <div 
        className="shrink-0 p-2 rounded-xl bg-white/5 border border-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12"
        style={{ color: theme.color }}
      >
        {icons[toast.type]}
      </div>

      <div className="flex-1 flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold tracking-wide text-white capitalize opacity-90">
          {toast.type}
        </span>
        <span className="text-[12px] text-white/70 leading-relaxed font-medium">
          {toast.message}
        </span>
      </div>

      <div className="shrink-0 opacity-20 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
        <X className="w-4 h-4 text-white" />
      </div>

      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white/5">
        <div
          className="h-full transition-all duration-150 ease-linear"
          style={{ 
            width: `${progress}%`, 
            background: theme.color,
            boxShadow: `0 0 12px ${theme.color}70`
          }}
        />
      </div>
    </motion.div>
  )
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const accent = useAccent()
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, type, message, duration }])
  }, [])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}

      <div className="fixed top-8 right-8 z-[99999] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence mode="popLayout" initial={false}>
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onRemove={remove} accent={accent} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within a ToastProvider")
  return ctx
}
