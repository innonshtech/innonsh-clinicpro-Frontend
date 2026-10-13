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
  CheckCircle2
} from 'lucide-react';

/**
 * VitalsTrendChart
 * Compact historical trend chart for IPD patient vitals.
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

  // Helper to compute min/max scaling for a metric
  const getScale = (accessor, defaultMin, defaultMax) => {
    const valid = chartPoints.map(accessor).filter(val => val !== null && !isNaN(val));
    if (valid.length === 0) return { min: defaultMin, max: defaultMax, hasData: false };
    const minVal = Math.min(...valid);
    const maxVal = Math.max(...valid);
    const padding = (maxVal - minVal) * 0.15 || 5;
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

  const pulseScale = useMemo(() => getScale(p => p.pulse, 40, 150), [chartPoints]);
  const tempScale = useMemo(() => getScale(p => p.temp, 35, 41), [chartPoints]);
  const spo2Scale = useMemo(() => getScale(p => p.spo2, 85, 100), [chartPoints]);
  const rrScale = useMemo(() => getScale(p => p.rr, 10, 35), [chartPoints]);

  // SVG Chart dimensions
  const chartWidth = 720;
  const chartHeight = 220;
  const padLeft = 45;
  const padRight = 25;
  const padTop = 20;
  const padBottom = 35;
  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = chartHeight - padTop - padBottom;

  const getX = (index, total) => {
    if (total <= 1) return padLeft + innerWidth / 2;
    return padLeft + (index / (total - 1)) * innerWidth;
  };

  const getY = (val, scale) => {
    if (val === null || scale.max === scale.min) return null;
    const ratio = (val - scale.min) / (scale.max - scale.min);
    return padTop + innerHeight - ratio * innerHeight;
  };

  // Build SVG path for valid points without connecting to zero
  const buildSvgPath = (points, accessor, scale) => {
    let d = '';
    let isDrawing = false;

    points.forEach((pt, idx) => {
      const val = accessor(pt);
      if (val === null) {
        isDrawing = false; // Missing measurement: do NOT drop to zero, lift pen
        return;
      }
      const x = getX(idx, points.length);
      const y = getY(val, scale);
      if (y === null) return;

      if (!isDrawing) {
        d += `M ${x.toFixed(1)} ${y.toFixed(1)} `;
        isDrawing = true;
      } else {
        d += `L ${x.toFixed(1)} ${y.toFixed(1)} `;
      }
    });

    return d;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header with Filters */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              Vital Signs Trend Analysis
            </h3>
            <p className="text-[11px] text-slate-500">
              Chronological plotted trajectory across bedside observations & clinical rounds
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time range selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs text-[11px] font-semibold text-slate-600">
            <span className="px-2 text-slate-400 text-[10px] flex items-center gap-1">
              <Clock className="w-3 h-3" /> Time Range:
            </span>
            {['24h', '48h', '7d', 'all'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timeRange === r
                    ? 'bg-blue-600 text-white font-bold'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Metric Filter */}
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
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

      {/* Provenance Legend */}
      <div className="px-5 py-2 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 text-[11px]">
        <div className="flex items-center gap-4 text-slate-600 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 border border-purple-200 inline-block" />
            <strong className="text-purple-800">Nurse Observation</strong> (Bedside Record)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 border border-blue-200 inline-block" />
            <strong className="text-blue-800">Doctor Round</strong> (Clinical Progress Note)
          </span>
        </div>
        <div className="text-slate-400 text-[10px] italic">
          * Missing readings remain absent and are never charted as zero
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="p-5">
        {chartPoints.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-700">No Vital Readings in Selected Range</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
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
                className="w-full h-auto min-w-[560px] select-none"
                style={{ maxHeight: '280px' }}
              >
                {/* Horizontal reference grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                  const y = padTop + innerHeight * pct;
                  return (
                    <line
                      key={idx}
                      x1={padLeft}
                      y1={y}
                      x2={padLeft + innerWidth}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* X-Axis baseline */}
                <line
                  x1={padLeft}
                  y1={padTop + innerHeight}
                  x2={padLeft + innerWidth}
                  y2={padTop + innerHeight}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />

                {/* Plot: Blood Pressure (Systolic & Diastolic) */}
                {(selectedMetric === 'all' || selectedMetric === 'bp') && bpScale.hasData && (
                  <>
                    {/* Systolic Line */}
                    <path
                      d={buildSvgPath(chartPoints, p => p.systolic, bpScale)}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    {/* Diastolic Line */}
                    <path
                      d={buildSvgPath(chartPoints, p => p.diastolic, bpScale)}
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      strokeLinecap="round"
                    />
                  </>
                )}

                {/* Plot: Pulse (Heart Rate) */}
                {(selectedMetric === 'all' || selectedMetric === 'pulse') && pulseScale.hasData && (
                  <path
                    d={buildSvgPath(chartPoints, p => p.pulse, pulseScale)}
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}

                {/* Plot: Temperature */}
                {(selectedMetric === 'all' || selectedMetric === 'temp') && tempScale.hasData && (
                  <path
                    d={buildSvgPath(chartPoints, p => p.temp, tempScale)}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}

                {/* Plot: SpO2 */}
                {(selectedMetric === 'all' || selectedMetric === 'spo2') && spo2Scale.hasData && (
                  <path
                    d={buildSvgPath(chartPoints, p => p.spo2, spo2Scale)}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}

                {/* Plot: Respiratory Rate */}
                {(selectedMetric === 'rr') && rrScale.hasData && (
                  <path
                    d={buildSvgPath(chartPoints, p => p.rr, rrScale)}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}

                {/* Data Points with Provenance Shapes */}
                {chartPoints.map((pt, idx) => {
                  const x = getX(idx, chartPoints.length);

                  // Calculate primary Y for dot placement based on current view
                  let primaryVal = null;
                  let primaryScale = bpScale;
                  if (selectedMetric === 'pulse') { primaryVal = pt.pulse; primaryScale = pulseScale; }
                  else if (selectedMetric === 'temp') { primaryVal = pt.temp; primaryScale = tempScale; }
                  else if (selectedMetric === 'spo2') { primaryVal = pt.spo2; primaryScale = spo2Scale; }
                  else if (selectedMetric === 'rr') { primaryVal = pt.rr; primaryScale = rrScale; }
                  else {
                    // All: prioritize systolic or pulse
                    primaryVal = pt.systolic !== null ? pt.systolic : (pt.pulse !== null ? pt.pulse : (pt.temp !== null ? pt.temp : pt.spo2));
                    primaryScale = pt.systolic !== null ? bpScale : (pt.pulse !== null ? pulseScale : (pt.temp !== null ? tempScale : spo2Scale));
                  }

                  const y = getY(primaryVal, primaryScale);
                  if (y === null) return null;

                  const isHovered = hoveredPoint?.id === pt.id;

                  return (
                    <g
                      key={pt.id}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {/* Interactive Target */}
                      <circle cx={x} cy={y} r="10" fill="transparent" />

                      {/* Nurse Observation: Circle; Doctor Round: Square/Diamond */}
                      {pt.isNurse ? (
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered ? 5.5 : 4}
                          fill="#8b5cf6"
                          stroke="#ffffff"
                          strokeWidth="1.8"
                          className="transition-all"
                        />
                      ) : (
                        <rect
                          x={x - (isHovered ? 5 : 3.5)}
                          y={y - (isHovered ? 5 : 3.5)}
                          width={isHovered ? 10 : 7}
                          height={isHovered ? 10 : 7}
                          fill="#2563eb"
                          stroke="#ffffff"
                          strokeWidth="1.8"
                          className="transition-all"
                        />
                      )}

                      {/* X-Axis Timestamp Label */}
                      <text
                        x={x}
                        y={padTop + innerHeight + 14}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#64748b"
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {pt.timeLabel}
                      </text>
                      <text
                        x={x}
                        y={padTop + innerHeight + 25}
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

            {/* Hovered / Selected Detail Card */}
            {hoveredPoint ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        hoveredPoint.isNurse
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {hoveredPoint.sourceType}
                    </span>
                    <span className="font-semibold text-slate-800">{hoveredPoint.clinician}</span>
                  </div>
                  <span className="font-mono text-slate-500 text-[11px]">
                    {hoveredPoint.dateLabel} • {hoveredPoint.timeLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 text-[11px] font-mono">
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Blood Pressure</span>
                    <strong className="text-slate-900 font-bold">
                      {hoveredPoint.systolic && hoveredPoint.diastolic
                        ? `${hoveredPoint.systolic}/${hoveredPoint.diastolic} mmHg`
                        : (hoveredPoint.systolic ? `${hoveredPoint.systolic}/— mmHg` : 'Not recorded')}
                    </strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Pulse / HR</span>
                    <strong className="text-slate-900 font-bold">
                      {hoveredPoint.pulse !== null ? `${hoveredPoint.pulse} bpm` : 'Not recorded'}
                    </strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block uppercase">Body Temp</span>
                    <strong className="text-slate-900 font-bold">
                      {hoveredPoint.temp !== null ? `${hoveredPoint.temp}°${hoveredPoint.tempUnit}` : 'Not recorded'}
                    </strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block uppercase">SpO2 Level</span>
                    <strong className="text-slate-900 font-bold">
                      {hoveredPoint.spo2 !== null ? `${hoveredPoint.spo2}%` : 'Not recorded'}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 text-center text-[11px] text-slate-400">
                Hover over any timestamped point on the trajectory above to inspect recorded values and clinician provenance.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
