import React, { useState } from 'react';
import { Latex } from './Latex';
import { TrendingUp, Activity, AlertTriangle, ShieldCheck, Gauge, Flame, Waves } from 'lucide-react';

interface HeatExchangerGraphProps {
  steamInput: number; // 0 - 100%
  productFlow: number; // 10 - 100 kg/min
  tempOut: number;
  heatProcessGain: number;
}

interface ControlValveGraphProps {
  valveSignal: number; // 0 - 100%
  valveAuthority: number; // 0.05 - 1.0
  trimType: 'linear' | 'equalPercentage';
  installedFlowPercent: number;
  valveLocalGain: number;
}

interface PHTankGraphProps {
  reagentFlow: number; // 0 - 100%
  currentPH: number;
  phLocalGain: number;
  compensationType: 'standard' | 'notch' | 'adaptive';
  effectiveKc: number;
}

export type GraphDisplayMode = 'characteristics' | 'stepResponse';

export const MachineGraphs: React.FC<{
  machineType: 'heatExchanger' | 'controlValve' | 'pHTank';
  heatProps: HeatExchangerGraphProps;
  valveProps: ControlValveGraphProps;
  phProps: PHTankGraphProps;
}> = ({ machineType, heatProps, valveProps, phProps }) => {
  const [displayMode, setDisplayMode] = useState<GraphDisplayMode>('characteristics');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string } | null>(null);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
      {/* Graph Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <h3 className="font-semibold text-white text-sm">
            {machineType === 'heatExchanger' && 'Heat Exchanger Process Curves & Gain Analysis'}
            {machineType === 'controlValve' && 'Installed Flow Characteristic & Valve Gain (Kv) Curves'}
            {machineType === 'pHTank' && 'pH Titration Curve & Gain Compensation Profile'}
          </h3>
        </div>

        {/* View Mode Toggle */}
        <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs">
          <button
            onClick={() => setDisplayMode('characteristics')}
            className={`px-3 py-1 font-medium rounded-md transition-all ${
              displayMode === 'characteristics'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Static & Gain Curves
          </button>
          <button
            onClick={() => setDisplayMode('stepResponse')}
            className={`px-3 py-1 font-medium rounded-md transition-all ${
              displayMode === 'stepResponse'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dynamic Step Response (Time Domain)
          </button>
        </div>
      </div>

      {/* Render Machine Specific Graphs */}
      {machineType === 'heatExchanger' && (
        <HeatExchangerGraphsComponent
          displayMode={displayMode}
          props={heatProps}
          hoveredPoint={hoveredPoint}
          setHoveredPoint={setHoveredPoint}
        />
      )}

      {machineType === 'controlValve' && (
        <ControlValveGraphsComponent
          displayMode={displayMode}
          props={valveProps}
          hoveredPoint={hoveredPoint}
          setHoveredPoint={setHoveredPoint}
        />
      )}

      {machineType === 'pHTank' && (
        <PHTankGraphsComponent
          displayMode={displayMode}
          props={phProps}
          hoveredPoint={hoveredPoint}
          setHoveredPoint={setHoveredPoint}
        />
      )}
    </div>
  );
};

// =========================================================================
// 1. HEAT EXCHANGER GRAPHS
// =========================================================================

const HeatExchangerGraphsComponent: React.FC<{
  displayMode: GraphDisplayMode;
  props: HeatExchangerGraphProps;
  hoveredPoint: { x: number; y: number; label: string } | null;
  setHoveredPoint: (val: { x: number; y: number; label: string } | null) => void;
}> = ({ displayMode, props, hoveredPoint, setHoveredPoint }) => {
  const { steamInput, productFlow, tempOut, heatProcessGain } = props;

  // Temperature calculation helper
  const calcTemp = (co: number, flow: number) => {
    const qms = (co / 100) * 8.0;
    const qmp = Math.max(flow, 5);
    const dt = ((2257 / (qmp * 4.184)) * qms) * 0.15;
    return 20 + dt;
  };

  // Generate SVG polyline points for Tout vs Steam CO
  const makeTempCurve = (flow: number) => {
    const points: string[] = [];
    for (let co = 0; co <= 100; co += 5) {
      const t = calcTemp(co, flow);
      // Map CO [0, 100] to x [40, 280]
      const px = 40 + (co / 100) * 240;
      // Map Temp [20, 110] to y [190, 20]
      const py = 190 - ((t - 20) / 90) * 170;
      points.push(`${px},${py}`);
    }
    return points.join(' ');
  };

  // Generate Kp vs Product Flow curve
  const makeGainCurve = () => {
    const points: string[] = [];
    for (let flow = 10; flow <= 100; flow += 2) {
      const kp = (2257 / (flow * 4.184)) * 0.15;
      // Map Flow [10, 100] to x [40, 280]
      const px = 40 + ((flow - 10) / 90) * 240;
      // Map Kp [0, 2.5] to y [190, 20]
      const clampedKp = Math.min(2.5, kp);
      const py = 190 - (clampedKp / 2.5) * 170;
      points.push(`${px},${py}`);
    }
    return points.join(' ');
  };

  // Operating point coordinates on Tout graph
  const curPx = 40 + (steamInput / 100) * 240;
  const curPy = 190 - ((tempOut - 20) / 90) * 170;

  // Operating point coordinates on Kp vs Flow graph
  const gainPx = 40 + ((productFlow - 10) / 90) * 240;
  const gainPy = 190 - (Math.min(2.5, heatProcessGain) / 2.5) * 170;

  if (displayMode === 'characteristics') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Graph 1: Tout vs Steam Input */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200">
              Process Output <Latex math="T_{out}" /> vs Steam Valve (% CO)
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              Slope <Latex math="K_p = \Delta T / \Delta CO" />
            </span>
          </div>

          <svg viewBox="0 0 300 220" className="w-full h-48 select-none">
            {/* Grid & Axes */}
            <line x1="40" y1="20" x2="40" y2="190" stroke="#334155" strokeWidth="1" />
            <line x1="40" y1="190" x2="280" y2="190" stroke="#334155" strokeWidth="1" />

            {/* Horizontal guide lines */}
            {[40, 60, 80, 100].map((t) => {
              const y = 190 - ((t - 20) / 90) * 170;
              return (
                <g key={t}>
                  <line x1="40" y1={y} x2="280" y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x="35" y={y + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
                    {t}°C
                  </text>
                </g>
              );
            })}

            {/* Vertical guide lines */}
            {[25, 50, 75, 100].map((co) => {
              const x = 40 + (co / 100) * 240;
              return (
                <g key={co}>
                  <line x1={x} y1="20" x2={x} y2="190" stroke="#1e293b" strokeDasharray="3 3" />
                  <text x={x} y="202" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">
                    {co}%
                  </text>
                </g>
              );
            })}

            {/* Comparison Curves */}
            {/* Low flow (15 kg/min) - High slope */}
            <polyline fill="none" stroke="#f43f5e" strokeWidth="1.2" strokeDasharray="4 2" points={makeTempCurve(15)} opacity="0.6" />
            {/* High flow (85 kg/min) - Low slope */}
            <polyline fill="none" stroke="#0ea5e9" strokeWidth="1.2" strokeDasharray="4 2" points={makeTempCurve(85)} opacity="0.6" />
            {/* Active flow curve */}
            <polyline fill="none" stroke="#22d3ee" strokeWidth="2.5" points={makeTempCurve(productFlow)} />

            {/* Tangent slope line around active operating point */}
            <line
              x1={Math.max(40, curPx - 25)}
              y1={curPy + 25 * (heatProcessGain / 90) * 170 * (100 / 240)}
              x2={Math.min(280, curPx + 25)}
              y2={curPy - 25 * (heatProcessGain / 90) * 170 * (100 / 240)}
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="2 2"
            />

            {/* Active Operating Point Marker */}
            <circle cx={curPx} cy={curPy} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />

            {/* Axis titles */}
            <text x="160" y="215" fill="#94a3b8" fontSize="9" textAnchor="middle">
              Steam Valve Controller Output (% CO)
            </text>
            <text x="12" y="105" fill="#94a3b8" fontSize="9" textAnchor="middle" transform="rotate(-90 12 105)">
              Outlet Temp (°C)
            </text>
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" /> Current ({productFlow} kg/min)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-rose-400 border-dashed inline-block" /> Low Load (15 kg/min)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-sky-500 border-dashed inline-block" /> High Load (85 kg/min)
            </span>
            <span className="font-mono text-amber-400">
              PV: {tempOut.toFixed(1)}°C
            </span>
          </div>
        </div>

        {/* Graph 2: Process Gain Kp vs Product Flow */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200">
              Static Gain <Latex math="K_p" /> vs Product Throughput (<Latex math="q_{mp}" />)
            </span>
            <span className={`text-[11px] font-mono font-bold ${heatProcessGain > 1.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {heatProcessGain > 1.0 ? '⚠️ High Oscillation Risk' : '✓ Normal Damping'}
            </span>
          </div>

          <svg viewBox="0 0 300 220" className="w-full h-48 select-none">
            {/* Danger zone shading (Kp > 1.0) */}
            <rect
              x="40"
              y="20"
              width="240"
              height={190 - (1.0 / 2.5) * 170 - 20}
              fill="#ef4444"
              opacity="0.08"
            />
            <text x="160" y="45" fill="#f87171" fontSize="8" textAnchor="middle" opacity="0.6">
              CRITICAL INSTABILITY ZONE (Requires Kc Reduction)
            </text>

            {/* Grid & Axes */}
            <line x1="40" y1="20" x2="40" y2="190" stroke="#334155" strokeWidth="1" />
            <line x1="40" y1="190" x2="280" y2="190" stroke="#334155" strokeWidth="1" />

            {/* Horizontal guide lines */}
            {[0.5, 1.0, 1.5, 2.0].map((kp) => {
              const y = 190 - (kp / 2.5) * 170;
              return (
                <g key={kp}>
                  <line x1="40" y1={y} x2="280" y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x="35" y={y + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
                    {kp.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Vertical guide lines (Flow) */}
            {[20, 40, 60, 80, 100].map((f) => {
              const x = 40 + ((f - 10) / 90) * 240;
              return (
                <g key={f}>
                  <line x1={x} y1="20" x2={x} y2="190" stroke="#1e293b" strokeDasharray="3 3" />
                  <text x={x} y="202" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">
                    {f}
                  </text>
                </g>
              );
            })}

            {/* Hyperbolic curve Kp = const / flow */}
            <polyline fill="none" stroke="#f59e0b" strokeWidth="2.5" points={makeGainCurve()} />

            {/* Operating Point Marker */}
            <circle cx={gainPx} cy={gainPy} r="5" fill="#22d3ee" stroke="#ffffff" strokeWidth="1.5" />

            {/* Axis titles */}
            <text x="160" y="215" fill="#94a3b8" fontSize="9" textAnchor="middle">
              Liquid Product Flow Throughput (kg/min)
            </text>
            <text x="12" y="105" fill="#94a3b8" fontSize="9" textAnchor="middle" transform="rotate(-90 12 105)">
              Gain Kp (°C / % Steam)
            </text>
          </svg>

          {/* Readout strip */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span>Formula: <Latex math="K_p = \frac{h_{fg}}{q_{mp} \cdot C_p}" /></span>
            <span className="font-mono text-cyan-400">
              Current Gain: <strong className="text-white">{heatProcessGain.toFixed(2)}</strong> °C/%
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Time Domain Dynamic Step Response
  // Simulates loop response to a +10°C setpoint step change
  return (
    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          Closed Loop Step Response (Setpoint Step: 50°C → 60°C at t = 2s)
        </span>
        <span className="text-[11px] font-mono text-slate-400">
          Load: {productFlow} kg/min | Process Gain: {heatProcessGain.toFixed(2)}
        </span>
      </div>

      <svg viewBox="0 0 600 200" className="w-full h-52 select-none">
        {/* Axes */}
        <line x1="50" y1="20" x2="50" y2="170" stroke="#334155" strokeWidth="1" />
        <line x1="50" y1="170" x2="570" y2="170" stroke="#334155" strokeWidth="1" />

        {/* Setpoint Line (50 to 60 at t=2s) */}
        {/* Time 0 to 20s mapped to x: 50 to 570 */}
        <polyline
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          points="50,130 102,130 102,60 570,60"
        />
        <text x="565" y="55" fill="#94a3b8" fontSize="9" textAnchor="end">
          Setpoint (60°C)
        </text>

        {/* Response Curve calculation based on loop gain */}
        {/* Loop gain = Kc * Kp. Let default Kc = 2.0 */}
        {(() => {
          const points: string[] = [];
          const kLoop = 2.0 * heatProcessGain; // If kLoop > 2.0 -> underdamped / oscillatory; if > 3.2 -> persistent cycling
          const stepX = 102; // t = 2s

          for (let t = 0; t <= 20; t += 0.2) {
            const px = 50 + (t / 20) * 520;
            let temp = 50;

            if (t >= 2) {
              const dt = t - 2;
              if (kLoop < 1.0) {
                // Overdamped (sluggish at high flow)
                temp = 50 + 10 * (1 - Math.exp(-dt / 3.0));
              } else if (kLoop <= 2.2) {
                // Good Quarter Amplitude Damping (nominal flow)
                const wn = 1.2;
                const zeta = 0.5;
                temp = 50 + 10 * (1 - Math.exp(-zeta * wn * dt) * (Math.cos(wn * dt) + 0.3 * Math.sin(wn * dt)));
              } else {
                // Severe underdamped / oscillatory hunting (low flow high Kp)
                const wn = 1.6;
                const decay = Math.max(0.02, 0.45 - (kLoop - 2.2) * 0.15);
                temp = 50 + 10 * (1 - Math.exp(-decay * dt) * Math.cos(wn * dt));
              }
            }

            // Map temp 45 to 70°C to py: 170 to 20
            const py = 170 - ((temp - 45) / 25) * 150;
            points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
          }

          const strokeColor = kLoop > 2.2 ? '#f43f5e' : kLoop < 1.0 ? '#0ea5e9' : '#10b981';
          return (
            <polyline
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              points={points.join(' ')}
            />
          );
        })()}

        {/* Time axis marks */}
        {[0, 5, 10, 15, 20].map((sec) => {
          const x = 50 + (sec / 20) * 520;
          return (
            <g key={sec}>
              <line x1={x} y1="170" x2={x} y2="175" stroke="#64748b" />
              <text x={x} y="188" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                {sec}s
              </text>
            </g>
          );
        })}

        {/* Temp axis marks */}
        {[45, 50, 55, 60, 65].map((temp) => {
          const y = 170 - ((temp - 45) / 25) * 150;
          return (
            <g key={temp}>
              <line x1="45" y1={y} x2="50" y2={y} stroke="#64748b" />
              <text x="40" y={y + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                {temp}°
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
        <span className="flex items-center gap-1.5">
          {productFlow < 30 ? (
            <span className="text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Low flow causes excessive loop gain & ringing oscillations!
            </span>
          ) : productFlow > 70 ? (
            <span className="text-sky-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              High flow dilutes sensitivity, resulting in sluggish overdamped recovery.
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Nominal flow delivers ideal quarter-amplitude decay.
            </span>
          )}
        </span>
        <span className="font-mono text-cyan-400">Total Loop Gain: {(2.0 * heatProcessGain).toFixed(2)}</span>
      </div>
    </div>
  );
};

// =========================================================================
// 2. CONTROL VALVE GRAPHS
// =========================================================================

const ControlValveGraphsComponent: React.FC<{
  displayMode: GraphDisplayMode;
  props: ControlValveGraphProps;
  hoveredPoint: { x: number; y: number; label: string } | null;
  setHoveredPoint: (val: { x: number; y: number; label: string } | null) => void;
}> = ({ displayMode, props, hoveredPoint, setHoveredPoint }) => {
  const { valveSignal, valveAuthority, trimType, installedFlowPercent, valveLocalGain } = props;

  // Inherent phi
  const calcPhi = (sig: number, trim: 'linear' | 'equalPercentage') => {
    const x = sig / 100;
    if (trim === 'linear') return x;
    return x === 0 ? 0 : Math.pow(50, x - 1);
  };

  // Installed flow
  const calcInstalledFlow = (sig: number, trim: 'linear' | 'equalPercentage', dc: number) => {
    const phi = calcPhi(sig, trim);
    return Math.min(100, Math.max(0, (phi / Math.sqrt(dc + (1 - dc) * Math.pow(phi, 2))) * 100));
  };

  // Generate curves for SVG
  const makeFlowCurve = (trim: 'linear' | 'equalPercentage', dc: number) => {
    const points: string[] = [];
    for (let sig = 0; sig <= 100; sig += 2) {
      const q = calcInstalledFlow(sig, trim, dc);
      const px = 40 + (sig / 100) * 240;
      const py = 190 - (q / 100) * 170;
      points.push(`${px},${py}`);
    }
    return points.join(' ');
  };

  // Generate Inherent curve (pure bench test Dc = 1.0)
  const makeInherentCurve = (trim: 'linear' | 'equalPercentage') => {
    const points: string[] = [];
    for (let sig = 0; sig <= 100; sig += 2) {
      const q = calcInstalledFlow(sig, trim, 1.0);
      const px = 40 + (sig / 100) * 240;
      const py = 190 - (q / 100) * 170;
      points.push(`${px},${py}`);
    }
    return points.join(' ');
  };

  // Valve Gain Kv curve across stroke
  const makeGainCurve = (trim: 'linear' | 'equalPercentage', dc: number) => {
    const points: string[] = [];
    for (let sig = 1; sig <= 99; sig += 2) {
      const q1 = calcInstalledFlow(sig - 1, trim, dc);
      const q2 = calcInstalledFlow(sig + 1, trim, dc);
      const kv = Math.max(0, (q2 - q1) / 2); // local slope
      const px = 40 + (sig / 100) * 240;
      // Map Kv [0, 4.0] to y [190, 20]
      const py = 190 - (Math.min(4.0, kv) / 4.0) * 170;
      points.push(`${px},${py}`);
    }
    return points.join(' ');
  };

  // Active Operating coordinates
  const curPx = 40 + (valveSignal / 100) * 240;
  const curPy = 190 - (installedFlowPercent / 100) * 170;

  const curGainPx = 40 + (valveSignal / 100) * 240;
  const curGainPy = 190 - (Math.min(4.0, valveLocalGain) / 4.0) * 170;

  if (displayMode === 'characteristics') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Graph 1: Installed Flow vs Valve Stroke */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200">
              Installed Characteristic <Latex math="Q/Q_{\max}" /> vs Stroke (<Latex math="x" />)
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              Authority <Latex math="D_c" /> = {valveAuthority.toFixed(2)}
            </span>
          </div>

          <svg viewBox="0 0 300 220" className="w-full h-48 select-none">
            {/* Grid & Axes */}
            <line x1="40" y1="20" x2="40" y2="190" stroke="#334155" strokeWidth="1" />
            <line x1="40" y1="190" x2="280" y2="190" stroke="#334155" strokeWidth="1" />

            {/* Reference 1:1 diagonal */}
            <line x1="40" y1="190" x2="280" y2="20" stroke="#475569" strokeDasharray="2 2" strokeWidth="1" />

            {/* Horizontal guide lines */}
            {[25, 50, 75, 100].map((q) => {
              const y = 190 - (q / 100) * 170;
              return (
                <g key={q}>
                  <line x1="40" y1={y} x2="280" y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x="35" y={y + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
                    {q}%
                  </text>
                </g>
              );
            })}

            {/* Vertical guide lines */}
            {[25, 50, 75, 100].map((sig) => {
              const x = 40 + (sig / 100) * 240;
              return (
                <g key={sig}>
                  <line x1={x} y1="20" x2={x} y2="190" stroke="#1e293b" strokeDasharray="3 3" />
                  <text x={x} y="202" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">
                    {sig}%
                  </text>
                </g>
              );
            })}

            {/* Inherent Curve (dashed gray) */}
            <polyline fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" points={makeInherentCurve(trimType)} />

            {/* Installed Curve (cyan solid) */}
            <polyline fill="none" stroke="#06b6d4" strokeWidth="2.5" points={makeFlowCurve(trimType, valveAuthority)} />

            {/* Active Marker */}
            <circle cx={curPx} cy={curPy} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />

            {/* Axis titles */}
            <text x="160" y="215" fill="#94a3b8" fontSize="9" textAnchor="middle">
              Valve Stem Travel (% Lift x)
            </text>
            <text x="12" y="105" fill="#94a3b8" fontSize="9" textAnchor="middle" transform="rotate(-90 12 105)">
              Flow Rate (% Q)
            </text>
          </svg>

          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" /> Installed Curve (<Latex math="D_c" />={valveAuthority.toFixed(2)})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-slate-500 border-dashed inline-block" /> Inherent Bench Curve
            </span>
            <span className="font-mono text-amber-400">
              Flow: {installedFlowPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Graph 2: Valve Gain Kv vs Stroke */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200">
              Installed Valve Gain <Latex math="K_v = \Delta Q / \Delta x" />
            </span>
            <span className={`text-[11px] font-mono font-bold ${valveLocalGain > 2.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {valveLocalGain > 2.0 ? '⚠️ High Seat Sensitivity' : '✓ Controlled Slope'}
            </span>
          </div>

          <svg viewBox="0 0 300 220" className="w-full h-48 select-none">
            {/* Ideal constant gain target band (0.5 to 1.5) */}
            <rect
              x="40"
              y={190 - (1.5 / 4.0) * 170}
              width="240"
              height={(1.0 / 4.0) * 170}
              fill="#10b981"
              opacity="0.12"
            />
            <text x="160" y={190 - (1.0 / 4.0) * 170 + 3} fill="#10b981" fontSize="8" textAnchor="middle" opacity="0.8">
              IDEAL STABLE GAIN BAND (0.5 ≤ Kv ≤ 1.5)
            </text>

            {/* Danger zone (Kv > 2.5) */}
            <rect
              x="40"
              y="20"
              width="240"
              height={190 - (2.5 / 4.0) * 170 - 20}
              fill="#ef4444"
              opacity="0.08"
            />

            {/* Grid & Axes */}
            <line x1="40" y1="20" x2="40" y2="190" stroke="#334155" strokeWidth="1" />
            <line x1="40" y1="190" x2="280" y2="190" stroke="#334155" strokeWidth="1" />

            {/* Horizontal guide lines */}
            {[1.0, 2.0, 3.0, 4.0].map((kv) => {
              const y = 190 - (kv / 4.0) * 170;
              return (
                <g key={kv}>
                  <line x1="40" y1={y} x2="280" y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x="35" y={y + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
                    {kv.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Vertical guide lines */}
            {[25, 50, 75, 100].map((sig) => {
              const x = 40 + (sig / 100) * 240;
              return (
                <g key={sig}>
                  <line x1={x} y1="20" x2={x} y2="190" stroke="#1e293b" strokeDasharray="3 3" />
                  <text x={x} y="202" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">
                    {sig}%
                  </text>
                </g>
              );
            })}

            {/* Kv Curve */}
            <polyline fill="none" stroke="#f59e0b" strokeWidth="2.5" points={makeGainCurve(trimType, valveAuthority)} />

            {/* Operating Point */}
            <circle cx={curGainPx} cy={curGainPy} r="5" fill="#22d3ee" stroke="#ffffff" strokeWidth="1.5" />

            {/* Axis titles */}
            <text x="160" y="215" fill="#94a3b8" fontSize="9" textAnchor="middle">
              Valve Travel (% Stroke)
            </text>
            <text x="12" y="105" fill="#94a3b8" fontSize="9" textAnchor="middle" transform="rotate(-90 12 105)">
              Valve Gain Kv (ΔQ / Δx)
            </text>
          </svg>

          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span>
              {trimType === 'linear' && valveAuthority < 0.5
                ? 'Linear trim low Dc creates steep Kv at low lift!'
                : 'Equal % trim offsets line friction to flatten Kv.'}
            </span>
            <span className="font-mono text-cyan-400">
              Current Kv: <strong className="text-white">{valveLocalGain.toFixed(2)}</strong>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Time Domain Step Response for Control Valve
  return (
    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          Flow Loop Transient Response to Flow Setpoint Step (5% Step at t = 2s)
        </span>
        <span className="text-[11px] font-mono text-slate-400">
          Trim: {trimType === 'linear' ? 'Linear' : 'Equal %'} | Distortion Dc: {valveAuthority.toFixed(2)} | Kv: {valveLocalGain.toFixed(2)}
        </span>
      </div>

      <svg viewBox="0 0 600 200" className="w-full h-52 select-none">
        <line x1="50" y1="20" x2="50" y2="170" stroke="#334155" strokeWidth="1" />
        <line x1="50" y1="170" x2="570" y2="170" stroke="#334155" strokeWidth="1" />

        {/* Target Step */}
        <polyline
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          points="50,120 102,120 102,60 570,60"
        />
        <text x="565" y="55" fill="#94a3b8" fontSize="9" textAnchor="end">
          Flow Setpoint SP
        </text>

        {/* Response Curve simulation */}
        {(() => {
          const points: string[] = [];
          // If Kv > 2.5: violent hunting/limit cycling near low lift
          // If Kv in 0.6 - 1.6: crisp fast settling (flow loops are naturally fast)
          // If Kv < 0.4: sluggish slow opening
          const stepX = 102;
          for (let t = 0; t <= 20; t += 0.2) {
            const px = 50 + (t / 20) * 520;
            let val = 40; // baseline %

            if (t >= 2) {
              const dt = t - 2;
              if (valveLocalGain > 2.2) {
                // High gain hunting
                const freq = 2.4;
                const decay = 0.08;
                val = 40 + 10 * (1 - Math.exp(-decay * dt) * Math.cos(freq * dt));
              } else if (valveLocalGain < 0.5) {
                // Sluggish
                val = 40 + 10 * (1 - Math.exp(-dt / 4.0));
              } else {
                // Optimal quarter decay
                val = 40 + 10 * (1 - Math.exp(-1.4 * dt) * Math.cos(2.0 * dt));
              }
            }

            const py = 120 - ((val - 40) / 10) * 60;
            points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
          }

          const strokeColor = valveLocalGain > 2.2 ? '#f43f5e' : valveLocalGain < 0.5 ? '#0ea5e9' : '#10b981';
          return (
            <polyline
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              points={points.join(' ')}
            />
          );
        })()}

        {/* Time axis */}
        {[0, 5, 10, 15, 20].map((sec) => {
          const x = 50 + (sec / 20) * 520;
          return (
            <g key={sec}>
              <line x1={x} y1="170" x2={x} y2="175" stroke="#64748b" />
              <text x={x} y="188" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                {sec}s
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
        <span>
          {valveLocalGain > 2.2 ? (
            <span className="text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Valve stem hunting! Excessive installed gain near the seat causes cycling.
            </span>
          ) : valveLocalGain < 0.5 ? (
            <span className="text-sky-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Low valve sensitivity creates sluggish flow response.
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Uniform installed gain maintains rapid, stable flow regulation.
            </span>
          )}
        </span>
        <span className="font-mono text-cyan-400">Operating Travel: {valveSignal}%</span>
      </div>
    </div>
  );
};

// =========================================================================
// 3. PH TANK GRAPHS
// =========================================================================

const PHTankGraphsComponent: React.FC<{
  displayMode: GraphDisplayMode;
  props: PHTankGraphProps;
  hoveredPoint: { x: number; y: number; label: string } | null;
  setHoveredPoint: (val: { x: number; y: number; label: string } | null) => void;
}> = ({ displayMode, props, hoveredPoint, setHoveredPoint }) => {
  const { reagentFlow, currentPH, phLocalGain, compensationType, effectiveKc } = props;

  // pH function
  const calcPH = (rFlow: number) => {
    const rNorm = (rFlow - 50) / 50;
    return Math.min(13.8, Math.max(0.2, 7 + Math.sinh(rNorm * 4.2) * 1.6));
  };

  // Generate Titration S-Curve
  const makeTitrationCurve = () => {
    const points: string[] = [];
    for (let r = 0; r <= 100; r += 1) {
      const ph = calcPH(r);
      const px = 40 + (r / 100) * 240;
      const py = 190 - (ph / 14) * 170;
      points.push(`${px},${py}`);
    }
    return points.join(' ');
  };

  // Generate Process Gain Kp vs Reagent Flow curve
  const makeGainCurve = () => {
    const points: string[] = [];
    for (let r = 1; r <= 99; r += 1) {
      const ph1 = calcPH(r - 0.5);
      const ph2 = calcPH(r + 0.5);
      const kp = Math.abs(ph2 - ph1); // slope per %
      const px = 40 + (r / 100) * 240;
      const py = 190 - (Math.min(10, kp) / 10) * 170;
      points.push(`${px},${py}`);
    }
    return points.join(' ');
  };

  // Generate Controller Gain Kc curve across reagent flow
  const makeKcCurve = () => {
    const points: string[] = [];
    for (let r = 0; r <= 100; r += 2) {
      const ph = calcPH(r);
      let kc = 2.0;
      if (compensationType === 'notch') {
        kc = ph >= 6.0 && ph <= 8.0 ? 0.4 : 2.5;
      } else if (compensationType === 'adaptive') {
        const ph1 = calcPH(r - 0.5);
        const ph2 = calcPH(r + 0.5);
        const localKp = Math.max(0.5, Math.abs(ph2 - ph1));
        kc = Math.max(0.2, 4.0 / localKp);
      }
      const px = 40 + (r / 100) * 240;
      const py = 190 - (Math.min(4.0, kc) / 4.0) * 170;
      points.push(`${px},${py}`);
    }
    return points.join(' ');
  };

  // Active operating coordinates
  const curPx = 40 + (reagentFlow / 100) * 240;
  const curPy = 190 - (currentPH / 14) * 170;

  if (displayMode === 'characteristics') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Graph 1: Titration S-Curve */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200">
              pH Titration S-Curve (<Latex math="\text{pH} = -\log_{10}[H^+]" />)
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              Equivalence at 50%
            </span>
          </div>

          <svg viewBox="0 0 300 220" className="w-full h-48 select-none">
            {/* Notch Zone Shade (pH 6 to 8) */}
            <rect
              x="40"
              y={190 - (8 / 14) * 170}
              width="240"
              height={(2 / 14) * 170}
              fill="#10b981"
              opacity="0.12"
            />
            <text x="275" y={190 - (7 / 14) * 170 + 3} fill="#10b981" fontSize="7" textAnchor="end" opacity="0.8">
              NOTCH BAND (pH 6-8)
            </text>

            {/* Grid & Axes */}
            <line x1="40" y1="20" x2="40" y2="190" stroke="#334155" strokeWidth="1" />
            <line x1="40" y1="190" x2="280" y2="190" stroke="#334155" strokeWidth="1" />

            {/* Horizontal guide lines (pH) */}
            {[2, 4, 7, 10, 12, 14].map((ph) => {
              const y = 190 - (ph / 14) * 170;
              return (
                <g key={ph}>
                  <line x1="40" y1={y} x2="280" y2={y} stroke={ph === 7 ? '#059669' : '#1e293b'} strokeDasharray={ph === 7 ? 'none' : '3 3'} />
                  <text x="35" y={y + 3} fill={ph === 7 ? '#10b981' : '#64748b'} fontSize="8" textAnchor="end" fontFamily="monospace">
                    {ph}
                  </text>
                </g>
              );
            })}

            {/* Vertical guide lines */}
            {[25, 50, 75, 100].map((r) => {
              const x = 40 + (r / 100) * 240;
              return (
                <g key={r}>
                  <line x1={x} y1="20" x2={x} y2="190" stroke="#1e293b" strokeDasharray="3 3" />
                  <text x={x} y="202" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">
                    {r}%
                  </text>
                </g>
              );
            })}

            {/* Titration Curve */}
            <polyline fill="none" stroke="#38bdf8" strokeWidth="2.5" points={makeTitrationCurve()} />

            {/* Operating Point */}
            <circle cx={curPx} cy={curPy} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />

            {/* Axis titles */}
            <text x="160" y="215" fill="#94a3b8" fontSize="9" textAnchor="middle">
              Reagent Neutralizer Flow (% Stroke)
            </text>
            <text x="12" y="105" fill="#94a3b8" fontSize="9" textAnchor="middle" transform="rotate(-90 12 105)">
              Effluent pH
            </text>
          </svg>

          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-sky-400 inline-block" /> Titration Curve
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2 bg-emerald-500/20 inline-block border border-emerald-500/40" /> Notch Band
            </span>
            <span className="font-mono text-amber-400">
              pH: {currentPH.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Graph 2: Process Gain vs Controller Gain */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200">
              Sensitivity <Latex math="K_p" /> & Controller Gain <Latex math="K_c" />
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              Algorithm: {compensationType.toUpperCase()}
            </span>
          </div>

          <svg viewBox="0 0 300 220" className="w-full h-48 select-none">
            {/* Grid & Axes */}
            <line x1="40" y1="20" x2="40" y2="190" stroke="#334155" strokeWidth="1" />
            <line x1="40" y1="190" x2="280" y2="190" stroke="#334155" strokeWidth="1" />

            {/* Guide lines */}
            {[1, 2, 3, 4].map((gVal) => {
              const y = 190 - (gVal / 4.0) * 170;
              return (
                <g key={gVal}>
                  <line x1="40" y1={y} x2="280" y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x="35" y={y + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
                    {gVal}
                  </text>
                </g>
              );
            })}

            {[25, 50, 75, 100].map((r) => {
              const x = 40 + (r / 100) * 240;
              return (
                <g key={r}>
                  <line x1={x} y1="20" x2={x} y2="190" stroke="#1e293b" strokeDasharray="3 3" />
                  <text x={x} y="202" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">
                    {r}%
                  </text>
                </g>
              );
            })}

            {/* Process Gain Kp (rose) */}
            <polyline fill="none" stroke="#f43f5e" strokeWidth="1.8" strokeDasharray="3 2" points={makeGainCurve()} />

            {/* Controller Gain Kc (emerald) */}
            <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={makeKcCurve()} />

            {/* Marker for Kc */}
            <circle
              cx={curPx}
              cy={190 - (Math.min(4.0, effectiveKc) / 4.0) * 170}
              r="5"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="1.5"
            />

            {/* Axis titles */}
            <text x="160" y="215" fill="#94a3b8" fontSize="9" textAnchor="middle">
              Reagent Valve (% Stroke)
            </text>
            <text x="12" y="105" fill="#94a3b8" fontSize="9" textAnchor="middle" transform="rotate(-90 12 105)">
              Gain Magnitude
            </text>
          </svg>

          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-rose-400 border-dashed inline-block" /> Process Gain <Latex math="K_p" />
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> Controller Gain <Latex math="K_c" />
            </span>
            <span className="font-mono text-emerald-400">
              Active Kc: {effectiveKc.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Time Domain Step Response for pH loop
  return (
    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          pH Dynamic Recovery from Acid Inflow Spike at t = 2s
        </span>
        <span className="text-[11px] font-mono text-slate-400">
          Compensation: {compensationType.toUpperCase()} | Effective Kc: {effectiveKc.toFixed(2)}
        </span>
      </div>

      <svg viewBox="0 0 600 200" className="w-full h-52 select-none">
        <line x1="50" y1="20" x2="50" y2="170" stroke="#334155" strokeWidth="1" />
        <line x1="50" y1="170" x2="570" y2="170" stroke="#334155" strokeWidth="1" />

        {/* Setpoint (pH 7.0 target) */}
        <line x1="50" y1="95" x2="570" y2="95" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
        <text x="565" y="90" fill="#10b981" fontSize="9" textAnchor="end">
          Setpoint SP = 7.00
        </text>

        {/* Response Curve simulation */}
        {(() => {
          const points: string[] = [];
          for (let t = 0; t <= 20; t += 0.2) {
            const px = 50 + (t / 20) * 520;
            let phVal = 7.0;

            if (t >= 2) {
              const dt = t - 2;
              if (compensationType === 'standard') {
                // Violent limit cycle oscillation around neutrality
                phVal = 7.0 - 2.8 * Math.exp(-0.04 * dt) * Math.cos(2.2 * dt);
              } else if (compensationType === 'notch') {
                // Fast recovery outside notch, calm inside notch
                phVal = 7.0 - 2.5 * Math.exp(-0.7 * dt) * Math.cos(1.0 * dt);
              } else {
                // Adaptive smooth critical damping
                phVal = 7.0 - 2.5 * Math.exp(-1.1 * dt);
              }
            }

            // Map pH [3 to 11] to py [170 to 20]
            const py = 170 - ((phVal - 3) / 8) * 150;
            points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
          }

          const strokeColor = compensationType === 'standard' ? '#f43f5e' : '#10b981';
          return (
            <polyline
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              points={points.join(' ')}
            />
          );
        })()}

        {/* Time axis */}
        {[0, 5, 10, 15, 20].map((sec) => {
          const x = 50 + (sec / 20) * 520;
          return (
            <g key={sec}>
              <line x1={x} y1="170" x2={x} y2="175" stroke="#64748b" />
              <text x={x} y="188" fill="#64748b" fontSize="9" textAnchor="middle" fontFamily="monospace">
                {sec}s
              </text>
            </g>
          );
        })}

        {/* pH axis */}
        {[3, 5, 7, 9, 11].map((p) => {
          const y = 170 - ((p - 3) / 8) * 150;
          return (
            <g key={p}>
              <line x1="45" y1={y} x2="50" y2={y} stroke="#64748b" />
              <text x="40" y={y + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                {p}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
        <span>
          {compensationType === 'standard' ? (
            <span className="text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Standard PID causes sustained limit-cycle oscillation between acid and base!
            </span>
          ) : compensationType === 'notch' ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Notch filter calms hunting inside ±1.0 pH band while maintaining fast upset response.
            </span>
          ) : (
            <span className="text-cyan-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Adaptive gain continuously normalizes open-loop gain to yield smooth critical damping.
            </span>
          )}
        </span>
        <span className="font-mono text-cyan-400">Setpoint: 7.00 pH</span>
      </div>
    </div>
  );
};
