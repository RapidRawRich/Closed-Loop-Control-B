import React, { useState } from 'react';
import { Latex } from './Latex';
import { IndustrialScene3D } from './IndustrialScene3D';
import { MachineGraphs } from './MachineGraphs';
import { Gauge, Sliders, Activity, Info, Flame, GitCommit, Waves, BarChart2 } from 'lucide-react';

export const ProcessVisualizer: React.FC = () => {
  const [activeMachine, setActiveMachine] = useState<'heatExchanger' | 'controlValve' | 'pHTank'>('heatExchanger');
  
  // Heat Exchanger Simulation state
  const [steamInput, setSteamInput] = useState<number>(50); // % Controller Output
  const [productFlow, setProductFlow] = useState<number>(45); // kg/min throughput
  
  // Control Valve Simulation state
  const [valveSignal, setValveSignal] = useState<number>(40); // % Controller Output
  const [valveAuthority, setValveAuthority] = useState<number>(0.3); // Distortion coefficient Dc (0.1 to 1.0)
  const [trimType, setTrimType] = useState<'linear' | 'equalPercentage'>('linear');

  // pH Neutralization Tank state
  const [reagentFlow, setReagentFlow] = useState<number>(50); // % Valve Opening (0-100%)
  const [compensationType, setCompensationType] = useState<'standard' | 'notch' | 'adaptive'>('standard');

  // 1. Heat Exchanger Physics
  // Formula: Tout = Tin + (h_fg / (q_mp * Cp)) * q_ms
  // Let Tin = 20 C, h_fg = 2257 kJ/kg, Cp = 4.184 kJ/kg.C
  // Steam flow q_ms = (steamInput / 100) * 8.0 kg/min
  const q_ms = (steamInput / 100) * 8.0;
  const q_mp = Math.max(productFlow, 5); // avoid divide by zero
  const deltaT = ((2257 / (q_mp * 4.184)) * q_ms) * 0.15; // scaled for realistic 20 - 95 C range
  const tempOut = 20 + deltaT;
  // Local static gain Kp = dTout / dq_ms ∝ 1 / q_mp
  const heatProcessGain = (2257 / (q_mp * 4.184)) * 0.15;

  // 2. Control Valve Installed Flow Characteristic
  // Inherent:
  // Linear: phi(x) = x
  // Equal %: phi(x) = R^(x - 1), where R = 50
  const x = valveSignal / 100;
  let phi = x;
  if (trimType === 'equalPercentage') {
    phi = x === 0 ? 0 : Math.pow(50, x - 1);
  }
  // Installed flow equation: Q/Qmax = phi(x) / sqrt(Dc + (1 - Dc) * phi(x)^2)
  const installedFlowPercent = Math.min(
    100,
    Math.max(
      0,
      (phi / Math.sqrt(valveAuthority + (1 - valveAuthority) * Math.pow(phi, 2))) * 100
    )
  );
  
  // Installed Valve Gain Kv = dQ / dx (calculated numerically)
  const xSmallDelta = 0.01;
  const xHigh = Math.min(1.0, x + xSmallDelta);
  let phiHigh = xHigh;
  if (trimType === 'equalPercentage') phiHigh = Math.pow(50, xHigh - 1);
  const flowHigh = (phiHigh / Math.sqrt(valveAuthority + (1 - valveAuthority) * Math.pow(phiHigh, 2))) * 100;
  const valveLocalGain = Math.max(0.01, (flowHigh - installedFlowPercent) / (xSmallDelta * 100));

  // 3. pH Titration Curve & Neutralization
  // Standard strong acid / strong base titration curve
  // Equivalence at reagent = 50%
  // pH = 7 + (1/0.6) * asinh((reagentFlow - 50) * 1.5)
  const reagentNormalized = (reagentFlow - 50) / 50; // -1 to +1
  // Sharp logarithmic inflection near reagentFlow = 50%
  const currentPH = Math.min(13.8, Math.max(0.2, 7 + Math.sinh(reagentNormalized * 4.2) * 1.6));
  
  // pH local process gain: slope dPH / dReagent
  const reagentHigh = reagentFlow + 0.5;
  const rHighNorm = (reagentHigh - 50) / 50;
  const phHigh = Math.min(13.8, Math.max(0.2, 7 + Math.sinh(rHighNorm * 4.2) * 1.6));
  const phLocalGain = Math.abs((phHigh - currentPH) / 0.5);

  // Controller Gain Kc adjustment based on selected compensation
  let effectiveKc = 2.0;
  if (compensationType === 'notch') {
    // Notch filter drops gain by 70% in the pH 6.0 - 8.0 zone
    const isInsideNotch = currentPH >= 6.0 && currentPH <= 8.0;
    effectiveKc = isInsideNotch ? 0.4 : 2.5;
  } else if (compensationType === 'adaptive') {
    // Adaptive inversely scales Kc according to local process gain
    effectiveKc = Math.max(0.1, 4.0 / Math.max(0.5, phLocalGain));
  }

  return (
    <div className="space-y-6">
      {/* Header bar & Machine Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Interactive 3D Machine Laboratory
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Module 310305cB</span>
            <span aria-hidden="true">·</span>
            <span>Nonlinear Dynamics & Gain Compensation</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-cyan-400">WebGL 3D Sim</span>
          </div>
        </div>

        {/* Machine Selector Tabs */}
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setActiveMachine('heatExchanger')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeMachine === 'heatExchanger'
                ? 'bg-cyan-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Steam Heat Exchanger
          </button>
          <button
            onClick={() => setActiveMachine('controlValve')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeMachine === 'controlValve'
                ? 'bg-cyan-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            Installed Valve Trim
          </button>
          <button
            onClick={() => setActiveMachine('pHTank')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeMachine === 'pHTank'
                ? 'bg-cyan-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            pH Neutralization Reactor
          </button>
        </div>
      </div>

      {/* Main Grid: Left = 3D Model & Realtime HUD, Right = Interactive Controls & Math */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 3D Visualizer Viewport */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="h-[430px] w-full">
            <IndustrialScene3D
              machineType={activeMachine}
              operatingPoint={
                activeMachine === 'heatExchanger'
                  ? steamInput
                  : activeMachine === 'controlValve'
                  ? valveSignal
                  : reagentFlow
              }
              flowRate={productFlow}
              pHValue={currentPH}
              distortionCoeff={valveAuthority}
            />
          </div>

          {/* Realtime Instrumentation Readout Bar */}
          <div className="grid grid-cols-3 gap-3">
            {activeMachine === 'heatExchanger' && (
              <>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-xs text-slate-400">Steam Input (CO)</div>
                  <div className="text-xl font-mono font-bold text-amber-400 mt-1">{steamInput.toFixed(1)}%</div>
                  <div className="text-[11px] text-slate-500">Flow: {q_ms.toFixed(2)} kg/min</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-xs text-slate-400">Process Temp (PV)</div>
                  <div className="text-xl font-mono font-bold text-cyan-400 mt-1">{tempOut.toFixed(1)} °C</div>
                  <div className="text-[11px] text-slate-500">Inlet: 20.0 °C fixed</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-xs text-slate-400">Local Gain (<Latex math="K_p" />)</div>
                  <div className="text-xl font-mono font-bold text-emerald-400 mt-1">{heatProcessGain.toFixed(2)}</div>
                  <div className="text-[11px] text-slate-500">°C / % Steam Valve</div>
                </div>
              </>
            )}

            {activeMachine === 'controlValve' && (
              <>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-xs text-slate-400">Controller Signal (CO)</div>
                  <div className="text-xl font-mono font-bold text-amber-400 mt-1">{valveSignal.toFixed(1)}%</div>
                  <div className="text-[11px] text-slate-500">Stem Travel: {valveSignal.toFixed(0)}%</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-xs text-slate-400">Installed Flow (Q)</div>
                  <div className="text-xl font-mono font-bold text-cyan-400 mt-1">{installedFlowPercent.toFixed(1)}%</div>
                  <div className="text-[11px] text-slate-500">Capacity of full span</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-xs text-slate-400">Installed Valve Gain (<Latex math="K_v" />)</div>
                  <div className="text-xl font-mono font-bold text-emerald-400 mt-1">{valveLocalGain.toFixed(2)}</div>
                  <div className="text-[11px] text-slate-500">Slope: ΔQ / ΔCO</div>
                </div>
              </>
            )}

            {activeMachine === 'pHTank' && (
              <>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-xs text-slate-400">Reagent Valve (CO)</div>
                  <div className="text-xl font-mono font-bold text-amber-400 mt-1">{reagentFlow.toFixed(1)}%</div>
                  <div className="text-[11px] text-slate-500">Neutral setpoint = 50%</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-xs text-slate-400">Effluent pH (PV)</div>
                  <div className="text-xl font-mono font-bold text-cyan-400 mt-1">{currentPH.toFixed(2)}</div>
                  <div className="text-[11px] text-slate-500">{currentPH < 6 ? 'Acidic' : currentPH > 8 ? 'Basic' : 'Neutral Zone'}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
                  <div className="text-xs text-slate-400">Controller Gain (<Latex math="K_c" />)</div>
                  <div className="text-xl font-mono font-bold text-emerald-400 mt-1">{effectiveKc.toFixed(2)}</div>
                  <div className="text-[11px] text-slate-500">Compensation Active</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Interactive Controls & Physics Analysis */}
        <div className="lg:col-span-5 space-y-5">
          {/* ======================= HEAT EXCHANGER CONTROLS ======================= */}
          {activeMachine === 'heatExchanger' && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">Heat Exchanger Dynamics</h3>
              </div>

              {/* Formula Card */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="text-xs text-slate-400">Governing Energy Balance (ILM Module 310305cB):</div>
                <div className="text-center py-1">
                  <Latex
                    block
                    math="T_{out} = \left( \frac{h_{fg}}{q_{mp} \cdot C_p} \right) q_{ms} + T_{in} \implies K_p = \frac{\Delta T_{out}}{\Delta q_{ms}} \propto \frac{1}{q_{mp}}"
                  />
                </div>
              </div>

              {/* Slider 1: Steam Valve (CO) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Steam Control Valve Position</span>
                  <span className="font-mono text-cyan-400">{steamInput}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={steamInput}
                  onChange={(e) => setSteamInput(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0% (Closed)</span>
                  <span>50%</span>
                  <span>100% (Full Steam)</span>
                </div>
              </div>

              {/* Slider 2: Product Flow Throughput (Disturbance / Load) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Product Liquid Flow (<Latex math="q_{mp}" />)</span>
                  <span className="font-mono text-amber-400">{productFlow} kg/min</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="2"
                  value={productFlow}
                  onChange={(e) => setProductFlow(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>10 kg/min (Low Flow = High Kp)</span>
                  <span>100 kg/min (High Flow = Low Kp)</span>
                </div>
              </div>

              {/* Quick Scenarios */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-medium">Quick Quiz Scenarios:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => { setProductFlow(15); setSteamInput(35); }}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-rose-400 transition"
                  >
                    Low Flow Surge
                  </button>
                  <button
                    onClick={() => { setProductFlow(45); setSteamInput(50); }}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-slate-300 transition"
                  >
                    Design Nominal
                  </button>
                  <button
                    onClick={() => { setProductFlow(85); setSteamInput(75); }}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-sky-400 transition"
                  >
                    High Load (Low Kp)
                  </button>
                </div>
              </div>

              {/* Key Concept Callout */}
              <div className="bg-amber-950/20 border border-amber-800/30 p-3 rounded-lg text-xs space-y-1 text-slate-300">
                <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                  <Info className="w-4 h-4" />
                  Exam Takeaway: Process Gain vs Throughput
                </div>
                <p>
                  As fluid flow rate <span className="font-mono text-amber-300">q_mp</span> drops, the heat exchanger's static gain <span className="font-mono text-cyan-300">Kp</span> spikes upward. If controller gain <span className="font-mono text-emerald-300">Kc</span> is left unadjusted at low throughput, the loop becomes underdamped and oscillates violently. Solution: <strong>Adaptive Gain Control</strong> where <Latex math="K_c \propto q_{mp}" />.
                </p>
              </div>
            </div>
          )}

          {/* ======================= CONTROL VALVE CONTROLS ======================= */}
          {activeMachine === 'controlValve' && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Gauge className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-white">Installed Valve Authority & Trim</h3>
              </div>

              {/* Trim Selector */}
              <div className="space-y-1.5">
                <div className="text-xs text-slate-400 font-medium">Inherent Plug Characterization:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTrimType('linear')}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                      trimType === 'linear'
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Linear Trim (<Latex math="\phi = x" />)
                  </button>
                  <button
                    onClick={() => setTrimType('equalPercentage')}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                      trimType === 'equalPercentage'
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Equal % Trim (<Latex math="\phi = 50^{x-1}" />)
                  </button>
                </div>
              </div>

              {/* Valve Signal Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Controller Output to Valve (CO)</span>
                  <span className="font-mono text-cyan-400">{valveSignal}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={valveSignal}
                  onChange={(e) => setValveSignal(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Distortion Coeff / Valve Authority Slider */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Distortion Coefficient (<Latex math="D_c" /> / Authority)</span>
                  <span className="font-mono text-amber-400">{valveAuthority.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={valveAuthority}
                  onChange={(e) => setValveAuthority(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.05 (High Line Loss / Heavy Distortion)</span>
                  <span>1.0 (Zero Line Loss / Pure Bench Curve)</span>
                </div>
              </div>

              {/* Quick Scenarios */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-medium">Quick Quiz Scenarios:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => { setTrimType('linear'); setValveAuthority(0.15); setValveSignal(15); }}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-rose-400 transition"
                  >
                    Linear + Low Dc
                  </button>
                  <button
                    onClick={() => { setTrimType('equalPercentage'); setValveAuthority(0.25); setValveSignal(50); }}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-emerald-400 transition"
                  >
                    = % Compensation
                  </button>
                  <button
                    onClick={() => { setValveAuthority(1.0); }}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-cyan-400 transition"
                  >
                    Pure Bench (Dc=1)
                  </button>
                </div>
              </div>

              {/* Formula & Impact */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-400">Installed Characteristic Equation:</div>
                <div className="text-center py-1">
                  <Latex
                    block
                    math="\frac{Q}{Q_{max}} = \frac{\phi(x)}{\sqrt{D_c + (1 - D_c)\phi(x)^2}}"
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  {trimType === 'linear' && valveAuthority < 0.5 ? (
                    <span className="text-rose-400 font-semibold">
                      Notice: Linear trim at low authority behaves like Quick-Opening! Tremendous gain near 0-25% lift causes valve cycling.
                    </span>
                  ) : trimType === 'equalPercentage' && valveAuthority < 0.5 ? (
                    <span className="text-emerald-400 font-semibold">
                      Notice: Line pressure drop bends equal percentage trim into a remarkably straight, linear installed curve!
                    </span>
                  ) : (
                    <span>Ideal factory bench conditions with pure constant ΔP.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================= PH REACTOR CONTROLS ======================= */}
          {activeMachine === 'pHTank' && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Waves className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white">pH Titration Curve & Notch Filter</h3>
              </div>

              {/* Reagent Valve Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Reagent Neutralizer Dosing Valve</span>
                  <span className="font-mono text-cyan-400">{reagentFlow}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={reagentFlow}
                  onChange={(e) => setReagentFlow(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0% (Strong Acid pH &lt; 2)</span>
                  <span>50% (Equivalence pH 7.0)</span>
                  <span>100% (Caustic pH &gt; 12)</span>
                </div>
              </div>

              {/* Compensation Method Selector */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium">Nonlinear Control Algorithm:</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setCompensationType('standard')}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all text-center ${
                      compensationType === 'standard'
                        ? 'bg-rose-950/50 border-rose-500 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Standard PID
                  </button>
                  <button
                    onClick={() => setCompensationType('notch')}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all text-center ${
                      compensationType === 'notch'
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Notch Controller
                  </button>
                  <button
                    onClick={() => setCompensationType('adaptive')}
                    className={`py-2 px-2 text-xs font-medium rounded-lg border transition-all text-center ${
                      compensationType === 'adaptive'
                        ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    Adaptive Gain
                  </button>
                </div>
              </div>

              {/* Quick Scenarios */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-medium">Quick Quiz Scenarios:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => { setReagentFlow(20); }}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-rose-400 transition"
                  >
                    Acid Spill (pH &lt; 3)
                  </button>
                  <button
                    onClick={() => { setReagentFlow(50); }}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-emerald-400 transition"
                  >
                    Equivalence (pH 7.0)
                  </button>
                  <button
                    onClick={() => { setReagentFlow(80); }}
                    className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] text-cyan-400 transition"
                  >
                    Alkaline Peak
                  </button>
                </div>
              </div>

              {/* Explanation Card */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Process Sensitivity (<Latex math="K_p = \Delta\text{pH}/\Delta\text{Reagent}" />):</span>
                  <span className={`font-mono font-bold ${phLocalGain > 5 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {phLocalGain > 5 ? 'High (Spike at pH 7)' : 'Low (Buffered Zone)'}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  {compensationType === 'notch' && (
                    <p className="text-emerald-400">
                      Notch Filter Active: Within pH 6.0 to 8.0, the controller gain drops to <span className="font-mono">Kc = 0.40</span> to prevent limit-cycle hunting!
                    </p>
                  )}
                  {compensationType === 'standard' && (
                    <p className="text-rose-400">
                      Standard Constant Gain: If tuned for pH 3, the loop oscillates violently at pH 7. If tuned for pH 7, it takes hours to recover from acid spills!
                    </p>
                  )}
                  {compensationType === 'adaptive' && (
                    <p className="text-cyan-400">
                      Adaptive Inverse Gain: Controller gain continuously scales as <Latex math="K_c \propto 1/K_p" /> to keep total loop gain invariant!
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Process Characteristic & Stability Graphs */}
      <MachineGraphs
        machineType={activeMachine}
        heatProps={{
          steamInput,
          productFlow,
          tempOut,
          heatProcessGain,
        }}
        valveProps={{
          valveSignal,
          valveAuthority,
          trimType,
          installedFlowPercent,
          valveLocalGain,
        }}
        phProps={{
          reagentFlow,
          currentPH,
          phLocalGain,
          compensationType,
          effectiveKc,
        }}
      />
    </div>
  );
};
