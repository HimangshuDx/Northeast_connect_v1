import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Compass,
  ExternalLink,
  Footprints,
  Layers,
  List,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Navigation,
  Route as RouteIcon,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NORTHEAST_DISTRICTS } from '../data/sampleData';
import { CommunityReport, EmergencyResource, LifelineCorridor, TrustStatus } from '../types';
import { formatTimestamp } from '../utils/formatters';
import { SegmentedTabs, ViewCrossfade } from './MotionPrimitives';

// Fix Leaflet default marker icon URLs for Vite bundler
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface InteractiveMapProps {
  corridors: LifelineCorridor[];
  reports: CommunityReport[];
  resources: EmergencyResource[];
}

type LayerFilter = 'all' | 'incidents' | 'corridors' | 'resources';

interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  source: 'gps' | 'manual';
  label?: string;
}

interface RouteTarget {
  id: string;
  name: string;
  typeLabel: string;
  lat: number;
  lng: number;
  districtId: string;
}

interface ActiveRouteInfo {
  target: RouteTarget;
  origin: UserLocation;
  coords: [number, number][];
  distanceKm: number;
  durationSec: number | null;
  isFallback: boolean;
  walking: boolean;
  isEstimatedWalkTime?: boolean;
}

interface MissingCoordItem {
  id: string;
  kindLabel: string;
  name: string;
  districtName: string;
  statusLabel: string;
}

function hasValidCoords(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—';
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
}

function createMarkerIcon(color: string, symbol: string): L.DivIcon {
  return L.divIcon({
    className: 'ne-custom-marker',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:${color};color:#ffffff;border:2px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.35);font-size:12px;font-weight:700;font-family:sans-serif;">${symbol}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function createUserLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: 'ne-user-location-marker',
    html: `<div class="ne-user-location-wrapper"><span class="ne-user-location-pulse"></span><span class="ne-user-location-core"></span></div>`,
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

function sanitizeTelHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned ? `tel:${cleaned}` : 'tel:112';
}

function getTrustBadgeHtml(status: TrustStatus, isDemo: boolean): string {
  const styles: Record<TrustStatus, { bg: string; fg: string; label: string }> = {
    VERIFIED: { bg: '#dcfce7', fg: '#166534', label: 'Verified' },
    UNDER_REVIEW: { bg: '#dbeafe', fg: '#1e40af', label: 'Under Review' },
    UNVERIFIED: { bg: '#fef3c7', fg: '#92400e', label: 'Unverified' },
    REJECTED: { bg: '#fee2e2', fg: '#991b1b', label: 'Rejected' },
  };
  const cfg = styles[status] ?? styles.UNVERIFIED;
  const demoPill = isDemo
    ? `<span style="display:inline-block;padding:1px 6px;border-radius:4px;background:#fef3c7;color:#92400e;font-size:10px;font-weight:600;margin-left:4px;">Demo Data</span>`
    : '';
  return `<span style="display:inline-block;padding:1px 6px;border-radius:4px;background:${cfg.bg};color:${cfg.fg};font-size:10px;font-weight:700;">${escapeHtml(cfg.label)}</span>${demoPill}`;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  corridors,
  reports,
  resources,
}) => {
  const { isOnline, selectedDistrictId, t } = useApp();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const userLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingRouteTargetRef = useRef<RouteTarget | null>(null);
  const shouldFitUserBoundsRef = useRef<boolean>(false);
  const latestRouteClickRef = useRef<(target: RouteTarget) => void>(() => {});
  const latestManualPickRef = useRef<(lat: number, lng: number) => void>(() => {});
  const pickStartModeRef = useRef<boolean>(false);
  const walkingModeRef = useRef<boolean>(false);
  const activeRouteRef = useRef<ActiveRouteInfo | null>(null);

  const [layerFilter, setLayerFilter] = useState<LayerFilter>('all');
  const [tileFailed, setTileFailed] = useState<boolean>(false);
  const [forceListFallback, setForceListFallback] = useState<boolean>(false);
  const [legendExpandedMobile, setLegendExpandedMobile] = useState<boolean>(false);

  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [pickStartMode, setPickStartMode] = useState<boolean>(false);

  const [walkingMode, setWalkingMode] = useState<boolean>(false);
  const [routeLoading, setRouteLoading] = useState<boolean>(false);
  const [activeRoute, setActiveRoute] = useState<ActiveRouteInfo | null>(null);
  const [pendingRouteTarget, setPendingRouteTarget] = useState<RouteTarget | null>(null);
  const [pendingTargetName, setPendingTargetName] = useState<string | null>(null);

  const showListFallback = !isOnline || tileFailed || forceListFallback;

  const visibleReports = useMemo(
    () =>
      reports.filter(
        (r) => !r.mergedIntoId && hasValidCoords(r.coordinates?.lat, r.coordinates?.lng)
      ),
    [reports]
  );

  const visibleCorridors = useMemo(
    () => corridors.filter((c) => hasValidCoords(c.lat, c.lng)),
    [corridors]
  );

  const visibleResources = useMemo(
    () => resources.filter((res) => hasValidCoords(res.lat, res.lng)),
    [resources]
  );

  const missingCoordItems = useMemo<MissingCoordItem[]>(() => {
    const items: MissingCoordItem[] = [];
    if (layerFilter === 'all' || layerFilter === 'incidents') {
      reports
        .filter((r) => !r.mergedIntoId && !hasValidCoords(r.coordinates?.lat, r.coordinates?.lng))
        .forEach((r) => {
          items.push({
            id: `miss-rep-${r.id}`,
            kindLabel: `Incident · ${r.category}`,
            name: r.locality || r.corridorOrBlock,
            districtName: r.districtName,
            statusLabel: r.severity,
          });
        });
    }
    if (layerFilter === 'all' || layerFilter === 'corridors') {
      corridors
        .filter((c) => !hasValidCoords(c.lat, c.lng))
        .forEach((c) => {
          items.push({
            id: `miss-cor-${c.id}`,
            kindLabel: `Corridor · ${c.corridorType}`,
            name: c.name,
            districtName: c.districtName,
            statusLabel: c.status.replace(/_/g, ' '),
          });
        });
    }
    if (layerFilter === 'all' || layerFilter === 'resources') {
      resources
        .filter((res) => !hasValidCoords(res.lat, res.lng))
        .forEach((res) => {
          items.push({
            id: `miss-res-${res.id}`,
            kindLabel: res.category,
            name: res.name,
            districtName: res.districtName,
            statusLabel: res.capacityStatus.replace(/_/g, ' '),
          });
        });
    }
    return items;
  }, [reports, corridors, resources, layerFilter]);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const clearRoute = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    pendingRouteTargetRef.current = null;
    routeLayerGroupRef.current?.clearLayers();
    setRouteLoading(false);
    setPendingRouteTarget(null);
    setPendingTargetName(null);
    setActiveRoute(null);
  }, []);

  const drawFallbackStraightLine = useCallback(
    (origin: UserLocation, target: RouteTarget, walking: boolean) => {
      const lineCoords: [number, number][] = [
        [origin.lat, origin.lng],
        [target.lat, target.lng],
      ];
      const straightKm = haversineKm(origin.lat, origin.lng, target.lat, target.lng);
      setActiveRoute({
        target,
        origin,
        coords: lineCoords,
        distanceKm: straightKm,
        durationSec: null,
        isFallback: true,
        walking,
      });
    },
    []
  );

  const fetchAndDrawRoute = useCallback(
    async (origin: UserLocation, target: RouteTarget, walking: boolean) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      pendingRouteTargetRef.current = null;
      setPendingRouteTarget(null);
      setRouteLoading(true);
      setPendingTargetName(target.name);
      mapInstanceRef.current?.closePopup();

      if (!isOnline) {
        drawFallbackStraightLine(origin, target, walking);
        setRouteLoading(false);
        setPendingTargetName(null);
        return;
      }

      const profile = walking ? 'foot' : 'driving';
      const url = `https://router.project-osrm.org/route/v1/${profile}/${origin.lng},${origin.lat};${target.lng},${target.lat}?overview=full&geometries=geojson`;

      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Routing service responded with ${response.status}`);
        }
        const data = (await response.json()) as {
          code?: string;
          routes?: Array<{
            distance?: number;
            duration?: number;
            geometry?: { coordinates?: [number, number][] };
          }>;
        };

        if (controller.signal.aborted) return;

        const firstRoute = data.routes?.[0];
        const coords = firstRoute?.geometry?.coordinates;
        if (data.code !== 'Ok' || !firstRoute || !Array.isArray(coords) || coords.length < 2) {
          throw new Error('No road route geometry returned');
        }

        const latLngs: [number, number][] = coords.map(([lng, lat]) => [lat, lng]);
        const distanceMeters = typeof firstRoute.distance === 'number' ? firstRoute.distance : 0;
        let durationSeconds =
          typeof firstRoute.duration === 'number' ? firstRoute.duration : 0;
        let isEstimatedWalkTime = false;

        // Public OSRM demo server sometimes aliases /foot/ to car speeds (> 3.5 m/s).
        if (walking && durationSeconds > 0 && distanceMeters / durationSeconds > 3.5) {
          durationSeconds = Math.round(distanceMeters / 1.25); // ~4.5 km/h walking speed
          isEstimatedWalkTime = true;
        }

        setActiveRoute({
          target,
          origin,
          coords: latLngs,
          distanceKm: distanceMeters / 1000,
          durationSec: durationSeconds,
          isFallback: false,
          walking,
          isEstimatedWalkTime,
        });
      } catch (err) {
        if ((err as Error)?.name === 'AbortError' || controller.signal.aborted) {
          return;
        }
        drawFallbackStraightLine(origin, target, walking);
      } finally {
        if (!controller.signal.aborted) {
          setRouteLoading(false);
          setPendingTargetName(null);
        }
      }
    },
    [drawFallbackStraightLine, isOnline]
  );

  const mapGeoError = useCallback(
    (err: GeolocationPositionError): string => {
      if (
        err.code === err.PERMISSION_DENIED &&
        typeof err.message === 'string' &&
        /permissions?\s*policy/i.test(err.message)
      ) {
        return t.map.geoIframeBlocked;
      }
      switch (err.code) {
        case err.PERMISSION_DENIED:
          return t.map.geoPermissionDenied;
        case err.POSITION_UNAVAILABLE:
          return t.map.geoUnavailable;
        case err.TIMEOUT:
          return t.map.geoTimeout;
        default:
          return t.map.geoGenericError;
      }
    },
    [t]
  );

  const applyManualOrigin = useCallback(
    (lat: number, lng: number, label: string) => {
      clearWatch();
      const nextLoc: UserLocation = {
        lat,
        lng,
        accuracy: 0,
        source: 'manual',
        label,
      };
      setUserLocation(nextLoc);
      setLocating(false);
      setGeoError(null);
      setPickStartMode(false);

      const target = pendingRouteTargetRef.current ?? activeRouteRef.current?.target ?? null;
      if (target) {
        pendingRouteTargetRef.current = null;
        setPendingRouteTarget(null);
        shouldFitUserBoundsRef.current = false;
        void fetchAndDrawRoute(nextLoc, target, walkingModeRef.current);
      } else {
        shouldFitUserBoundsRef.current = true;
      }
    },
    [clearWatch, fetchAndDrawRoute]
  );

  const handleUseDistrictCenter = useCallback(
    (districtIdOverride?: string) => {
      const targetDistrictId =
        selectedDistrictId !== 'all'
          ? selectedDistrictId
          : districtIdOverride && districtIdOverride !== 'all'
          ? districtIdOverride
          : 'kamrup-metro';
      const dist =
        NORTHEAST_DISTRICTS.find((d) => d.id === targetDistrictId) ??
        NORTHEAST_DISTRICTS.find((d) => d.id !== 'all');
      if (!dist) return;
      applyManualOrigin(dist.lat, dist.lng, `${dist.name} (${t.map.districtCenterSuffix})`);
    },
    [applyManualOrigin, selectedDistrictId, t.map.districtCenterSuffix]
  );

  const startGeolocation = useCallback(
    (fitBoundsOnFix: boolean) => {
      setPickStartMode(false);

      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        setGeoError(t.map.geoUnsupported);
        setLocating(false);
        setRouteLoading(false);
        setPendingTargetName(null);
        return;
      }

      setGeoError(null);
      setLocating(true);
      shouldFitUserBoundsRef.current = fitBoundsOnFix;

      const handleSuccess = (pos: GeolocationPosition) => {
        const nextLoc: UserLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : 50,
          source: 'gps',
        };
        setUserLocation(nextLoc);
        setLocating(false);
        setGeoError(null);

        clearWatch();
        watchIdRef.current = navigator.geolocation.watchPosition(
          (watchPos) => {
            setUserLocation({
              lat: watchPos.coords.latitude,
              lng: watchPos.coords.longitude,
              accuracy: Number.isFinite(watchPos.coords.accuracy) ? watchPos.coords.accuracy : 50,
              source: 'gps',
            });
            setLocating(false);
          },
          (watchErr) => {
            if (watchErr.code === watchErr.PERMISSION_DENIED) {
              setGeoError(mapGeoError(watchErr));
              clearWatch();
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );

        if (pendingRouteTargetRef.current) {
          const target = pendingRouteTargetRef.current;
          pendingRouteTargetRef.current = null;
          setPendingRouteTarget(null);
          shouldFitUserBoundsRef.current = false;
          void fetchAndDrawRoute(nextLoc, target, walkingModeRef.current);
        }
      };

      const handleFinalError = (err: GeolocationPositionError) => {
        setLocating(false);
        setGeoError(mapGeoError(err));
        setRouteLoading(false);
        setPendingTargetName(null);
      };

      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        (err) => {
          // On high-accuracy timeout (common on desktop/indoors), retry once with network/coarse location
          if (err.code === err.TIMEOUT) {
            navigator.geolocation.getCurrentPosition(handleSuccess, handleFinalError, {
              enableHighAccuracy: false,
              timeout: 6000,
              maximumAge: 60000,
            });
          } else {
            handleFinalError(err);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 30000,
        }
      );
    },
    [clearWatch, fetchAndDrawRoute, mapGeoError, t.map.geoUnsupported]
  );

  const handleShowRouteClick = useCallback(
    (target: RouteTarget) => {
      mapInstanceRef.current?.closePopup();
      if (userLocation) {
        void fetchAndDrawRoute(userLocation, target, walkingModeRef.current);
      } else {
        pendingRouteTargetRef.current = target;
        setPendingRouteTarget(target);
        setRouteLoading(true);
        setPendingTargetName(target.name);
        startGeolocation(false);
      }
    },
    [fetchAndDrawRoute, startGeolocation, userLocation]
  );

  useEffect(() => {
    latestRouteClickRef.current = handleShowRouteClick;
  }, [handleShowRouteClick]);

  useEffect(() => {
    latestManualPickRef.current = (lat: number, lng: number) => {
      applyManualOrigin(lat, lng, t.map.manualOriginLabel);
    };
  }, [applyManualOrigin, t.map.manualOriginLabel]);

  useEffect(() => {
    pickStartModeRef.current = pickStartMode;
    const container = mapInstanceRef.current?.getContainer();
    if (container) {
      container.style.cursor = pickStartMode ? 'crosshair' : '';
    }
  }, [pickStartMode]);

  useEffect(() => {
    walkingModeRef.current = walkingMode;
  }, [walkingMode]);

  useEffect(() => {
    activeRouteRef.current = activeRoute;
  }, [activeRoute]);

  // Cleanup geolocation watch & pending fetches on unmount
  useEffect(() => {
    return () => {
      clearWatch();
      abortControllerRef.current?.abort();
    };
  }, [clearWatch]);

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
      const markersGroup = L.layerGroup().addTo(map);
      const routeGroup = L.layerGroup().addTo(map);
      const userGroup = L.layerGroup().addTo(map);

      map.on('click', (evt: L.LeafletMouseEvent) => {
        if (pickStartModeRef.current) {
          latestManualPickRef.current(evt.latlng.lat, evt.latlng.lng);
        }
      });

      mapInstanceRef.current = map;
      layerGroupRef.current = markersGroup;
      routeLayerGroupRef.current = routeGroup;
      userLayerGroupRef.current = userGroup;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        layerGroupRef.current = null;
        routeLayerGroupRef.current = null;
        userLayerGroupRef.current = null;
      }
    };
  }, [showListFallback]);

  // Recenter when district changes (unless an active route is currently framed)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || showListFallback || activeRoute) return;
    if (selectedDistrictId === 'all') {
      map.setView([25.8, 92.6], 7);
    } else {
      const dist = NORTHEAST_DISTRICTS.find((d) => d.id === selectedDistrictId);
      if (dist) {
        map.setView([dist.lat, dist.lng], 11);
      }
    }
  }, [selectedDistrictId, showListFallback, activeRoute]);

  // Populate data markers (Incidents, Corridors, Resources)
  useEffect(() => {
    const group = layerGroupRef.current;
    if (!group || showListFallback) return;
    group.clearLayers();

    const bindRoutePopup = (
      marker: L.Marker,
      target: RouteTarget,
      meta: {
        trustStatus: TrustStatus;
        isDemo: boolean;
        statusText: string;
        confirmedAt: string;
        phone: string;
        subtitle?: string;
      }
    ) => {
      const container = document.createElement('div');
      container.style.cssText = 'min-width:215px;max-width:260px;font-size:12px;line-height:1.45;';

      const titleEl = document.createElement('div');
      titleEl.style.cssText = 'font-weight:700;font-size:13px;margin-bottom:3px;';
      titleEl.textContent = target.name;
      container.appendChild(titleEl);

      const typeEl = document.createElement('div');
      typeEl.style.cssText = 'opacity:0.82;margin-bottom:5px;';
      typeEl.textContent = target.typeLabel;
      container.appendChild(typeEl);

      const badgeRow = document.createElement('div');
      badgeRow.style.cssText = 'margin-bottom:6px;';
      badgeRow.innerHTML = getTrustBadgeHtml(meta.trustStatus, meta.isDemo);
      container.appendChild(badgeRow);

      const statusEl = document.createElement('div');
      statusEl.style.cssText = 'margin-bottom:2px;';
      const statusStrong = document.createElement('strong');
      statusStrong.textContent = 'Status: ';
      statusEl.appendChild(statusStrong);
      statusEl.appendChild(document.createTextNode(meta.statusText));
      container.appendChild(statusEl);

      const confirmedEl = document.createElement('div');
      confirmedEl.style.cssText = 'margin-bottom:2px;';
      const confirmedStrong = document.createElement('strong');
      confirmedStrong.textContent = `${t.map.lastConfirmed}: `;
      confirmedEl.appendChild(confirmedStrong);
      confirmedEl.appendChild(document.createTextNode(formatTimestamp(meta.confirmedAt)));
      container.appendChild(confirmedEl);

      const phoneEl = document.createElement('div');
      phoneEl.style.cssText = 'margin-bottom:8px;';
      const phoneStrong = document.createElement('strong');
      phoneStrong.textContent = `${t.map.phoneLabel}: `;
      phoneEl.appendChild(phoneStrong);
      const phoneLink = document.createElement('a');
      phoneLink.href = sanitizeTelHref(meta.phone);
      phoneLink.style.cssText = 'font-weight:600;text-decoration:underline;';
      phoneLink.textContent = meta.phone;
      phoneEl.appendChild(phoneLink);
      container.appendChild(phoneEl);

      if (meta.subtitle) {
        const subEl = document.createElement('div');
        subEl.style.cssText = 'margin-top:4px;font-size:11px;opacity:0.88;';
        subEl.textContent = meta.subtitle;
        container.appendChild(subEl);
      }

      const routeBtn = document.createElement('button');
      routeBtn.type = 'button';
      routeBtn.setAttribute('data-route-btn', 'true');
      routeBtn.style.cssText =
        'margin-top:6px;width:100%;min-height:44px;border-radius:8px;background:#2563eb;color:#ffffff;font-weight:600;font-size:12px;padding:8px 12px;border:none;cursor:pointer;';
      routeBtn.textContent = t.map.showRouteBtn;
      container.appendChild(routeBtn);

      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      L.DomEvent.on(routeBtn, 'click', (ev) => {
        L.DomEvent.stop(ev);
        latestRouteClickRef.current(target);
      });

      marker.bindPopup(container, { maxWidth: 280 });
    };

    if (layerFilter === 'all' || layerFilter === 'incidents') {
      visibleReports.forEach((rep) => {
        if (!rep.coordinates) return;
        const color = rep.severity === 'CRITICAL' ? '#dc2626' : '#d97706';
        const marker = L.marker([rep.coordinates.lat, rep.coordinates.lng], {
          icon: createMarkerIcon(color, '!'),
        });
        bindRoutePopup(
          marker,
          {
            id: rep.id,
            name: `${rep.category}: ${rep.locality}`,
            typeLabel: `Incident Report · ${rep.districtName}`,
            lat: rep.coordinates.lat,
            lng: rep.coordinates.lng,
            districtId: rep.districtId,
          },
          {
            trustStatus: rep.verificationStatus,
            isDemo: rep.isDemo,
            statusText: `${rep.severity} · ${rep.assistanceStatus}`,
            confirmedAt: rep.createdAt,
            phone: rep.contactPhone || '112',
            subtitle: `${rep.affectedPeopleCount} affected`,
          }
        );
        marker.addTo(group);
      });
    }

    if (layerFilter === 'all' || layerFilter === 'corridors') {
      visibleCorridors.forEach((cor) => {
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
        bindRoutePopup(
          marker,
          {
            id: cor.id,
            name: cor.name,
            typeLabel: `Corridor · ${cor.corridorType}`,
            lat: cor.lat,
            lng: cor.lng,
            districtId: cor.districtId,
          },
          {
            trustStatus: cor.verificationStatus,
            isDemo: cor.isDemo,
            statusText: cor.status.replace(/_/g, ' '),
            confirmedAt: cor.lastConfirmedAt,
            phone: '112',
            subtitle: cor.advisoryNote,
          }
        );
        marker.addTo(group);
      });
    }

    if (layerFilter === 'all' || layerFilter === 'resources') {
      visibleResources.forEach((res) => {
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
        bindRoutePopup(
          marker,
          {
            id: res.id,
            name: res.name,
            typeLabel: `${res.category} · ${res.districtName}`,
            lat: res.lat,
            lng: res.lng,
            districtId: res.districtId,
          },
          {
            trustStatus: res.verificationStatus,
            isDemo: res.isDemo,
            statusText: res.capacityStatus.replace(/_/g, ' '),
            confirmedAt: res.lastConfirmedAt,
            phone: res.contactPhone || '112',
            subtitle: res.landmark,
          }
        );
        marker.addTo(group);
      });
    }
  }, [
    visibleReports,
    visibleCorridors,
    visibleResources,
    layerFilter,
    showListFallback,
    t.map.lastConfirmed,
    t.map.phoneLabel,
    t.map.showRouteBtn,
  ]);

  // Render user location / manual start marker + accuracy circle (GPS only) and fit bounds when requested
  useEffect(() => {
    const map = mapInstanceRef.current;
    const userGroup = userLayerGroupRef.current;
    if (!map || !userGroup || showListFallback) return;

    userGroup.clearLayers();
    if (!userLocation) return;

    if (userLocation.source === 'gps') {
      const accuracyRadius = Math.max(10, Math.min(userLocation.accuracy, 5000));
      L.circle([userLocation.lat, userLocation.lng], {
        radius: accuracyRadius,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.14,
        weight: 1.5,
      }).addTo(userGroup);
    }

    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: createUserLocationIcon(),
      zIndexOffset: 1000,
    }).addTo(userGroup);

    if (userLocation.source === 'gps') {
      userMarker.bindPopup(
        `<div style="font-size:12px;">
          <div style="font-weight:700;">${escapeHtml(t.map.youAreHere)}</div>
          <div style="opacity:0.82;margin-top:2px;">${escapeHtml(t.map.accuracyPrefix)}${Math.round(userLocation.accuracy)} m</div>
        </div>`
      );
    } else {
      userMarker.bindPopup(
        `<div style="font-size:12px;">
          <div style="font-weight:700;">${escapeHtml(userLocation.label || t.map.manualOriginLabel)}</div>
        </div>`
      );
    }

    if (shouldFitUserBoundsRef.current) {
      shouldFitUserBoundsRef.current = false;
      const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng]]);

      if (layerFilter === 'all' || layerFilter === 'incidents') {
        visibleReports.forEach((rep) => {
          if (rep.coordinates) bounds.extend([rep.coordinates.lat, rep.coordinates.lng]);
        });
      }
      if (layerFilter === 'all' || layerFilter === 'corridors') {
        visibleCorridors.forEach((cor) => bounds.extend([cor.lat, cor.lng]));
      }
      if (layerFilter === 'all' || layerFilter === 'resources') {
        visibleResources.forEach((res) => bounds.extend([res.lat, res.lng]));
      }

      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [
    userLocation,
    showListFallback,
    layerFilter,
    visibleReports,
    visibleCorridors,
    visibleResources,
    t.map.youAreHere,
    t.map.accuracyPrefix,
    t.map.manualOriginLabel,
  ]);

  // Render active route polyline declaratively and fit bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeGroup = routeLayerGroupRef.current;
    if (!map || !routeGroup || showListFallback) return;

    routeGroup.clearLayers();
    if (!activeRoute || activeRoute.coords.length < 2) return;

    const polyline = L.polyline(
      activeRoute.coords,
      activeRoute.isFallback
        ? {
            color: '#d97706',
            weight: 4,
            dashArray: '8 8',
            opacity: 0.92,
          }
        : {
            color: activeRoute.walking ? '#0f766e' : '#2563eb',
            weight: 5,
            opacity: 0.92,
          }
    ).addTo(routeGroup);

    map.fitBounds(polyline.getBounds(), { padding: [44, 44], maxZoom: 15 });
  }, [activeRoute, showListFallback]);

  const handleToggleWalking = () => {
    const nextWalking = !walkingMode;
    setWalkingMode(nextWalking);
    if (activeRoute) {
      void fetchAndDrawRoute(userLocation ?? activeRoute.origin, activeRoute.target, nextWalking);
    }
  };

  // Corridors with severe blockages in selected district (or target's district when viewing all)
  const blockedCorridorsWarning = useMemo(() => {
    const activeTargetDistrict = activeRoute?.target.districtId ?? pendingRouteTarget?.districtId ?? null;
    const districtFilter =
      selectedDistrictId !== 'all' ? selectedDistrictId : activeTargetDistrict;
    return corridors.filter(
      (c) =>
        (!districtFilter || c.districtId === districtFilter) &&
        (c.status === 'LANDSLIDE_BLOCKED' || c.status === 'SUBMERGED' || c.status === 'CLOSED')
    );
  }, [corridors, selectedDistrictId, activeRoute, pendingRouteTarget]);

  const layerItems = useMemo(
    () =>
      [
        { key: 'all', label: t.map.allLayers },
        { key: 'incidents', label: t.map.incidents },
        { key: 'corridors', label: t.map.corridors },
        { key: 'resources', label: t.map.resources },
      ] as const,
    [t]
  );

  return (
    <section className="ne-surface overflow-hidden rounded-xl border">
      {/* Header Toolbar */}
      <div className="flex flex-col gap-3 border-b border-[#dce4f0] px-5 py-4 dark:border-[#1f3250] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-[#e6edf7]">
            {t.map.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#8295b3]">{t.map.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SegmentedTabs
            items={layerItems}
            value={layerFilter}
            onChange={setLayerFilter}
            layoutId="map-layer-tabs"
            ariaLabel="Map layer filters"
          />

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
            className="ne-btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#c2cfe2] bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7] dark:hover:bg-[#1e3152] whitespace-nowrap shrink-0"
          >
            {showListFallback ? (
              <>
                <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.map.tryMapView}</span>
              </>
            ) : (
              <>
                <List className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.map.locationList}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Legend Bar (collapsible on mobile, always visible on sm+) */}
      <div className="border-b border-[#dce4f0] bg-[#f8fafd] px-4 py-2 text-xs text-slate-700 dark:border-[#1f3250] dark:bg-[#0d1728] dark:text-[#b7c6dc] sm:px-5 sm:py-2.5">
        <div className="flex items-center justify-between gap-2 sm:hidden">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Layers className="h-3.5 w-3.5 text-slate-400 dark:text-[#8295b3]" aria-hidden="true" />
            {t.map.legendLabel}
          </span>
          <button
            type="button"
            onClick={() => setLegendExpandedMobile((prev) => !prev)}
            aria-expanded={legendExpandedMobile}
            className="ne-btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50/70 dark:text-blue-400 dark:hover:bg-[#172742]"
          >
            <span>{legendExpandedMobile ? t.map.legendToggleHide : t.map.legendToggleShow}</span>
            {legendExpandedMobile ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <div
          className={`${
            legendExpandedMobile ? 'flex pt-2 pb-1' : 'hidden'
          } flex-wrap items-center gap-x-4 gap-y-2 sm:flex sm:pt-0 sm:pb-0`}
        >
          <span className="hidden items-center gap-1.5 font-medium sm:inline-flex">
            <Layers className="h-3.5 w-3.5 text-slate-400 dark:text-[#8295b3]" aria-hidden="true" />
            {t.map.legendLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              !
            </span>
            <span>{t.map.legendIncident}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-700 text-[10px] font-bold text-white">
              R
            </span>
            <span>{t.map.legendCorridor}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
              C
            </span>
            <span>{t.map.legendReliefCamp}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              +
            </span>
            <span>{t.map.legendMedical}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-cyan-600 text-[10px] font-bold text-white">
              W
            </span>
            <span>{t.map.legendWater}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
              B
            </span>
            <span>{t.map.legendBoat}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600 shadow-xs ring-2 ring-blue-400/50" />
            <span>{t.map.legendUser}</span>
          </span>
        </div>
      </div>

      {/* Geolocation Error Banner with non-blocking manual fallback actions */}
      {geoError && (
        <div
          role="alert"
          className="flex flex-col gap-2.5 border-b border-amber-200/90 bg-amber-50 px-4 py-3 text-xs text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-200 sm:px-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{geoError}</span>
            </div>
            <button
              type="button"
              onClick={() => setGeoError(null)}
              aria-label="Dismiss location notice"
              className="inline-flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-md hover:bg-amber-200/60 dark:hover:bg-amber-500/20"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {!showListFallback && (
            <div className="flex flex-wrap items-center gap-2 pl-6">
              <button
                type="button"
                onClick={() => setPickStartMode(true)}
                className="ne-btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-amber-400/80 bg-white px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100/70 dark:border-amber-400/40 dark:bg-[#172742] dark:text-amber-100 dark:hover:bg-[#1e3152]"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{t.map.pickStartOnMap}</span>
              </button>
              <button
                type="button"
                onClick={() => handleUseDistrictCenter(pendingRouteTarget?.districtId)}
                className="ne-btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-amber-400/80 bg-white px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100/70 dark:border-amber-400/40 dark:bg-[#172742] dark:text-amber-100 dark:hover:bg-[#1e3152]"
              >
                <LocateFixed className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{t.map.useDistrictCenter}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Map or Offline Location Directory */}
      <ViewCrossfade viewKey={showListFallback ? 'list' : 'map'}>
        {showListFallback ? (
          <div className="p-5">
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-200/90 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
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
                visibleReports.map((rep) => (
                  <div
                    key={`loc-${rep.id}`}
                    className="rounded-xl border border-[#dce4f0] bg-[#f8fafd] p-3 dark:border-[#1f3250] dark:bg-[#142239]"
                  >
                    <p className="text-[11px] font-semibold text-red-700 dark:text-red-300">
                      Incident · {rep.category}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-[#e6edf7]">
                      {rep.locality}
                    </p>
                    <p className="mt-1 flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums dark:text-[#8295b3]">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>
                        {rep.districtName} ({rep.coordinates?.lat.toFixed(4)},{' '}
                        {rep.coordinates?.lng.toFixed(4)})
                      </span>
                    </p>
                  </div>
                ))}

              {(layerFilter === 'all' || layerFilter === 'corridors') &&
                visibleCorridors.map((cor) => (
                  <div
                    key={`loc-${cor.id}`}
                    className="rounded-xl border border-[#dce4f0] bg-[#f8fafd] p-3 dark:border-[#1f3250] dark:bg-[#142239]"
                  >
                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                      Corridor · {cor.status.replace(/_/g, ' ')}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-[#e6edf7]">
                      {cor.name}
                    </p>
                    <p className="mt-1 flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums dark:text-[#8295b3]">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>
                        {cor.districtName} ({cor.lat.toFixed(4)}, {cor.lng.toFixed(4)})
                      </span>
                    </p>
                  </div>
                ))}

              {(layerFilter === 'all' || layerFilter === 'resources') &&
                visibleResources.map((res) => (
                  <div
                    key={`loc-${res.id}`}
                    className="rounded-xl border border-[#dce4f0] bg-[#f8fafd] p-3 dark:border-[#1f3250] dark:bg-[#142239]"
                  >
                    <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      {res.category} · {res.capacityStatus.replace(/_/g, ' ')}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-[#e6edf7]">
                      {res.name}
                    </p>
                    <p className="mt-1 flex items-center gap-1 font-mono text-xs text-slate-500 tabular-nums dark:text-[#8295b3]">
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
          <div className="relative">
            <div ref={mapContainerRef} className="h-[380px] w-full sm:h-[420px]" />

            {/* Thumb-friendly "Locate me" button floating cleanly in top-right of map */}
            <button
              type="button"
              onClick={() => startGeolocation(true)}
              disabled={locating}
              className="ne-btn-press absolute right-3 top-3 z-[400] inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#c2cfe2] bg-white/95 px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-md backdrop-blur-sm hover:bg-white disabled:opacity-75 dark:border-[#2d456b] dark:bg-[#101b2e]/95 dark:text-[#e6edf7] dark:hover:bg-[#172742]"
            >
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" aria-hidden="true" />
              ) : (
                <LocateFixed className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              )}
              <span>{locating ? t.map.locating : t.map.locateMe}</span>
            </button>

            {/* Interactive Pick-on-Map Instruction Banner */}
            {pickStartMode && (
              <div className="absolute inset-x-3 bottom-3 z-[400] flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-400/80 bg-white/95 px-3.5 py-2.5 text-xs font-semibold text-slate-900 shadow-lg backdrop-blur-sm dark:border-blue-500/50 dark:bg-[#101b2e]/95 dark:text-[#e6edf7]">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <span>{t.map.pickStartHint}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPickStartMode(false)}
                  className="ne-btn-press inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-[#c2cfe2] bg-slate-50 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.map.cancelPickStart}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </ViewCrossfade>

      {/* Route Information & Safety Panel (docked below map so map view remains unobstructed) */}
      {(routeLoading || activeRoute || pendingRouteTarget) && !showListFallback && (
        <div
          aria-live="polite"
          className="border-t border-[#dce4f0] bg-[#f8fafd] p-4 dark:border-[#1f3250] dark:bg-[#0d1728] sm:p-5"
        >
          {routeLoading ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sm font-medium text-slate-800 dark:text-[#e6edf7]">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>
                  {!userLocation
                    ? t.map.locatingForRoute
                    : `${t.map.routeLoading} ${pendingTargetName ?? ''}`}
                </span>
              </div>
              <button
                type="button"
                onClick={clearRoute}
                className="ne-btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#c2cfe2] bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t.map.clearRoute}</span>
              </button>
            </div>
          ) : activeRoute ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                      <RouteIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t.map.routeToLabel}</span>
                    </span>
                    <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-800 dark:bg-[#172742] dark:text-[#b7c6dc]">
                      {activeRoute.walking ? t.map.walkingToggle : t.map.drivingMode}
                    </span>
                    {activeRoute.origin.source === 'manual' && activeRoute.origin.label && (
                      <span className="rounded-md bg-blue-100/80 px-2 py-0.5 text-[11px] font-medium text-blue-900 dark:bg-blue-500/15 dark:text-blue-200">
                        {activeRoute.origin.label}
                      </span>
                    )}
                  </div>
                    <h3 className="mt-1 truncate font-display text-sm font-bold text-slate-900 dark:text-[#eef2f7] sm:text-base">
                      {activeRoute.target.name}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700 dark:text-[#b7c6dc]">
                      <span>
                        <strong>{t.map.routeDistance}:</strong>{' '}
                        <span className="font-mono font-semibold tabular-nums">
                          {activeRoute.distanceKm.toFixed(1)} km
                        </span>
                      </span>
                      {activeRoute.durationSec !== null && (
                        <span>
                          <strong>{t.map.routeDuration}:</strong>{' '}
                          <span className="font-mono font-semibold tabular-nums">
                            {formatDuration(activeRoute.durationSec)}
                          </span>
                          {activeRoute.isEstimatedWalkTime && (
                            <span className="ml-1 text-[11px] text-slate-500 dark:text-[#8295b3]">
                              ({t.map.approxWalkNote})
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mobile-first >=44px Route Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleWalking}
                      aria-pressed={walkingMode}
                      className={`ne-btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
                        walkingMode
                          ? 'border-teal-600 bg-teal-600 text-white hover:bg-teal-700'
                          : 'border-[#c2cfe2] bg-white text-slate-700 hover:bg-slate-50 dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]'
                      }`}
                    >
                      <Footprints className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{t.map.walkingToggle}</span>
                    </button>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${activeRoute.origin.lat},${activeRoute.origin.lng}&destination=${activeRoute.target.lat},${activeRoute.target.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ne-btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-500/35 dark:bg-blue-500/14 dark:text-blue-200 dark:hover:bg-blue-500/20"
                    >
                      <Navigation className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{t.map.openGoogleMaps}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                    </a>

                    <button
                      type="button"
                      onClick={clearRoute}
                      className="ne-btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#c2cfe2] bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]"
                    >
                      <X className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{t.map.clearRoute}</span>
                    </button>
                  </div>
                </div>

                {/* Offline / OSRM Failure Straight-line Disclosure */}
                {activeRoute.isFallback && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-300/90 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-950 dark:border-amber-500/35 dark:bg-amber-500/12 dark:text-amber-200">
                    <Compass className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t.map.straightLineNotice}</span>
                  </div>
                )}

                {/* Blocked / Submerged / Closed Corridors Warning */}
                {blockedCorridorsWarning.length > 0 && (
                  <div
                    role="alert"
                    className="rounded-lg border border-amber-300/90 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-500/35 dark:bg-amber-500/14 dark:text-amber-100"
                  >
                    <p className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                      <span>{t.map.blockedCorridorsWarningTitle}</span>
                    </p>
                    <ul className="mt-1.5 space-y-1 pl-5 list-disc">
                      {blockedCorridorsWarning.map((cor) => (
                        <li key={`warn-cor-${cor.id}`}>
                          <span className="font-semibold">{cor.name}</span> —{' '}
                          <span className="font-mono text-[11px]">
                            {cor.status.replace(/_/g, ' ')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Mandatory Safety Wording */}
                <p className="rounded-lg border border-[#dce4f0] bg-white px-3 py-2 text-xs text-slate-700 dark:border-[#1f3250] dark:bg-[#101b2e] dark:text-[#b7c6dc]">
                  {t.map.routeSafetyNotice}
                </p>
              </div>
          ) : (
            pendingRouteTarget && (
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                      <RouteIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t.map.routeToLabel}</span>
                    </span>
                    <h3 className="mt-1 truncate font-display text-sm font-bold text-slate-900 dark:text-[#eef2f7] sm:text-base">
                      {pendingRouteTarget.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-[#b7c6dc]">
                      {geoError || t.map.gpsRequiredForRoute}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={clearRoute}
                    className="ne-btn-press inline-flex min-h-[44px] shrink-0 items-center gap-1.5 self-start rounded-lg border border-[#c2cfe2] bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]"
                  >
                    <X className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t.map.clearRoute}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPickStartMode(true);
                      mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="ne-btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t.map.pickStartOnMap}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUseDistrictCenter(pendingRouteTarget.districtId)}
                    className="ne-btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#c2cfe2] bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]"
                  >
                    <LocateFixed className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t.map.useDistrictCenter}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRouteLoading(true);
                      setPendingTargetName(pendingRouteTarget.name);
                      startGeolocation(false);
                    }}
                    className="ne-btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#c2cfe2] bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#2d456b] dark:bg-[#172742] dark:text-[#e6edf7] dark:hover:bg-[#1e3152]"
                  >
                    <LocateFixed className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{t.map.retryGps}</span>
                  </button>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${pendingRouteTarget.lat},${pendingRouteTarget.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ne-btn-press inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-500/35 dark:bg-blue-500/14 dark:text-blue-200 dark:hover:bg-blue-500/20"
                  >
                    <Navigation className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{t.map.openGoogleMaps}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                  </a>
                </div>

                {blockedCorridorsWarning.length > 0 && (
                  <div
                    role="alert"
                    className="rounded-lg border border-amber-300/90 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-500/35 dark:bg-amber-500/14 dark:text-amber-100"
                  >
                    <p className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                      <span>{t.map.blockedCorridorsWarningTitle}</span>
                    </p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5">
                      {blockedCorridorsWarning.map((cor) => (
                        <li key={`warn-pending-cor-${cor.id}`}>
                          <span className="font-semibold">{cor.name}</span> —{' '}
                          <span className="font-mono text-[11px]">
                            {cor.status.replace(/_/g, ' ')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="rounded-lg border border-[#dce4f0] bg-white px-3 py-2 text-xs text-slate-700 dark:border-[#1f3250] dark:bg-[#101b2e] dark:text-[#b7c6dc]">
                  {t.map.routeSafetyNotice}
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* Items Without Coordinates List */}
      {missingCoordItems.length > 0 && (
        <div className="border-t border-[#dce4f0] bg-[#f8fafd] px-4 py-3.5 dark:border-[#1f3250] dark:bg-[#0d1728] sm:px-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-[#b7c6dc]">
              {t.map.noCoordsTitle} ({missingCoordItems.length})
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-[#8295b3]">
              {t.map.noCoordsSubtitle}
            </span>
          </div>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {missingCoordItems.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-[#dce4f0] bg-white px-3 py-2 text-xs dark:border-[#1f3250] dark:bg-[#101b2e]"
              >
                <p className="font-semibold text-slate-900 dark:text-[#e6edf7]">{item.name}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-[#8295b3]">
                  {item.kindLabel} · {item.districtName} ({item.statusLabel})
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

