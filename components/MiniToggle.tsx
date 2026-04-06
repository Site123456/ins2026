"use client";
import React, { useState, useCallback } from "react";

{/* Svg & coloring drawn manually in : 19/03/2026 fix needed with some calculation & design */}

interface MiniToggleProps {
  initialOn?: boolean;
  dark: boolean;
  disabled?: boolean;
  onChange?: (on: boolean) => void;
  accent?: string;
}

const hexToRgba = (hex: string, a: number) => {
  const m = hex.match(/[a-f\d]{2}/gi);
  if (!m) return `rgba(139,92,246,${a})`;
  const [r, g, b] = m.map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${a})`;
};

const mixColors = (hex1: string, hex2: string, weight = 0.5) => {
  const h1 = hex1.match(/[a-f\d]{2}/gi);
  const h2 = hex2.match(/[a-f\d]{2}/gi);
  if (!h1 || !h2) return hex1;
  const rgb = h1.map((c, i) => {
    const v1 = parseInt(c, 16);
    const v2 = parseInt(h2[i], 16);
    return Math.round(v1 * (1 - weight) + v2 * weight);
  });
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
};

export default function MiniToggle({
  initialOn = true,
  dark,
  disabled = false,
  onChange,
  accent = "#6366f1",
}: MiniToggleProps) {
  const [on, setOn] = useState(initialOn);

  const toggle = useCallback(() => {
    if (disabled) return;
    const next = !on;
    setOn(next);
    onChange?.(next);
  }, [on, disabled, onChange]);

  const isOn = on;

  const trackOn = accent;
  const trackOff = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)";

  const thumbColor = isOn
    ? "#ffffff"
    : dark
    ? "#f1f5f9"
    : "#ffffff";

  const glow = hexToRgba(accent, dark ? 0.6 : 0.35);

  const trackStyle = {
    background: isOn ? trackOn : trackOff,
    boxShadow: isOn
      ? `0 0 12px ${glow}, inset 0 1px 0 rgba(255,255,255,${dark ? 0.15 : 0.4})`
      : `inset 0 1px 2px rgba(0,0,0,${dark ? 0.6 : 0.15})`,
  };

  const thumbStyle = {
    background: thumbColor,
    boxShadow: isOn
      ? "0 2px 6px rgba(0,0,0,0.35)"
      : "0 1px 3px rgba(0,0,0,0.25)",
  };

  return (
    <button
      role="switch"
      aria-checked={isOn}
      disabled={disabled}
      onClick={toggle}
      className={`
        relative h-6 w-10 rounded-full
        transition-all duration-300
        ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
      `}
      style={trackStyle}
    >
      <span
        className={`
          absolute top-1 h-4 w-4 rounded-full
          flex items-center justify-center
          transition-all duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]
          ${isOn ? "left-5" : "left-1"}
        `}
        style={thumbStyle}
      >
        {disabled && (
          <svg viewBox="0 0 24 24" className="w-3 h-3 block">
            {(() => {
              const redBase = "#ef4444";
              const redDark = mixColors(redBase, accent, 0.6);
              const fg = "#ffffff";

              return (
                <>
                  <rect x="6" y="11" width="12" height="9" rx="2.5" fill={redDark} />

                  <path
                    d="M9 11V8.5a3 3 0 1 1 6 0V11"
                    stroke={redDark}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    fill={fg}
                  />

                  <circle cx="12" cy="14" r="1.5" fill={fg} />
                  <rect
                    x="11.6"
                    y="14"
                    width="0.8"
                    height="3.6"
                    rx="0.4"
                    fill={fg}
                  />
                  <circle cx="12" cy="14" r="0.6" fill={redDark} />
                </>
              );
            })()}
          </svg>
        )}
      </span>

      {!disabled && (
        <span
          className={`
            absolute top-1 h-4 w-4 rounded-full
            opacity-0 active:opacity-100 active:scale-150
            transition-all duration-200
            ${isOn ? "left-5" : "left-1"}
          `}
          style={{
            background: hexToRgba(accent, 0.2),
          }}
        />
      )}
    </button>
  );
}