"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { TileLayer, useMap } from "react-leaflet";
import type { MapContainerProps, CircleProps } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";

// ---------- Dynamic imports (client-only map) ----------
const MapContainer = dynamic<MapContainerProps>(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);

const Circle = dynamic<CircleProps>(
  () => import("react-leaflet").then((m) => m.Circle),
  { ssr: false }
);

// ---------- MapController ----------
type MapControllerProps = {
  mapRef: React.MutableRefObject<LeafletMap | null>;
  onReady?: () => void;
  setZoomLevel: (z: number) => void;
};

const MapController: React.FC<MapControllerProps> = ({
  mapRef,
  onReady,
  setZoomLevel,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    mapRef.current = map;
    onReady?.();

    const updateZoom = () => {
      setZoomLevel(map.getZoom());
    };

    updateZoom();
    map.on("zoomend", updateZoom);

    return () => {
      map.off("zoomend", updateZoom);
    };
  }, [map, mapRef, onReady, setZoomLevel]);

  return null;
};

// ---------- Types ----------
interface StableMapProps {
  mapTileUrl: string;
  mapRef: React.MutableRefObject<LeafletMap | null>;
  zonesWithStatus: Array<{
    id: string;
    lat: number;
    lng: number;
    radiusKm: number;
    status: "OPEN" | "CLOSED";
  }>;
  selectedZone: {
    id: string;
    lat: number;
    lng: number;
    radiusKm: number;
    status: "OPEN" | "CLOSED";
  };
  accent: string;
  isDark: boolean;
  onMapReady: () => void;
}

// ---------- Helpers ----------
const toRad = (v: number) => (v * Math.PI) / 180;

const distanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
const StableMap = React.memo(function StableMap({
  mapTileUrl,
  mapRef,
  zonesWithStatus,
  selectedZone,
  accent,
  isDark,
  onMapReady,
}: StableMapProps) {
  const [zoomLevel, setZoomLevel] = useState(5.2);

  // ---------- Accent System ----------
  useEffect(() => {
    const root = document.documentElement;

    const hex = accent.replace("#", "");
    const fullHex =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;

    const r = parseInt(fullHex.slice(0, 2), 16);
    const g = parseInt(fullHex.slice(2, 4), 16);
    const b = parseInt(fullHex.slice(4, 6), 16);

    root.style.setProperty("--accent", `#${fullHex}`);
    root.style.setProperty("--accent-rgb", `${r}, ${g}, ${b}`);
    root.style.setProperty("--accent-glow", `0 0 22px rgba(${r}, ${g}, ${b}, 0.55)`);
  }, [accent]);

  // ---------- Active zone ----------
  const activeZone =
    zonesWithStatus.find((z) => z.id === selectedZone.id) ?? selectedZone;

  const collapsedMode = zoomLevel < 7;

  // ---------- Proximity-based clusters for collapsed mode ----------
  const proximityClusters = useMemo(() => {
    const thresholdKm = 60;
    const others = zonesWithStatus.filter((z) => z.id !== activeZone.id);
    const remaining = [...others];
    const clusters: Array<typeof zonesWithStatus> = [];

    while (remaining.length > 0) {
      const base = remaining.shift()!;
      const cluster = [base];

      for (let i = remaining.length - 1; i >= 0; i--) {
        const candidate = remaining[i];
        const d = distanceKm(base.lat, base.lng, candidate.lat, candidate.lng);
        if (d <= thresholdKm) {
          cluster.push(candidate);
          remaining.splice(i, 1);
        }
      }

      clusters.push(cluster);
    }

    return clusters;
  }, [zonesWithStatus, activeZone.id]);
  return (
    <>
      <MapContainer
        center={[40.5, 2.3522]}
        zoom={4}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
        style={{ backgroundColor: "transparent" }}
        whenReady={onMapReady}
      >
        <TileLayer
          url={mapTileUrl}
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        <MapController
          mapRef={mapRef}
          onReady={onMapReady}
          setZoomLevel={setZoomLevel}
        />
        {collapsedMode ? (
          <>
            {activeZone && (() => {
              const isOpen = activeZone.status === "OPEN";
              const circleColor = isOpen ? "#22c55e" : "#ef4444";
              const circleClass = isOpen
                ? "zone-circle zone-circle-active-open"
                : "zone-circle zone-circle-active-closed";

              return (
                <React.Fragment key={`active-${activeZone.id}`}>
                  <Circle
                    center={[activeZone.lat, activeZone.lng]}
                    radius={activeZone.radiusKm * 1000}
                    pathOptions={{
                      color: circleColor,
                      fillColor: circleColor,
                      fillOpacity: 0.16,
                      weight: 4,
                      className: circleClass,
                    }}
                  />
                  <Circle
                    center={[activeZone.lat, activeZone.lng]}
                    radius={260}
                    pathOptions={{
                      color: circleColor,
                      fillColor: circleColor,
                      fillOpacity: 1,
                      weight: 3,
                      className: "zone-status-dot zone-status-dot-active",
                    }}
                  />
                </React.Fragment>
              );
            })()}

            {proximityClusters.map((cluster, idx) => {
              if (cluster.length === 1) {
                const z = cluster[0];
                const isOpen = z.status === "OPEN";
                const statusColor = isOpen ? "#22c55e" : "#ef4444";

                return (
                  <React.Fragment key={`collapsed-single-${z.id}-${idx}`}>
                    <Circle
                      center={[z.lat, z.lng]}
                      radius={z.radiusKm * 1000}
                      pathOptions={{
                        color: "var(--accent)",
                        fillColor: `rgba(var(--accent-rgb), 0.12)`,
                        fillOpacity: 1,
                        weight: 2,
                        className: "zone-circle zone-circle-collapsed",
                      }}
                    />
                    <Circle
                      center={[z.lat, z.lng]}
                      radius={180}
                      pathOptions={{
                        color: statusColor,
                        fillColor: statusColor,
                        fillOpacity: 1,
                        weight: 1.5,
                        className: "zone-status-dot",
                      }}
                    />
                  </React.Fragment>
                );
              }

              // Real cluster (nearby sites, no label)
              const avgLat =
                cluster.reduce((sum, z) => sum + z.lat, 0) / cluster.length;
              const avgLng =
                cluster.reduce((sum, z) => sum + z.lng, 0) / cluster.length;
              const avgRadiusKm =
                cluster.reduce((sum, z) => sum + z.radiusKm, 0) /
                cluster.length;

              return (
                <React.Fragment key={`collapsed-cluster-${idx}`}>
                  <Circle
                    center={[avgLat, avgLng]}
                    radius={avgRadiusKm * 1000}
                    pathOptions={{
                      color: "var(--accent)",
                      fillColor: isDark
                        ? "rgba(15,23,42,0.96)"
                        : "rgba(255,255,255,0.96)",
                      fillOpacity: 0.9,
                      weight: 2.5,
                      className: "zone-circle zone-circle-collapsed",
                    }}
                  />
                </React.Fragment>
              );
            })}
          </>
        ) : (
          /* ---------- Normal mode: all zones individually ---------- */
          zonesWithStatus.map((z) => {
            const isActive = z.id === activeZone.id;
            const isOpen = z.status === "OPEN";

            const circleColor = isActive
              ? "#22c55e"
              : "var(--accent)";

            const circleClass = isActive
              ? isOpen
                ? "zone-circle zone-circle-active-open"
                : "zone-circle zone-circle-active-closed"
              : "zone-circle";

            const statusColor = isOpen ? "#22c55e" : "#ef4444";
            const statusRadius = isActive ? 260 : 180;
            const statusWeight = isActive ? 2.5 : 1.5;

            return (
              <React.Fragment key={`zone-${z.id}`}>
                <Circle
                  center={[z.lat, z.lng]}
                  radius={z.radiusKm * 1000}
                  pathOptions={{
                    color: circleColor,
                    fillColor: isActive
                      ? circleColor
                      : `rgba(var(--accent-rgb), 0.12)`,
                    fillOpacity: isActive ? 0.16 : 1,
                    weight: isActive ? 4 : 2,
                    className: circleClass,
                  }}
                />
                <Circle
                  center={[z.lat, z.lng]}
                  radius={ isActive? statusRadius : 2}
                  pathOptions={{
                    color: statusColor,
                    fillColor: statusColor,
                    fillOpacity: 1,
                    weight: statusWeight,
                    className: isActive
                      ? "zone-status-dot zone-status-dot-active"
                      : "zone-status-dot",
                  }}
                />
              </React.Fragment>
            );
          })
        )}
      </MapContainer>

      {/* ---------- Styles ---------- */}
      <style jsx global>{`
        .zone-circle {
          transition:
            stroke-width 220ms ease,
            filter 220ms ease,
            r 220ms ease,
            fill-opacity 220ms ease;
        }

        .zone-circle-collapsed {
          transition:
            stroke-width 260ms ease,
            r 260ms ease,
            fill-opacity 260ms ease;
        }

        .zone-circle-active-open {
          animation: zoneGlowPulseOpen 2.4s ease-in-out infinite;
          filter: drop-shadow(0 0 18px rgba(34, 197, 94, 0.8));
        }

        .zone-circle-active-closed {
          animation: zoneGlowPulseClosed 2.4s ease-in-out infinite;
          filter: drop-shadow(0 0 18px rgba(239, 68, 68, 0.8));
        }

        .zone-circle:hover {
          stroke-width: 3.5 !important;
          filter: drop-shadow(0 0 14px rgba(var(--accent-rgb), 0.55));
        }

        .zone-status-dot {
          transition:
            stroke-width 180ms ease,
            r 180ms ease,
            fill-opacity 180ms ease;
        }

        .zone-status-dot:hover {
          stroke-width: 2.5 !important;
        }

        .zone-status-dot-active {
          stroke-width: 3 !important;
        }

        .zone-label {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text",
            sans-serif;
          font-size: 11px;
          font-weight: 500;
          padding: 2px 10px;
          border-radius: 999px;
          transform: translate(-50%, -50%);
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transform-origin: center;
          animation: labelSwipeIn 260ms ease-out forwards;
        }

        .zone-label-dark {
          background: rgba(15, 23, 42, 0.96);
          color: #f9fafb;
          box-shadow: 0 12px 26px rgba(15, 23, 42, 0.55);
        }

        .zone-label-light {
          background: rgba(255, 255, 255, 0.98);
          color: #020617;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.25);
        }

        .zone-label-active-open {
          background: rgba(34, 197, 94, 0.96);
          box-shadow: 0 0 22px rgba(34, 197, 94, 0.9);
          color: #f9fafb;
        }

        .zone-label-active-closed {
          background: rgba(100, 255, 68, 0.96);
          box-shadow: 0 0 22px rgba(100, 255, 68, 0.9);
          color: #f9fafb;
        }

        @keyframes labelSwipeIn {
          0% {
            opacity: 0;
            transform: translate(-60%, -40%) scale(0.9);
          }
          60% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.03);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes zoneGlowPulseOpen {
          0% {
            filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.4));
          }
          50% {
            filter: drop-shadow(0 0 22px rgba(34, 197, 94, 0.95));
          }
          100% {
            filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.4));
          }
        }

        @keyframes zoneGlowPulseClosed {
          0% {
            filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.4));
          }
          50% {
            filter: drop-shadow(0 0 22px rgba(239, 68, 68, 0.95));
          }
          100% {
            filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.4));
          }
        }
      `}</style>
    </>
  );
});

export default StableMap;
