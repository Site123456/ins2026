"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Props {
  onComplete: () => void;
}

export default function LogoIntro({ onComplete }: Props) {
  const [phase, setPhase] = useState<"enter" | "done">("enter");

  useEffect(() => {
    const doneTimer = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 400);

    return () => {
      clearTimeout(doneTimer);
    };
  }, [onComplete]);
  if (phase === "done") return null;

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#faf7f2] overflow-hidden">

    <div className="relative flex flex-col items-center">

      <div className="relative flex items-center justify-center">
        <Image
          src="/etc/logo.png"
          alt="Indian Nepali Swad Logo"
          width={200}
          height={200}
          priority
          className="relative w-auto h-auto max-w-[40vw] max-h-[20vh] object-contain drop-shadow-[0_0_30px_rgba(255,140,0,0.4)]"
        />
      </div>

      <div className="relative h-7 overflow-hidden">
        <div className="animate-verticalScroll flex flex-col items-center gap-1">
          <span className="text-md font-semibold tracking-wide text-transparent bg-clip-text bg-linear-to-r from-orange-600 via-red-600 to-yellow-600">Chargement…</span>
          <span className="text-md font-semibold tracking-wide text-transparent bg-clip-text bg-linear-to-r from-orange-600 via-red-600 to-yellow-600">読み込み中…</span>
          <span className="text-md font-semibold tracking-wide text-transparent bg-clip-text bg-linear-to-r from-orange-600 via-red-600 to-yellow-600">Loading…</span>
          <span className="text-md font-semibold tracking-wide text-transparent bg-clip-text bg-linear-to-r from-orange-600 via-red-600 to-yellow-600">Wird geladen…</span>
          <span className="text-md font-semibold tracking-wide text-transparent bg-clip-text bg-linear-to-r from-orange-600 via-red-600 to-yellow-600">Cargando…</span>
          <span className="text-md font-semibold tracking-wide text-transparent bg-clip-text bg-linear-to-r from-orange-600 via-red-600 to-yellow-600">Caricamento…</span>
          <span className="text-md font-semibold tracking-wide text-transparent bg-clip-text bg-linear-to-r from-orange-600 via-red-600 to-yellow-600">로딩 중…</span>
          <span className="text-md font-semibold tracking-wide text-transparent bg-clip-text bg-linear-to-r from-orange-600 via-red-600 to-yellow-600">लोड हो रहा है…</span>
          <span className="text-md font-semibold tracking-wide text-transparent bg-clip-text bg-linear-to-r from-orange-600 via-red-600 to-yellow-600">लोड हुँदैछ…</span>
          <span className="text-md font-semibold tracking-wide text-transparent bg-clip-text bg-linear-to-r from-orange-600 via-red-600 to-yellow-600">加载中…</span>
        </div>
      </div>

      {/* Loading Bar */}
      <div className="relative w-55 h-1 my-2 bg-black/10 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-orange-600 to-red-600 animate-loadingBar" />
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-black/20 to-transparent opacity-40 animate-shimmer" />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <p className="text-black text-[10px]">Too slow? <span className="underline decoration-dotted">Refresh</span></p>
        <p className="text-black text-[10px]">Trop lent ? <span className="underline decoration-dotted">Rafraîchir</span></p>
        <p className="text-black text-[10px]">Zu langsam? <span className="underline decoration-dotted">Neu laden</span></p>
        <p className="text-black text-[10px]">¿Demasiado lento? <span className="underline decoration-dotted">Actualizar</span></p>
        <p className="text-black text-[10px]">Troppo lento? <span className="underline decoration-dotted">Ricaricare</span></p>
        <p className="text-black text-[10px]">太慢了吗？<span className="underline decoration-dotted">刷新</span></p>
        <p className="text-black text-[10px]">遅すぎますか？<span className="underline decoration-dotted">更新</span></p>
        <p className="text-black text-[10px]">너무 느린가요? <span className="underline decoration-dotted">새로고침</span></p>
        <p className="text-black text-[10px]">Muito lento? <span className="underline decoration-dotted">Recarregar</span></p>
        <p className="text-black text-[10px]">Слишком медленно? <span className="underline decoration-dotted">Обновить</span></p>
        <p className="text-black text-[10px]">बहुत धीमा? <span className="underline decoration-dotted">रीफ़्रेश</span></p>
        <p className="text-black text-[10px]">धेरै ढिलो? <span className="underline decoration-dotted">रिफ्रेश</span></p>
      </div>
    </div>

    <style jsx global>{`
      @keyframes loadingBar {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(220%); }
      }
      .animate-loadingBar {
        animation: loadingBar 1.8s ease-in-out infinite;
      }

      @keyframes shimmer {
        0% { transform: translateX(-120%); }
        100% { transform: translateX(220%); }
      }
      .animate-shimmer {
        animation: shimmer 2s linear infinite;
      }
      @keyframes gradientMove {
        0% { background-position: 0%; }
        100% { background-position: 200%; }
      }
      .animate-gradient {
        background-size: 200%;
        animation: gradientMove 5s linear infinite;
      }
        
        @keyframes verticalScroll {
          0% { transform: translateY(0); }
          10% { transform: translateY(-28px); }
          20% { transform: translateY(-56px); }
          30% { transform: translateY(-84px); }
          40% { transform: translateY(-112px); }
          50% { transform: translateY(-140px); }
          60% { transform: translateY(-168px); }
          70% { transform: translateY(-196px); }
          80% { transform: translateY(-224px); }
          90% { transform: translateY(-252px); }
          100% { transform: translateY(0); }
        }

        .animate-verticalScroll {
          animation: verticalScroll 3s ease-in-out infinite;
        }
    `}</style>

  </div>
  );
}