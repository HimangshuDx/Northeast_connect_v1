import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, List, Map as MapIcon, MapPin, AlertTriangle } from 'lucide-react';
import { CommunityReport, EmergencyResource, LifelineCorridor } from '../types';
import { NORTHEAST_DISTRICTS } from '../data/sampleData';
import { useApp } from '../context/AppContext';

interface InteractiveMapProps {
  corridors: LifelineCorridor[];
  reports: CommunityReport[];
  resources: EmergencyResource[];
}

type LayerFilter = 'all' | 'incidents' | 'corridors' | 'resources';

function createMarkerIcon(color: string, symbol: string): L.DivIcon {
  return L.divIcon({
    className: 'ne-custom-marker',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:${color};color:#ffffff;border:2px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.35);font-size:12px;font-weight:700;font-family:sans-serif;">${symbol}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  corridors,
  reports,
  resources,
}) => {
  const { isOnline, selectedDistrictId } = useApp();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [layerFilter, setLayerFilter] = useState<LayerFilter>('all');
  const [tileFailed, setTileFailed] = useState<boolean>(false);
  const [forceListFallback, setForceListFallback] = useState<boolean>(false);

  const showListFallback = !isOnline || tileFailed || forceListFallback;

  const activeReports = useMemo(
    () => reports.filter((r) => !r.mergedIntoId && r.coordinates),
    [reports]
  );

  // Initialize Leaflet map when online & in map mode
  useEffect(() => {
    if (showListFallback || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [25.8, 92.6],
        zoom: 7,
        scrollWheelZoom: false,
      });

      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      });

      let tileErrors = 0;
      tiles.on('tileerror', () => {
        tileErrors += 1;
        if (tileErrors >= 3) {
          setTileFailed(true);
        }
      });

      tiles.addTo(map);
      const group = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      layerGroupRef.current = group;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, [showListFallback]);

  // Recenter when district changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || showListFallback) return;
    if (selectedDistrictId === 'all') {
      map.setView([25.8, 92.6], 7);
    } else {
      const dist = NORTHEAST_DISTRICTS.find((d) => d.id === selectedDistrictId);
      if (dist) {
        map.setView([dist.lat, dist.lng], 11);
      }
    }
  }, [selectedDistrictId, showListFallback]);

  // Populate markers
  useEffect(() => {
    const group = layerGroupRef.current;
    if (!group || showListFallback) return;
    group.clearLayers();

    if (layerFilter === 'all' || layerFilter === 'incidents') {
      activeReports.forEach((rep) => {
        if (!rep.coordinates) return;
        const color = rep.severity === 'CRITICAL' ? '#dc2626' : '#d97706';
        const marker = L.marker([rep.coordinates.lat, rep.coordinates.lng], {
          icon: createMarkerIcon(color, '!'),
        });
        marker.bindPopup(
          `<div style="min-width:190px;font-size:12px;">
            <div style="font-weight:700;margin-bottom:2px;">${escapeHtml(rep.category)}: ${escapeHtml(rep.locality)}</div>
            <div style="opacity:0.8;margin-bottom:4px;">${escapeHtml(rep.districtName)} · ${escapeHtml(rep.verificationStatus)}</div>
            <div>${escapeHtml(rep.affectedPeopleCount.toString())} affected · Sample Demo Data</div>
          </div>`
        );
        marker.addTo(group);
      });
    }

    if (layerFilter === 'all' || layerFilter === 'corridors') {
      corridors.forEach((cor) => {
        const isBlocked =
          cor.status === 'LANDSLIDE_BLOCKED' ||
          cor.status === 'SUBMERGED' ||
          cor.status === 'CLOSED';
        const color = isBlocked
          ? '#b91c1c'
          : cor.status === 'SINGLE_LANE'
          ? '#d97706'
          : cor.status === 'PASSABLE'
          ? '#16a34a'
          : '#475569';
        const marker = L.marker([cor.lat, cor.lng], {
          icon: createMarkerIcon(color, 'R'),
        });
        marker.bindPopup(
          `<div style="min-width:190px;font-size:12px;">
            <div style="font-weight:700;margin-bottom:2px;">${escapeHtml(cor.name)}</div>
            <div style="opacity:0.8;margin-bottom:4px;">Status: ${escapeHtml(cor.status.replace('_', ' '))}</div>
            <div>${escapeHtml(cor.advisoryNote)}</div>
          </div>`
        );
        marker.addTo(group);
      });
    }

    if (layerFilter === 'all' || layerFilter === 'resources') {
      resources.forEach((res) => {
        const color =
          res.category === 'Medical Posts'
            ? '#2563eb'
            : res.category === 'Water / Ration Points'
            ? '#0891b2'
            : res.category === 'Boat Rescue Points'
            ? '#4f46e5'
            : '#16a34a';
        const symbol =
          res.category === 'Medical Posts'
            ? '+'
            : res.category === 'Water / Ration Points'
            ? 'W'
            : res.category === 'Boat Rescue Points'
            ? 'B'
            : 'C';
        const marker = L.marker([res.lat, res.lng], {
          icon: createMarkerIcon(color, symbol),
        });
        marker.bindPopup(
          `<div style="min-width:190px;font-size:12px;">
            <div style="font-weight:700;margin-bottom:2px;">${escapeHtml(res.name)}</div>
            <div style="opacity:0.8;margin-bottom:4px;">${escapeHtml(res.category)} · ${escapeHtml(res.capacityStatus.replace('_', ' '))}</div>
            <div>${escapeHtml(res.landmark)}</div>
          </div>`
        );
        marker.addTo(group);
      });
    }
  }, [activeReports, corridors, resources, layerFilter, showListFallback]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            Regional Map & Key Locations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sample coordinates via OpenStreetMap · Automatically falls back to offline directory when tiles are unavailable
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {(
              [
                ['all', 'All Layers'],
                ['incidents', 'Incidents'],
                ['corridors', 'Corridors'],
                ['resources', 'Camps & Medical'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setLayerFilter(key)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  layerFilter === key
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              if (tileFailed && isOnline) {
                setTileFailed(false);
                setForceListFallback(false);
              } else {
                setForceListFallback((prev) => !prev);
              }
            }}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
          >
            {showListFallback ? (
              <>
                <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Try Map View</span>
              </>
            ) : (
              <>
                <List className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Location List</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-100 bg-slate-50/80 px-5 py-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Layers className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          Legend:
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            !
          </span>
          <span>Incident Report</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-700 text-[10px] font-bold text-white">
            R
          </span>
          <span>Blocked / Caution Road</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
            C
          </span>
          <span>Relief Camp</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
            +
          </span>
          <span>Medical Post</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-cyan-600 text-[10px] font-bold text-white">
            W
          </span>
          <span>Water / Ration</span>
        </span>
      </div>

      {showListFallback ? (
        <div className="p-5">
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">
                {!isOnline
                  ? 'Offline Location List Active'
                  : tileFailed
                  ? 'Map tiles could not load — Showing Offline Location Directory'
                  : 'Showing Structured Location Directory'}
              </p>
              <p className="mt-0.5 opacity-90">
                All coordinates and landmarks remain accessible below without external map tiles.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(layerFilter === 'all' || layerFilter === 'incidents') &&
              activeReports.map((rep) => (
                <div
                  key={`loc-${rep.id}`}
                  className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
                >
                  <p className="text-[11px] font-semibold text-red-700 dark:text-red-400">
                    Incident · {rep.category}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {rep.locality}
                  </p>
                  <p className="mt-1 flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span>
                      {rep.districtName} ({rep.coordinates?.lat.toFixed(4)},{' '}
                      {rep.coordinates?.lng.toFixed(4)})
                    </span>
                  </p>
                </div>
              ))}

            {(layerFilter === 'all' || layerFilter === 'corridors') &&
              corridors.map((cor) => (
                <div
                  key={`loc-${cor.id}`}
                  className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
                >
                  <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                    Corridor · {cor.status.replace('_', ' ')}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {cor.name}
                  </p>
                  <p className="mt-1 flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span>
                      {cor.districtName} ({cor.lat.toFixed(4)}, {cor.lng.toFixed(4)})
                    </span>
                  </p>
                </div>
              ))}

            {(layerFilter === 'all' || layerFilter === 'resources') &&
              resources.map((res) => (
                <div
                  key={`loc-${res.id}`}
                  className="rounded-lg border border-slate-200 p-3 dark:border-slate-800"
                >
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {res.category} · {res.capacityStatus.replace('_', ' ')}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {res.name}
                  </p>
                  <p className="mt-1 flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span>
                      {res.districtName} ({res.lat.toFixed(4)}, {res.lng.toFixed(4)})
                    </span>
                  </p>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div ref={mapContainerRef} className="h-[380px] w-full rounded-b-xl" />
      )}
    </section>
  );
};
