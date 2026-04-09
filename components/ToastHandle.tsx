"use client"

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  useMemo,
  memo,
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

// Optimized ToastItem with memo and improved animations
const ToastItem = memo(({
  toast,
  onRemove,
  accent,
}: {
  toast: Toast
  onRemove: (id: number) => void
  accent: string
}) => {
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

  const theme = useMemo(() => {
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
    return themes[toast.type]
  }, [toast.type, accent])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: 30, filter: "blur(12px)" }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
      exit={{ 
        opacity: 0, 
        scale: 0.85, 
        y: -15, 
        filter: "blur(12px)",
        transition: { duration: 0.25, ease: "easeOut" } 
      }}
      transition={{ 
        type: "spring", 
        stiffness: 450, 
        damping: 35, 
        mass: 1
      }}
      onClick={() => onRemove(toast.id)}
      className="relative group cursor-pointer overflow-hidden flex items-center gap-4 px-5 py-4 w-full sm:min-w-[360px] sm:max-w-md rounded-2xl border backdrop-blur-3xl shadow-[0_30px_70px_-15px_rgba(0,0,0,0.5)] hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] active:scale-[0.98] transition-all duration-300"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%), ${theme.bg}`,
        borderColor: theme.border,
      }}
    >
      {/* Glass shimmer overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      <div 
        className="shrink-0 p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-lg text-white transition-all duration-500 group-hover:scale-110 group-hover:rotate-[12deg] group-hover:bg-white/10"
        style={{ color: theme.color }}
      >
        {icons[toast.type]}
      </div>

      <div className="flex-1 flex flex-col gap-0.5">
        <span className="text-[14px] font-bold tracking-tight text-white/95 capitalize">
          {toast.type}
        </span>
        <span className="text-[12px] text-white/60 leading-snug font-medium line-clamp-2">
          {toast.message}
        </span>
      </div>

      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 bg-white/10 p-1.5 rounded-lg border border-white/5">
        <X className="w-3.5 h-3.5 text-white/80" />
      </div>

      {/* Progress indicator */}
      <div className="absolute bottom-0 left-0 h-[2.5px] w-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full origin-left"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: progress / 100 }}
          style={{ 
            background: theme.color,
            boxShadow: `0 0 10px ${theme.color}60`
          }}
        />
      </div>
    </motion.div>
  )
})

ToastItem.displayName = "ToastItem"

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

      <div className="fixed bottom-6 left-4 right-4 sm:top-8 sm:right-8 sm:left-auto sm:bottom-auto z-[99999] flex flex-col gap-4 pointer-events-none items-center sm:items-end">
        <AnimatePresence mode="popLayout" initial={false}>
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto w-full sm:w-auto overflow-visible">
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
