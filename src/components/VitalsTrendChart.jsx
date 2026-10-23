'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  Activity,
  Heart,
  Droplets,
  Calendar,
  AlertCircle,
  Stethoscope,
  Filter,
  CheckCircle2,
  Thermometer,
  Wind
} from 'lucide-react';

/**
 * VitalsTrendChart
 * Prominent, clinical historical trend chart for IPD patient vitals.
 * Plots timestamped BP, pulse, temperature, SpO2, and respiratory rate.
 * Distinguishes Nurse Observations from Doctor Rounds.
 * Never charts absent values as zero.
 */
export default function VitalsTrendChart({ vitalsHistory = [], admissionId = '' }) {
  const [timeRange, setTimeRange] = useState('all'); // '24h' | '48h' | '7d' | 'all'
  const [selectedMetric, setSelectedMetric] = useState('all'); // 'all' | 'bp' | 'pulse' | 'temp' | 'spo2' | 'rr'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // 1. Time range filter & chronological sort (oldest to newest for plotting left to right)
  const filteredReadings = useMemo(() => {
    if (!vitalsHistory || vitalsHistory.length === 0) return [];

    const now = Date.now();
    let cutoff = 0;
    if (timeRange === '24h') cutoff = now - 24 * 3600 * 1000;
    else if (timeRange === '48h') cutoff = now - 48 * 3600 * 1000;
    else if (timeRange === '7d') cutoff = now - 7 * 24 * 3600 * 1000;

    const list = vitalsHistory.filter(item => {
      if (!item) return false;
      const t = new Date(item.recordedAt || item.recorded_at || item.created_at).getTime();
      if (isNaN(t)) return false;
      return cutoff === 0 || t >= cutoff;
    });

    // Chronological order: oldest first (left) to newest last (right)
    return list.sort((a, b) => {
      const ta = new Date(a.recordedAt || a.recorded_at || a.created_at).getTime();
      const tb = new Date(b.recordedAt || b.recorded_at || b.created_at).getTime();
      return ta - tb;
    });
  }, [vitalsHistory, timeRange]);

  // 2. Extract numeric metric values safely (null if missing or unmeasured, never 0)
  const chartPoints = useMemo(() => {
    return filteredReadings.map((item, index) => {
      const v = item.vitals || item.values || {};
      const dateObj = new Date(item.recordedAt || item.recorded_at || item.created_at);

      // Parse BP systolic & diastolic
      let systolic = null;
      let diastolic = null;
      if (v.bp_systolic !== undefined && v.bp_systolic !== null && v.bp_systolic !== '') {
        const num = Number(v.bp_systolic);
        if (!isNaN(num) && num > 0) systolic = num;
      }
      if (v.bp_diastolic !== undefined && v.bp_diastolic !== null && v.bp_diastolic !== '') {
        const num = Number(v.bp_diastolic);
        if (!isNaN(num) && num > 0) diastolic = num;
      }
      if ((systolic === null || diastolic === null) && v.bp && typeof v.bp === 'string') {
        const parts = v.bp.split('/');
        if (parts.length === 2) {
          const s = Number(parts[0].trim());
          const d = Number(parts[1].trim());
          if (!isNaN(s) && s > 0 && systolic === null) systolic = s;
          if (!isNaN(d) && d > 0 && diastolic === null) diastolic = d;
        }
      }

      // Pulse
      let pulse = null;
      if (v.pulse !== undefined && v.pulse !== null && v.pulse !== '') {
        const num = Number(v.pulse);
        if (!isNaN(num) && num > 0) pulse = num;
      }

      // Temperature
      let temp = null;
      let tempUnit = v.temperature_unit || 'C';
      if (v.temperature !== undefined && v.temperature !== null && v.temperature !== '') {
        const num = Number(v.temperature);
        if (!isNaN(num) && num > 0) temp = num;
      }

      // SpO2
      let spo2 = null;
      if (v.spo2 !== undefined && v.spo2 !== null && v.spo2 !== '') {
        const num = Number(v.spo2);
        if (!isNaN(num) && num > 0) spo2 = num;
      }

      // Respiratory Rate
      let rr = null;
      if (v.respiratory_rate !== undefined && v.respiratory_rate !== null && v.respiratory_rate !== '') {
        const num = Number(v.respiratory_rate);
        if (!isNaN(num) && num > 0) rr = num;
      }

      // Blood Glucose
      let glucose = null;
      if (v.blood_glucose !== undefined && v.blood_glucose !== null && v.blood_glucose !== '') {
        const num = Number(v.blood_glucose);
        if (!isNaN(num) && num > 0) glucose = num;
      }

      const isNurse = item.sourceType === 'Nurse Observation' || Boolean(item.isNurseObservation) || item.author_role === 'nurse';

      return {
        id: item.id || `pt-${index}`,
        index,
        timestamp: dateObj.getTime(),
        dateLabel: dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        timeLabel: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clinician: item.recordedBy || item.nurse_name || item.doctor_name || (isNurse ? 'Staff Nurse' : 'Attending Doctor'),
        sourceType: isNurse ? 'Nurse Observation' : 'Doctor Round',
        isNurse,
        systolic,
        diastolic,
        pulse,
        temp,
        tempUnit,
        spo2,
        rr,
        glucose
      };
    });
  }, [filteredReadings]);

  // Metric-specific min/max scales for single metric views
  const getScale = (accessor, defaultMin, defaultMax, minPadding = 5) => {
    const valid = chartPoints.map(accessor).filter(val => val !== null && !isNaN(val));
    if (valid.length === 0) return { min: defaultMin, max: defaultMax, hasData: false };
    const minVal = Math.min(...valid);
    const maxVal = Math.max(...valid);
    const padding = (maxVal - minVal) * 0.15 || minPadding;
    return {
      min: Math.floor(Math.max(0, minVal - padding)),
      max: Math.ceil(maxVal + padding),
      hasData: true
    };
  };

  const bpScale = useMemo(() => {
    const validSys = chartPoints.map(p => p.systolic).filter(v => v !== null);
    const validDia = chartPoints.map(p => p.diastolic).filter(v => v !== null);
    const all = [...validSys, ...validDia];
    if (all.length === 0) return { min: 40, max: 200, hasData: false };
    return {
      min: Math.floor(Math.max(30, Math.min(...all) - 10)),
      max: Math.ceil(Math.max(...all) + 15),
      hasData: true
    };
  }, [chartPoints]);

  const pulseScale = useMemo(() => getScale(p => p.pulse, 40, 160, 8), [chartPoints]);
  const tempScale = useMemo(() => {
    const valid = chartPoints.map(p => p.temp).filter(v => v !== null);
    if (valid.length === 0) return { min: 35.0, max: 41.0, hasData: false };
    const minVal = Math.min(...valid);
    const maxVal = Math.max(...valid);
    return {
      min: Math.max(25, Number((minVal - 0.5).toFixed(1))),
      max: Math.min(55, Number((maxVal + 0.5).toFixed(1))),
      hasData: true
    };
  }, [chartPoints]);
  const spo2Scale = useMemo(() => {
    const valid = chartPoints.map(p => p.spo2).filter(v => v !== null);
    if (valid.length === 0) return { min: 85, max: 100, hasData: false };
    const minVal = Math.min(...valid);
    return {
      min: Math.max(20, Math.floor(minVal - 3)),
      max: 100,
      hasData: true
    };
  }, [chartPoints]);
  const rrScale = useMemo(() => getScale(p => p.rr, 8, 36, 4), [chartPoints]);

  // Chart coordinate geometry
  const chartWidth = 920;
  const chartHeight = 290;
  const padLeft = 55;
  const padRight = 35;
  const padTop = 25;
  const padBottom = 40;
  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = chartHeight - padTop - padBottom;

  const getX = (index, total) => {
    if (total <= 1) return padLeft + innerWidth / 2;
    return padLeft + (index / (total - 1)) * innerWidth;
  };

  // Helper for single metric scaling
  const getYFromScale = (val, scale) => {
    if (val === null || scale.max === scale.min) return null;
    const ratio = (val - scale.min) / (scale.max - scale.min);
    return padTop + innerHeight - ratio * innerHeight;
  };

  // Helper for multi-series unified physiological alignment
  const getNormY = (val, minRange, maxRange) => {
    if (val === null || val === undefined) return null;
    const clamped = Math.max(minRange, Math.min(maxRange, val));
    const ratio = (clamped - minRange) / (maxRange - minRange);
    return padTop + innerHeight - ratio * innerHeight;
  };

  // Dedicated Y-functions for each metric depending on current view mode
  const getYPulse = (val) => {
    if (val === null) return null;
    return selectedMetric === 'pulse' ? getYFromScale(val, pulseScale) : getNormY(val, 25, 180);
  };

  const getYSystolic = (val) => {
    if (val === null) return null;
    return selectedMetric === 'bp' ? getYFromScale(val, bpScale) : getNormY(val, 50, 220);
  };

  const getYDiastolic = (val) => {
    if (val === null) return null;
    return selectedMetric === 'bp' ? getYFromScale(val, bpScale) : getNormY(val, 30, 140);
  };

  const getYTemp = (val) => {
    if (val === null) return null;
    return selectedMetric === 'temp' ? getYFromScale(val, tempScale) : getNormY(val, 30, 52);
  };

  const getYSpO2 = (val) => {
    if (val === null) return null;
    return selectedMetric === 'spo2' ? getYFromScale(val, spo2Scale) : getNormY(val, 30, 100);
  };

  const getYRR = (val) => {
    if (val === null) return null;
    return selectedMetric === 'rr' ? getYFromScale(val, rrScale) : getNormY(val, 6, 45);
  };

  // Build SVG path without charting missing values as zero
  const buildSvgPath = (points, accessor, getYFn) => {
    let d = '';
    let isDrawing = false;

    points.forEach((pt, idx) => {
      const val = accessor(pt);
      if (val === null || val === undefined) {
        isDrawing = false; // Lift pen
        return;
      }
      const x = getX(idx, points.length);
      const y = getYFn(val);
      if (y === null || isNaN(y)) {
        isDrawing = false;
        return;
      }

      if (!isDrawing) {
        d += `M ${x.toFixed(1)} ${y.toFixed(1)} `;
        isDrawing = true;
      } else {
        d += `L ${x.toFixed(1)} ${y.toFixed(1)} `;
      }
    });

    return d;
  };

  // Ticks for Y-Axis when a single metric is selected
  const activeScale = useMemo(() => {
    if (selectedMetric === 'bp') return { ...bpScale, unit: 'mmHg' };
    if (selectedMetric === 'pulse') return { ...pulseScale, unit: 'bpm' };
    if (selectedMetric === 'temp') return { ...tempScale, unit: '°C' };
    if (selectedMetric === 'spo2') return { ...spo2Scale, unit: '%' };
    if (selectedMetric === 'rr') return { ...rrScale, unit: '/min' };
    return null;
  }, [selectedMetric, bpScale, pulseScale, tempScale, spo2Scale, rrScale]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header with Title, Time Range and Metric Filters */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 via-white to-blue-50/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 shadow-2xs">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              Vital Signs Trend Analysis
            </h3>
            <p className="text-[11px] text-slate-500">
              Chronological multi-series physiological trajectory across bedside care & rounds
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Time range selector: 24H, 48H, 7D, All */}
          <div className="flex items-center bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/80 text-[11px] font-semibold text-slate-600">
            {['24h', '48h', '7d', 'all'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  timeRange === r
                    ? 'bg-white text-blue-700 font-bold shadow-2xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Metric Selector Dropdown */}
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-1.5 bg-white text-slate-700 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="all">All Primary Vitals</option>
            <option value="bp">Blood Pressure (mmHg)</option>
            <option value="pulse">Pulse / Heart Rate (bpm)</option>
            <option value="temp">Body Temperature (°C/°F)</option>
            <option value="spo2">Oxygen Saturation SpO2 (%)</option>
            <option value="rr">Respiratory Rate (/min)</option>
          </select>
        </div>
      </div>

      {/* Interactive Legend & Series Guide */}
      <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap text-[11px]">
          {(selectedMetric === 'all' || selectedMetric === 'pulse') && (
            <span className="flex items-center gap-1.5 font-semibold text-rose-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              Pulse (bpm)
            </span>
          )}
          {(selectedMetric === 'all' || selectedMetric === 'bp') && (
            <>
              <span className="flex items-center gap-1.5 font-semibold text-indigo-700">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                BP Systolic (mmHg)
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-sky-700">
                <span className="w-2.5 h-1 border-t-2 border-dashed border-sky-500 inline-block" />
                BP Diastolic (mmHg)
              </span>
            </>
          )}
          {(selectedMetric === 'all' || selectedMetric === 'temp') && (
            <span className="flex items-center gap-1.5 font-semibold text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Temperature (°C)
            </span>
          )}
          {(selectedMetric === 'all' || selectedMetric === 'spo2') && (
            <span className="flex items-center gap-1.5 font-semibold text-teal-700">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
              SpO2 (%)
            </span>
          )}
          {(selectedMetric === 'all' || selectedMetric === 'rr') && (
            <span className="flex items-center gap-1.5 font-semibold text-purple-700">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
              Resp Rate (/min)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 border border-white shadow-2xs inline-block" />
            <span>Nurse Bedside Record</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 border border-white shadow-2xs inline-block" />
            <span>Doctor Round</span>
          </span>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="p-5">
        {chartPoints.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <Activity className="w-9 h-9 text-slate-300 mx-auto mb-2.5" />
            <h4 className="text-xs font-bold text-slate-700">No Vital Readings in Selected Range</h4>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              {timeRange === 'all'
                ? 'No vital observations or progress rounds have been recorded for this admission yet.'
                : `No vital observations found in the last ${timeRange.toUpperCase()}. Select "ALL" to view the full stay history.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* SVG Visualizer */}
            <div className="relative w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto min-w-[620px] select-none"
                style={{ maxHeight: '340px' }}
              >
                <defs>
                  <linearGradient id="normalBandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#f1f5f9" stopOpacity="0.4" />
                  </linearGradient>
                </defs>

                {/* Background Normal Band / Guide */}
                <rect
                  x={padLeft}
                  y={padTop + innerHeight * 0.25}
                  width={innerWidth}
                  height={innerHeight * 0.5}
                  fill="url(#normalBandGrad)"
                  rx="4"
                />

                {/* Horizontal reference grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                  const y = padTop + innerHeight * pct;
                  let tickLabel = null;
                  if (activeScale && activeScale.hasData) {
                    const tickVal = Math.round(activeScale.max - pct * (activeScale.max - activeScale.min));
                    tickLabel = `${tickVal}`;
                  }

                  return (
                    <g key={idx}>
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={padLeft + innerWidth}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray={pct === 1 ? 'none' : '3 3'}
                        strokeWidth={pct === 1 ? '1.5' : '1'}
                      />
                      {tickLabel && (
                        <text
                          x={padLeft - 8}
                          y={y + 3.5}
                          textAnchor="end"
                          fontSize="9"
                          fill="#64748b"
                          fontFamily="monospace"
                          fontWeight="600"
                        >
                          {tickLabel}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Y-Axis unit label if single metric is active */}
                {activeScale && (
                  <text
                    x={padLeft - 8}
                    y={padTop - 8}
                    textAnchor="end"
                    fontSize="9"
                    fill="#94a3b8"
                    fontWeight="700"
                  >
                    {activeScale.unit}
                  </text>
                )}

                {/* Vertical hover line indicator */}
                {hoveredPoint && (
                  <line
                    x1={getX(hoveredPoint.index, chartPoints.length)}
                    y1={padTop}
                    x2={getX(hoveredPoint.index, chartPoints.length)}
                    y2={padTop + innerHeight}
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    strokeWidth="1.5"
                  />
                )}

                {/* 1. Pulse Series (Rose) */}
                {(selectedMetric === 'all' || selectedMetric === 'pulse') && (
                  <path
                    d={buildSvgPath(chartPoints, p => p.pulse, getYPulse)}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* 2. BP Systolic Series (Indigo) */}
                {(selectedMetric === 'all' || selectedMetric === 'bp') && (
                  <path
                    d={buildSvgPath(chartPoints, p => p.systolic, getYSystolic)}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* 3. BP Diastolic Series (Sky Dashed) */}
                {(selectedMetric === 'all' || selectedMetric === 'bp') && (
                  <path
                    d={buildSvgPath(chartPoints, p => p.diastolic, getYDiastolic)}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* 4. Temperature Series (Amber) */}
                {(selectedMetric === 'all' || selectedMetric === 'temp') && (
                  <path
                    d={buildSvgPath(chartPoints, p => p.temp, getYTemp)}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* 5. SpO2 Series (Teal) */}
                {(selectedMetric === 'all' || selectedMetric === 'spo2') && (
                  <path
                    d={buildSvgPath(chartPoints, p => p.spo2, getYSpO2)}
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* 6. Respiratory Rate Series (Purple) */}
                {(selectedMetric === 'all' || selectedMetric === 'rr') && (
                  <path
                    d={buildSvgPath(chartPoints, p => p.rr, getYRR)}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Render distinct Data Points with Provenance shapes on the primary active line */}
                {chartPoints.map((pt, idx) => {
                  const x = getX(idx, chartPoints.length);
                  const isHovered = hoveredPoint?.id === pt.id;

                  // Find metric points available for this timestamp
                  const dots = [];
                  if ((selectedMetric === 'all' || selectedMetric === 'pulse') && pt.pulse !== null) {
                    dots.push({ y: getYPulse(pt.pulse), color: '#f43f5e' });
                  }
                  if ((selectedMetric === 'all' || selectedMetric === 'bp') && pt.systolic !== null) {
                    dots.push({ y: getYSystolic(pt.systolic), color: '#6366f1' });
                  }
                  if ((selectedMetric === 'all' || selectedMetric === 'bp') && pt.diastolic !== null) {
                    dots.push({ y: getYDiastolic(pt.diastolic), color: '#38bdf8' });
                  }
                  if ((selectedMetric === 'all' || selectedMetric === 'temp') && pt.temp !== null) {
                    dots.push({ y: getYTemp(pt.temp), color: '#f59e0b' });
                  }
                  if ((selectedMetric === 'all' || selectedMetric === 'spo2') && pt.spo2 !== null) {
                    dots.push({ y: getYSpO2(pt.spo2), color: '#14b8a6' });
                  }
                  if ((selectedMetric === 'all' || selectedMetric === 'rr') && pt.rr !== null) {
                    dots.push({ y: getYRR(pt.rr), color: '#a855f7' });
                  }

                  return (
                    <g
                      key={pt.id}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Generous invisible vertical touch/hover strip */}
                      <rect
                        x={x - (innerWidth / Math.max(1, chartPoints.length)) / 2}
                        y={padTop}
                        width={innerWidth / Math.max(1, chartPoints.length)}
                        height={innerHeight}
                        fill="transparent"
                      />

                      {/* Render each metric's dot */}
                      {dots.map((dot, dIdx) => {
                        if (dot.y === null) return null;
                        return pt.isNurse ? (
                          <circle
                            key={dIdx}
                            cx={x}
                            cy={dot.y}
                            r={isHovered ? 5.5 : 4}
                            fill={dot.color}
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="transition-all"
                          />
                        ) : (
                          <rect
                            key={dIdx}
                            x={x - (isHovered ? 5 : 3.5)}
                            y={dot.y - (isHovered ? 5 : 3.5)}
                            width={isHovered ? 10 : 7}
                            height={isHovered ? 10 : 7}
                            fill={dot.color}
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="transition-all"
                          />
                        );
                      })}

                      {/* X-Axis Timestamp Labels */}
                      <text
                        x={x}
                        y={padTop + innerHeight + 15}
                        textAnchor="middle"
                        fontSize="9"
                        fill={isHovered ? '#1e293b' : '#64748b'}
                        fontFamily="monospace"
                        fontWeight={isHovered ? '700' : '600'}
                      >
                        {pt.timeLabel}
                      </text>
                      <text
                        x={x}
                        y={padTop + innerHeight + 27}
                        textAnchor="middle"
                        fontSize="8"
                        fill="#94a3b8"
                      >
                        {pt.dateLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Hovered Observation Tooltip Card */}
            {hoveredPoint ? (
              <div className="p-3.5 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 border border-slate-200 rounded-2xl text-xs space-y-2 shadow-xs transition-all">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        hoveredPoint.isNurse
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {hoveredPoint.sourceType}
                    </span>
                    <span className="font-bold text-slate-800">{hoveredPoint.clinician}</span>
                  </div>
                  <span className="font-mono text-slate-500 text-[11px] font-semibold">
                    {hoveredPoint.dateLabel} at {hoveredPoint.timeLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-0.5 text-[11px]">
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Blood Pressure</span>
                    <strong className="text-slate-900 font-extrabold text-xs">
                      {hoveredPoint.systolic && hoveredPoint.diastolic
                        ? `${hoveredPoint.systolic}/${hoveredPoint.diastolic} mmHg`
                        : (hoveredPoint.systolic ? `${hoveredPoint.systolic}/— mmHg` : '—')}
                    </strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Pulse Rate</span>
                    <strong className="text-slate-900 font-extrabold text-xs">
                      {hoveredPoint.pulse !== null ? `${hoveredPoint.pulse} bpm` : '—'}
                    </strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Temperature</span>
                    <strong className="text-slate-900 font-extrabold text-xs">
                      {hoveredPoint.temp !== null ? `${hoveredPoint.temp}°${hoveredPoint.tempUnit}` : '—'}
                    </strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">SpO2 Level</span>
                    <strong className="text-slate-900 font-extrabold text-xs">
                      {hoveredPoint.spo2 !== null ? `${hoveredPoint.spo2}%` : '—'}
                    </strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Resp Rate</span>
                    <strong className="text-slate-900 font-extrabold text-xs">
                      {hoveredPoint.rr !== null ? `${hoveredPoint.rr}/min` : '—'}
                    </strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Glucose</span>
                    <strong className="text-slate-900 font-extrabold text-xs">
                      {hoveredPoint.glucose !== null ? `${hoveredPoint.glucose} mg/dL` : '—'}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 text-center text-[11px] text-slate-400">
                Hover over any timestamped observation point on the trajectory above to inspect recorded values and clinician provenance.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
