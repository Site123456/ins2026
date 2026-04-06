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
  const [paused, setPaused] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (paused || exiting) return
    const step = 100 / (toast.duration / 40)
    const interval = setInterval(() => setProgress(p => Math.max(p - step, 0)), 40)
    return () => clearInterval(interval)
  }, [paused, exiting, toast.duration])

  useEffect(() => {
    if (progress <= 0) {
      setExiting(true)
      const t = setTimeout(() => onRemove(toast.id), 260)
      return () => clearTimeout(t)
    }
  }, [progress, toast.id, onRemove])

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  }

  const bg = `${accent}60`
  const border = `${accent}90`
  const text = (() => {
    const hex = accent.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Mix accent with black (0 = pure black, 1 = pure accent)
    const mix = 1; // adjust intensity here

    const nr = Math.round(r * mix);
    const ng = Math.round(g * mix);
    const nb = Math.round(b * mix);

    return `rgb(${nr}, ${ng}, ${nb})`;
  })();


  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`relative overflow-hidden group flex items-center gap-3 px-4 py-3 pr-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border backdrop-blur-xl text-sm font-medium transition-all duration-300
      ${exiting ? "animate-toastExit" : "animate-toastEnter"}`}
      style={{
        background: bg,
        borderColor: border,
        color: text,
        borderStyle: "solid",
      }}
    >
      <div className="shrink-0 scale-100 group-hover:scale-110 transition-transform duration-300">
        {icons[toast.type]}
      </div>

      <span className="flex-1 leading-tight text-[11px]">{toast.message}</span>

      <button
        onClick={() => setExiting(true)}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        <X className="w-4 h-4" />
      </button>

      <div
        className="absolute bottom-0 left-0 h-[3px] transition-all duration-150 ease-linear"
        style={{ width: `${progress}%`, background: accent }}
      />
    </div>
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

      <div className="fixed top-6 right-6 z-9999 flex flex-col gap-3 w-[340px] max-w-[90vw]">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={remove} accent={accent} />
        ))}
      </div>

      <style jsx>{`
        @keyframes toastEnter {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.92);
            filter: blur(6px);
          }
          60% {
            opacity: 1;
            transform: translateY(-2px) scale(1.03);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes toastExit {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-10px) scale(0.9);
            filter: blur(8px);
          }
        }

        .animate-toastEnter {
          animation: toastEnter 0.38s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-toastExit {
          animation: toastExit 0.28s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("Corsprite docs loading error!")
  return ctx
}
