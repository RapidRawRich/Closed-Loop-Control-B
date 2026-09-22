import React, { useState } from 'react';
import { Latex } from './Latex';
import { Sliders, Cpu, Activity, ArrowRight, HelpCircle, Check, RotateCcw } from 'lucide-react';

export const SolutionsLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'characterizer' | 'gainScheduling' | 'notchFilter'>('characterizer');

  // 1. Multipoint Characterizer State
  // 5 point curve mapping X (Controller Output) to Y (Valve Position)
  const [charPoints, setCharPoints] = useState<number[]>([0, 15, 38, 68, 100]); // at X = [0, 25, 50, 75, 100]
  const [testInputX, setTestInputX] = useState<number>(50);

  // Linear interpolation for characterizer
  const interpolateY = (xVal: number) => {
    const xNodes = [0, 25, 50, 75, 100];
    for (let i = 0; i < 4; i++) {
      if (xVal >= xNodes[i] && xVal <= xNodes[i + 1]) {
        const t = (xVal - xNodes[i]) / (xNodes[i + 1] - xNodes[i]);
        return charPoints[i] + t * (charPoints[i + 1] - charPoints[i]);
      }
    }
    return xVal;
  };
  const interpolatedY = interpolateY(testInputX);

  // 2. Gain Scheduling State
  // 3 Operating Zones: Low Load (0-30%), Medium Load (30-70%), High Load (70-100%)
  const [loadValue, setLoadValue] = useState<number>(45);
  const [zone1Gain, setZone1Gain] = useState<number>(3.5);
  const [zone2Gain, setZone2Gain] = useState<number>(2.0);
  const [zone3Gain, setZone3Gain] = useState<number>(1.2);

  let currentZone = 2;
  let activeGain = zone2Gain;
  if (loadValue < 30) {
    currentZone = 1;
    activeGain = zone1Gain;
  } else if (loadValue > 70) {
    currentZone = 3;
    activeGain = zone3Gain;
  }

  // 3. Notch Filter / Non-linear Error-Squared Gain State
  const [errorInput, setErrorInput] = useState<number>(0.2); // pH units error (-3 to +3)
  const [notchWidth, setNotchWidth] = useState<number>(1.0); // band ±1.0 pH
  const [notchAttenuation, setNotchAttenuation] = useState<number>(0.3); // gain multiplier inside band (0.1 to 0.8)
  const baseKc = 3.0;

  const isInsideNotch = Math.abs(errorInput) <= notchWidth;
  const effectiveNotchKc = isInsideNotch ? baseKc * notchAttenuation : baseKc;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Nonlinear Compensation Solutions Lab
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>ILM Objective Three</span>
            <span aria-hidden="true">·</span>
            <span>Multipoint Characterizers</span>
            <span aria-hidden="true">·</span>
            <span>Gain Scheduling & Notch Algorithms</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('characterizer')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'characterizer'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Multipoint Characterizer f(x)
          </button>
          <button
            onClick={() => setActiveTab('gainScheduling')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'gainScheduling'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Gain Scheduling
          </button>
          <button
            onClick={() => setActiveTab('notchFilter')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'notchFilter'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Notch & Error-Band Gain
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* TAB 1: MULTIPOINT CHARACTERIZER f(x)                       */}
      {/* ========================================================== */}
      {activeTab === 'characterizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Interactive Graph / Curve Display */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-cyan-400" />
                Characterizer Transfer Function: <Latex math="y = f(x)" />
              </h3>
              <button
                onClick={() => setCharPoints([0, 15, 38, 68, 100])}
                className="text-[11px] flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset Inverse Equal %
              </button>
            </div>

            {/* SVG Visual Graph */}
            <div className="relative w-full h-[280px] bg-slate-950 rounded-lg border border-slate-800 p-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="0" y1="25" x2="100" y2="25" stroke="#1e293b" strokeDasharray="2" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeDasharray="2" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="#1e293b" strokeDasharray="2" vectorEffect="non-scaling-stroke" />
                <line x1="25" y1="0" x2="25" y2="100" stroke="#1e293b" strokeDasharray="2" vectorEffect="non-scaling-stroke" />
                <line x1="50" y1="0" x2="50" y2="100" stroke="#1e293b" strokeDasharray="2" vectorEffect="non-scaling-stroke" />
                <line x1="75" y1="0" x2="75" y2="100" stroke="#1e293b" strokeDasharray="2" vectorEffect="non-scaling-stroke" />

                {/* Linear 1:1 Reference Diagonal */}
                <line x1="0" y1="100" x2="100" y2="0" stroke="#475569" strokeDasharray="3" strokeWidth="1" vectorEffect="non-scaling-stroke" />

                {/* Characterizer Spline Path */}
                {(() => {
                  const pointsStr = [0, 25, 50, 75, 100]
                    .map((xVal, idx) => `${xVal},${100 - charPoints[idx]}`)
                    .join(' ');
                  return (
                    <polyline
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                      points={pointsStr}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })()}

                {/* Node Circles */}
                {[0, 25, 50, 75, 100].map((xVal, idx) => (
                  <circle
                    key={idx}
                    cx={xVal}
                    cy={100 - charPoints[idx]}
                    r="4"
                    fill="#38bdf8"
                    stroke="#0f172a"
                    strokeWidth="1.5"
                    className="cursor-pointer"
                  />
                ))}

                {/* Current Test Point Indicator */}
                <circle
                  cx={testInputX}
                  cy={100 - interpolatedY}
                  r="6"
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </svg>

              {/* Graph Axis Labels */}
              <div className="absolute bottom-1 left-4 right-4 flex justify-between text-[10px] font-mono text-slate-500">
                <span>0% Input X</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100% Input X</span>
              </div>
            </div>

            {/* Test Simulation Runner */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Controller Output (<Latex math="X" />)</span>
                <span className="font-mono text-amber-400 font-bold">{testInputX}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={testInputX}
                onChange={(e) => setTestInputX(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex items-center justify-between text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400">Characterized Valve Command (<Latex math="Y = f(X)" />):</span>
                <span className="font-mono text-cyan-400 font-bold text-sm">{interpolatedY.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Right: Breakpoint Table & Theory */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="font-semibold text-white text-sm">Characterizer Lookup Table (5-Point)</h3>
            <p className="text-xs text-slate-400">
              Drag or adjust breakpoint values to build an inverse transfer curve that straightens out your loop's installed characteristic.
            </p>

            <div className="space-y-3">
              {[0, 25, 50, 75, 100].map((xVal, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-xs font-mono text-slate-400 w-16">X = {xVal}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={charPoints[idx]}
                    disabled={idx === 0 || idx === 4} // Pin endpoints at 0% and 100%
                    onChange={(e) => {
                      const newPts = [...charPoints];
                      newPts[idx] = Number(e.target.value);
                      setCharPoints(newPts);
                    }}
                    className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                  />
                  <span className="text-xs font-mono text-cyan-300 w-12 text-right">
                    Y = {charPoints[idx]}%
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-cyan-950/20 border border-cyan-800/40 p-3 rounded-lg text-xs space-y-1.5 text-slate-300">
              <div className="font-semibold text-cyan-400">How ILM 310305cB Explains This:</div>
              <p>
                When a process has a nonlinear gain <Latex math="K_p(u)" />, placing a characterizer block <Latex math="f(x)" /> with gain <Latex math="K_{char} = 1 / K_p(u)" /> in series produces an overall constant loop gain:
              </p>
              <div className="text-center py-1">
                <Latex block math="K_{\text{effective}} = K_{\text{char}} \cdot K_p = \text{Constant}" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: GAIN SCHEDULING                                     */}
      {/* ========================================================== */}
      {activeTab === 'gainScheduling' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Gain Scheduling Zone Selector
            </h3>

            {/* Load Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Auxiliary Measured Variable / Plant Load</span>
                <span className="font-mono text-cyan-400 font-bold">{loadValue}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={loadValue}
                onChange={(e) => setLoadValue(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0% (Zone 1)</span>
                <span>30%</span>
                <span>70%</span>
                <span>100% (Zone 3)</span>
              </div>
            </div>

            {/* Zone Map Visual */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div
                className={`p-3 rounded-lg border text-center transition-all ${
                  currentZone === 1
                    ? 'bg-amber-950/40 border-amber-500 text-amber-200 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-xs font-semibold">Zone 1 (0 - 30%)</div>
                <div className="text-lg font-mono font-bold mt-1 text-white">Kc = {zone1Gain.toFixed(1)}</div>
                <div className="text-[10px] text-slate-400 mt-1">Low Process Gain Regime</div>
              </div>

              <div
                className={`p-3 rounded-lg border text-center transition-all ${
                  currentZone === 2
                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-xs font-semibold">Zone 2 (30 - 70%)</div>
                <div className="text-lg font-mono font-bold mt-1 text-white">Kc = {zone2Gain.toFixed(1)}</div>
                <div className="text-[10px] text-slate-400 mt-1">Nominal Design Point</div>
              </div>

              <div
                className={`p-3 rounded-lg border text-center transition-all ${
                  currentZone === 3
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-xs font-semibold">Zone 3 (70 - 100%)</div>
                <div className="text-lg font-mono font-bold mt-1 text-white">Kc = {zone3Gain.toFixed(1)}</div>
                <div className="text-[10px] text-slate-400 mt-1">High Sensitivity Regime</div>
              </div>
            </div>

            {/* Active Output */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Current Active Controller Gain:</div>
                <div className="text-sm font-semibold text-white">Zone {currentZone} PID Setting</div>
              </div>
              <div className="text-2xl font-mono font-bold text-cyan-400">{activeGain.toFixed(2)}</div>
            </div>
          </div>

          {/* Right: Tuning Parameters Table */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="font-semibold text-white text-sm">Zone Schedule Configuration</h3>
            <p className="text-xs text-slate-400">
              Customize the proportional gain for each region based on plant identification tests.
            </p>

            <div className="space-y-3">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Zone 1 Gain (Low Load)</span>
                  <span className="font-mono text-amber-400">{zone1Gain}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6.0"
                  step="0.1"
                  value={zone1Gain}
                  onChange={(e) => setZone1Gain(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Zone 2 Gain (Mid Load)</span>
                  <span className="font-mono text-cyan-400">{zone2Gain}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6.0"
                  step="0.1"
                  value={zone2Gain}
                  onChange={(e) => setZone2Gain(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Zone 3 Gain (High Load)</span>
                  <span className="font-mono text-emerald-400">{zone3Gain}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6.0"
                  step="0.1"
                  value={zone3Gain}
                  onChange={(e) => setZone3Gain(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-1 border-t border-slate-800 pt-3">
              <div className="font-semibold text-white">Application Note:</div>
              <p>
                Commonly deployed on boiler feed-water loops, pH neutralizers, and compressor antisurge systems where the scheduling variable is an auxiliary measured flow or power reading.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 3: NOTCH FILTER & ERROR-BAND GAIN                     */}
      {/* ========================================================== */}
      {activeTab === 'notchFilter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Notch / Error-Squared Gain Simulator
            </h3>

            {/* Error Input Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Control Error (<Latex math="e = SP - PV" />)</span>
                <span className="font-mono text-cyan-400 font-bold">{errorInput > 0 ? `+${errorInput.toFixed(2)}` : errorInput.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-2.5"
                max="2.5"
                step="0.05"
                value={errorInput}
                onChange={(e) => setErrorInput(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-2.5 (Severe Negative Error)</span>
                <span>0.0 (On Setpoint)</span>
                <span>+2.5 (Severe Positive Error)</span>
              </div>
            </div>

            {/* Visual Notch Gain Profile */}
            <div className="relative w-full h-[220px] bg-slate-950 rounded-lg border border-slate-800 p-4">
              <svg className="w-full h-full overflow-visible" viewBox="-3 0 6 4" preserveAspectRatio="none">
                {/* Horizontal Baseline */}
                <line x1="-3" y1="3.5" x2="3" y2="3.5" stroke="#1e293b" strokeWidth="0.05" />

                {/* Notch Region Shade */}
                <rect
                  x={-notchWidth}
                  y="0.5"
                  width={notchWidth * 2}
                  height="3.0"
                  fill="#065f46"
                  opacity="0.25"
                />

                {/* Gain Profile Polyline */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="0.08"
                  points={`
                    -3,0.8
                    ${-notchWidth},0.8
                    ${-notchWidth},${0.8 + (1 - notchAttenuation) * 2.2}
                    ${notchWidth},${0.8 + (1 - notchAttenuation) * 2.2}
                    ${notchWidth},0.8
                    3,0.8
                  `}
                />

                {/* Current Operating Point Marker */}
                <circle
                  cx={errorInput}
                  cy={isInsideNotch ? 0.8 + (1 - notchAttenuation) * 2.2 : 0.8}
                  r="0.15"
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth="0.04"
                />
              </svg>

              <div className="absolute top-2 right-3 text-[11px] font-mono text-emerald-400">
                Green Shaded = Attenuated Notch Band (±{notchWidth} pH)
              </div>
            </div>

            {/* Readout */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400">Current Notch Status</div>
                <div className={`text-base font-bold mt-1 ${isInsideNotch ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {isInsideNotch ? 'Inside Notch (Attenuated)' : 'Outside Notch (Full Gain)'}
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400">Effective Controller Gain (<Latex math="K_c^{\text{eff}}" />)</div>
                <div className="text-2xl font-mono font-bold text-white mt-0.5">{effectiveNotchKc.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Right: Notch Tuning Settings */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="font-semibold text-white text-sm">Notch Parameters</h3>

            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Notch Half-Width (<Latex math="\pm W" />)</span>
                  <span className="font-mono text-cyan-400">±{notchWidth.toFixed(1)} units</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.1"
                  value={notchWidth}
                  onChange={(e) => setNotchWidth(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Gain Attenuation Multiplier</span>
                  <span className="font-mono text-emerald-400">{notchAttenuation.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={notchAttenuation}
                  onChange={(e) => setNotchAttenuation(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                />
                <div className="text-[10px] text-slate-500">
                  Reduces gain to {(notchAttenuation * 100).toFixed(0)}% of nominal when within tolerance.
                </div>
              </div>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-800/40 p-3 rounded-lg text-xs space-y-1.5 text-slate-300">
              <div className="font-semibold text-emerald-400">Why this cures pH hunting:</div>
              <p>
                Near the equivalence point (pH 7.0), strong acid-base titration exhibits infinite theoretical gain. A standard controller over-reacts to micro-fluctuations. The notch filter calms the valve down near setpoint, while providing aggressive kick if a huge slug of acid upsets the reactor.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
