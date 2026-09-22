import React from 'react';
import { Latex } from './Latex';
import { BookOpen, AlertTriangle, ShieldCheck, Flame, GitCommit, Check } from 'lucide-react';

export const StudyReference: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          ILM Module 310305cB Technical Study Guide & Cheat Sheet
        </h2>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <span>Closed Loop Control — Part B: Nonlinear Control Loops</span>
          <span aria-hidden="true">·</span>
          <span>Alberta Apprenticeship & Industry Training</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Linear vs Nonlinear Definitions */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
            1. Linear vs. Nonlinear Definitions
          </div>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <li>
              <strong>Linear System:</strong> The static gain <Latex math="K_p = \frac{\Delta PV}{\Delta CO}" /> is completely constant across all operating ranges. A single set of PID parameters (<Latex math="K_c, T_i, T_d" />) provides identical quarter-wave decay response whether running at 10% or 90% load.
            </li>
            <li>
              <strong>Nonlinear System:</strong> The static gain <Latex math="K_p" /> varies depending on operating point, throughput, or disturbance level. A controller tuned at one operating point either becomes wildly unstable (oscillates) or extremely sluggish when the plant moves to another point.
            </li>
            <li>
              <strong>Total Loop Gain Criterion:</strong> For stable control, overall loop gain <Latex math="K_{loop} = K_c \cdot K_v \cdot K_p \cdot K_t" /> must remain bounded and relatively constant.
            </li>
          </ul>
        </div>

        {/* Card 2: Heat Exchanger Dynamics */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
            <Flame className="w-4 h-4" />
            2. Heat Exchanger Flow-Gain Relationship
          </div>
          <p className="text-xs text-slate-300">
            Steady-state energy balance for steam shell-and-tube or plate heater:
          </p>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
            <Latex block math="T_{out} = \left( \frac{h_{fg}}{q_{mp} \cdot C_p} \right) q_{ms} + T_{in}" />
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
            <li>
              <strong className="text-amber-300">Low Process Throughput (<Latex math="q_{mp}" />):</strong> Process gain <Latex math="K_p" /> spikes high. A small steam burst creates a huge temperature spike. High risk of cycling.
            </li>
            <li>
              <strong className="text-amber-300">High Process Throughput (<Latex math="q_{mp}" />):</strong> Process gain drops low. System becomes sluggish.
            </li>
            <li>
              <strong>Adaptive Solution:</strong> Program controller gain proportional to throughput: <Latex math="K_c = K_{c0} \cdot (q_{mp} / q_{mp0})" />.
            </li>
          </ul>
        </div>

        {/* Card 3: Installed Valve Trim & Authority */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
            <GitCommit className="w-4 h-4" />
            3. Control Valve Inherent vs. Installed
          </div>
          <p className="text-xs text-slate-300">
            Distortion coefficient (valve authority <Latex math="D_c" />) measures the ratio of valve drop to total system drop:
          </p>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
            <Latex block math="D_c = \frac{\Delta P_{\text{valve, 100\%}}}{\Delta P_{\text{valve, 100\%}} + \Delta P_{\text{pipe, 100\%}}}" />
          </div>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
            <li>
              <strong>Linear Trim with Low <Latex math="D_c" />:</strong> Distorts into <em>Quick-Opening</em>. Causes severe low-end instability and hunting.
            </li>
            <li>
              <strong>Equal % Trim with Low <Latex math="D_c" />:</strong> Compensates for piping friction drop, yielding an almost perfectly <em>Linear</em> installed characteristic.
            </li>
            <li>
              <strong>Rule of Thumb:</strong> When piping friction accounts for &gt; 50% of loop drop (<Latex math="D_c < 0.5" />), specify Equal Percentage trim.
            </li>
          </ul>
        </div>

        {/* Card 4: pH and Notch Control */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            4. pH Titration & Notch Compensation
          </div>
          <p className="text-xs text-slate-300">
            Logarithmic concentration relationship: <Latex math="\text{pH} = -\log_{10}[H^+]" /> creates extreme static gain at equivalence (pH 7.0).
          </p>
          <ul className="text-xs text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-mono text-cyan-400 text-xs">A.</span>
              <span>
                <strong>Multipoint Characterizer:</strong> Maps controller output through an inverse S-curve before driving the reagent dosing valve.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-cyan-400 text-xs">B.</span>
              <span>
                <strong>Notch / Dual-Gain Controller:</strong> Uses low gain <Latex math="K_{c1}" /> within a tight tolerance band (e.g., pH 6.0 to 8.0) and high gain <Latex math="K_{c2}" /> outside the band.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-cyan-400 text-xs">C.</span>
              <span>
                <strong>Multi-Stage Neutralization:</strong> Industrial installations divide strong neutralizers into 2 or 3 sequential continuous-stirred tank reactors (CSTR) to step pH gradually.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
