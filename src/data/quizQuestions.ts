export interface QuizQuestion {
  id: number;
  question: string;
  latexFormula?: string;
  options: {
    key: string;
    text: string;
    latex?: string;
  }[];
  correctAnswer: string;
  explanation: string;
  ilmReference: string;
  category: 'Linear vs Nonlinear' | 'Process Gain' | 'Installed Characteristic' | 'Compensation Techniques';
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "In a linear control loop, how does static process gain (Kp) behave across the full operating range?",
    options: [
      { key: "A", text: "It varies exponentially with respect to controller output." },
      { key: "B", text: "It remains constant regardless of the operating point." },
      { key: "C", text: "It decreases inversely with the square of flow rate." },
      { key: "D", text: "It matches the notch filter resonant frequency." }
    ],
    correctAnswer: "B",
    explanation: "In a strictly linear system, the static process gain Kp = ΔPV / ΔCO is invariant (constant) across all operating points. A straight line plot of PV vs CO produces a constant slope.",
    ilmReference: "ILM 310305cB Objective One: Linear vs. Nonlinear Systems",
    category: "Linear vs Nonlinear"
  },
  {
    id: 2,
    question: "A process exhibits a steady-state gain defined by:",
    latexFormula: "K_p = \\frac{\\Delta PV}{\\Delta CO} = \\frac{T_{out2} - T_{out1}}{CO_2 - CO_1}",
    options: [
      { key: "A", text: "If Kp is constant, standard PID tuning parameters (Kc, Ti, Td) work uniformly well across all loads." },
      { key: "B", text: "If Kp varies, PID loop stability is guaranteed by selecting the highest possible controller gain." },
      { key: "C", text: "Process gain is purely dynamic and has no relationship to steady-state sensitivity." },
      { key: "D", text: "Gain variations can only occur if the sensor calibration drifts." }
    ],
    correctAnswer: "A",
    explanation: "When process gain Kp is constant (linear), one set of controller tuning parameters delivers optimal, stable loop response at 10%, 50%, and 90% load. If Kp varies (nonlinear), aggressive tuning at low gain causes sluggishness, while high gain regions cause oscillations.",
    ilmReference: "ILM 310305cB Objective One: Impact of Process Nonlinearities",
    category: "Process Gain"
  },
  {
    id: 3,
    question: "In a steam-to-liquid heat exchanger where cold liquid product mass flow rate is q_mp, the steady-state outlet temperature formula is:",
    latexFormula: "T_{out} = \\left( \\frac{h_{fg}}{q_{mp} \\cdot C_p} \\right) q_{ms} + T_{in}",
    options: [
      { key: "A", text: "Process gain Kp increases directly with liquid product throughput q_mp." },
      { key: "B", text: "Process gain Kp is inversely proportional to product throughput q_mp; doubling flow cuts process gain in half." },
      { key: "C", text: "Process gain is independent of steam latent heat h_fg." },
      { key: "D", text: "Product specific heat Cp has no bearing on steady-state gain." }
    ],
    correctAnswer: "B",
    explanation: "Because Kp = dT_out / dq_ms = h_fg / (q_mp * Cp), the process gain is inversely proportional to product flow rate q_mp. At low flow, a tiny pulse of steam causes a huge temperature rise (high Kp, prone to oscillation). At high flow, large steam changes yield small temperature shifts (low Kp, sluggish).",
    ilmReference: "ILM 310305cB Objective Two: Steam Heat Exchanger Dynamics",
    category: "Process Gain"
  },
  {
    id: 4,
    question: "Why does an equal percentage control valve trim (R = 50) tend to install linearly in systems with significant line piping pressure drop?",
    latexFormula: "Q = C_v \\cdot \\sqrt{\\frac{\\Delta P_{valve}}{G_f}}",
    options: [
      { key: "A", text: "As the valve opens, piping frictional loss reduces ΔP across the valve, flattening the logarithmic inherent flow curve." },
      { key: "B", text: "The equal percentage plug alters fluid viscosity to offset pressure changes." },
      { key: "C", text: "Line resistance increases valve pressure drop at high flows." },
      { key: "D", text: "Equal percentage trim is strictly linear by definition in the factory bench test." }
    ],
    correctAnswer: "A",
    explanation: "Inherent equal percentage trim has an exponentially rising curve. In a real system with piping friction, as flow increases, piping pressure drop increases, leaving less ΔP across the valve. This pressure drop erosion flattens the installed flow curve towards a near-linear response.",
    ilmReference: "ILM 310305cB Objective Two: Inherent vs Installed Valve Characteristics",
    category: "Installed Characteristic"
  },
  {
    id: 5,
    question: "What is the primary danger when an inherently linear valve is installed in a system with high line pressure drop (distortion coefficient Dc << 1)?",
    latexFormula: "D_c = \\frac{\\Delta P_{valve, max}}{\\Delta P_{system, total}}",
    options: [
      { key: "A", text: "The valve will seize due to thermal shock." },
      { key: "B", text: "The installed characteristic becomes quick-opening: extremely high gain near the seat, causing limit-cycle hunting at low flow." },
      { key: "C", text: "The valve trim undergoes cavitation only at 100% stroke." },
      { key: "D", text: "The controller deadband must be set to 0% to prevent windup." }
    ],
    correctAnswer: "B",
    explanation: "When an inherently linear valve faces severe line drop (low valve authority/distortion coefficient), most flow capacity is reached in the first 20-30% of stroke. The installed curve bends into a quick-opening characteristic with steep initial slope (excessive gain), causing instability and hunting near closed position.",
    ilmReference: "ILM 310305cB Objective Two: Valve Distortion & Authority",
    category: "Installed Characteristic"
  },
  {
    id: 6,
    question: "In titration and wastewater neutralization, why is the pH titration curve notoriously difficult for standard linear PID controllers?",
    latexFormula: "\\text{pH} = -\\log_{10}[H^+]",
    options: [
      { key: "A", text: "Process gain is virtually zero near the equivalence point (pH 7)." },
      { key: "B", text: "The logarithmic relationship results in an enormous static gain spike near neutrality (pH 7), often 1,000x greater than at extreme pH values." },
      { key: "C", text: "Strong acid-base neutralization requires reverse-acting controllers at all times." },
      { key: "D", text: "pH electrodes respond with pure rate-of-change (derivative only) dynamics." }
    ],
    correctAnswer: "B",
    explanation: "Because pH = -log10[H+], moving from pH 7 to pH 6 requires 10x more acid than pH 8 to pH 7, and moving from pH 3 to pH 2 requires 10,000x more reagent. Near neutrality (pH 7), a single drop of acid or caustic swings pH wildly, representing extreme static process gain.",
    ilmReference: "ILM 310305cB Objective Two: pH Control Loop Nonlinearity",
    category: "Process Gain"
  },
  {
    id: 7,
    question: "How does a Notch Controller (or Non-Linear PID with Error-Squared / Error-Band Gain) compensate for steep pH curves around setpoint?",
    latexFormula: "K_c^{\\text{effective}} = K_c \\cdot f(|e|) \\quad \\text{where } f(|e|) \\ll 1 \\text{ inside the notch band}",
    options: [
      { key: "A", text: "It drastically reduces controller gain within a tight error band around setpoint, then restores full gain for large errors." },
      { key: "B", text: "It doubles controller gain at setpoint to snap the valve shut faster." },
      { key: "C", text: "It disables integral action permanently." },
      { key: "D", text: "It swaps the setpoint and process variable dynamically." }
    ],
    correctAnswer: "A",
    explanation: "A notch controller attenuates the controller gain (e.g. reducing gain by a factor of 5x or 10x) inside a defined error window around setpoint (pH 6.5 - 7.5). This counteracts the extreme process gain spike, preventing valve hunting while maintaining fast response to large disturbances.",
    ilmReference: "ILM 310305cB Objective Three: Notch & Error-Squared Algorithms",
    category: "Compensation Techniques"
  },
  {
    id: 8,
    question: "What compensation strategy uses a lookup table of measured load or process variable to select distinct PID tuning sets (e.g., Zone 1, Zone 2, Zone 3)?",
    options: [
      { key: "A", text: "Cascade secondary trimming" },
      { key: "B", text: "Gain Scheduling" },
      { key: "C", text: "Derivative on Measurement filtering" },
      { key: "D", text: "Smith Predictor time delay" }
    ],
    correctAnswer: "B",
    explanation: "Gain scheduling partitions the operating spectrum into distinct zones (or schedules gain continuously based on an auxiliary measurement such as production rate or valve position). Each zone utilizes pre-tuned PID parameters matched to local process sensitivity.",
    ilmReference: "ILM 310305cB Objective Three: Gain Scheduling Strategies",
    category: "Compensation Techniques"
  },
  {
    id: 9,
    question: "How does a Multipoint Characterizer (Function Generator block, e.g., f(x)) linearize a nonlinear control loop when placed between controller output and valve?",
    latexFormula: "f(x): \\text{Maps controller } m_c \\in [0, 100\\%] \\to \\text{valve position } x_v",
    options: [
      { key: "A", text: "It amplifies high frequencies from noisy transmitters." },
      { key: "B", text: "It implements an inverse characteristic curve such that the product of characterizer gain and process gain equals a constant." },
      { key: "C", text: "It converts 4-20 mA current to 3-15 psi pneumatic pressure." },
      { key: "D", text: "It limits valve travel to exactly 50% under all operating regimes." }
    ],
    correctAnswer: "B",
    explanation: "The characterizer block is configured with the mathematical inverse of the static process curve: K_char * K_proc = Constant. The loop as seen from the controller's error summing junction appears uniformly linear across the entire span.",
    ilmReference: "ILM 310305cB Objective Three: Signal Characterizers & Linearization",
    category: "Compensation Techniques"
  },
  {
    id: 10,
    question: "In an adaptive gain control system compensating for varying product flow q_mp in a heat exchanger, controller gain Kc should be programmed to:",
    latexFormula: "K_c = K_{c0} \\cdot \\left(\\frac{q_{mp}}{q_{mp,design}}\\right)",
    options: [
      { key: "A", text: "Increase proportionally with throughput flow rate q_mp." },
      { key: "B", text: "Decrease proportionally with flow rate to avoid overloading the heater." },
      { key: "C", text: "Remain strictly constant while integral time Ti is set to zero." },
      { key: "D", text: "Vary randomly based on high-frequency noise." }
    ],
    correctAnswer: "A",
    explanation: "Since process gain Kp drops as flow q_mp increases (Kp ∝ 1/q_mp), the loop overall gain K_loop = Kc * Kp * Kv * Kt would drop at high loads, making the loop sluggish. To maintain constant loop gain (K_loop = constant), controller gain Kc must increase in direct proportion to product flow q_mp.",
    ilmReference: "ILM 310305cB Objective Three: Adaptive Gain Loops",
    category: "Compensation Techniques"
  },
  {
    id: 11,
    question: "In a horizontal cylindrical storage tank or spherical vessel, what causes the liquid level control loop to behave nonlinearly?",
    latexFormula: "A(h) = 2 \\cdot \\sqrt{R^2 - (R - h)^2} \\cdot L",
    options: [
      { key: "A", text: "The fluid density changes by 50% between top and bottom." },
      { key: "B", text: "The cross-sectional surface area A(h) varies with height, meaning process capacitance and level rise rate dh/dt vary dramatically with liquid elevation." },
      { key: "C", text: "Level transmitters are inherently non-linear for all liquids." },
      { key: "D", text: "Hydrostatic head pressure creates negative gain at low levels." }
    ],
    correctAnswer: "B",
    explanation: "Because surface area changes with height (narrow at bottom and top, widest at centerline in a cylinder or sphere), a fixed inflow causes rapid level rise near the bottom/top (high gain), but very slow level rise in the middle (low gain).",
    ilmReference: "ILM 310305cB Objective Two: Variable Geometry Vessels",
    category: "Process Gain"
  },
  {
    id: 12,
    question: "Which of the following is considered an acceptable industry criterion for overall closed-loop stability across all operating points?",
    latexFormula: "K_{\\text{loop}} = K_c \\cdot K_v \\cdot K_p \\cdot K_t",
    options: [
      { key: "A", text: "The loop gain K_loop should remain uniform and well within stability margins, avoiding critical damping breakdown." },
      { key: "B", text: "The controller gain Kc must always exceed 100 to ensure fast tracking." },
      { key: "C", text: "The valve gain Kv must always equal zero at 50% travel." },
      { key: "D", text: "Transmitter gain Kt must be set equal to derivative time Td." }
    ],
    correctAnswer: "A",
    explanation: "The ultimate objective when applying linearization, characterization, gain scheduling, or adaptive control is to ensure total open-loop gain K_loop = Kc * Kv * Kp * Kt stays balanced and consistent across the operating range, preventing both unstable oscillation and sluggish recovery.",
    ilmReference: "ILM 310305cB Objective Three: Loop Gain Criteria",
    category: "Linear vs Nonlinear"
  },
  {
    id: 13,
    question: "What happens if a control valve exhibits severe mechanical stiction and deadband in a tightly tuned feedback loop?",
    options: [
      { key: "A", text: "The controller automatically recalibrates the zero and span without external hardware." },
      { key: "B", text: "It creates a persistent non-linear limit cycle oscillation (hunting) that cannot be eliminated by standard linear PID retuning alone." },
      { key: "C", text: "Static process gain Kp becomes strictly infinite across the entire span." },
      { key: "D", text: "The transmitter PV reading locks permanently at 50%." }
    ],
    correctAnswer: "B",
    explanation: "Stiction and mechanical deadband are non-linear physical phenomena where the valve stem sticks until integrator buildup forces a sudden jump past setpoint. This creates a persistent square/sawtooth limit-cycle oscillation that cannot be fixed by linear PID tuning alone (requires valve maintenance or digital anti-stiction compensation).",
    ilmReference: "ILM 310305cB Objective One & Two: Physical Nonlinearities (Stiction/Deadband)",
    category: "Installed Characteristic"
  }
];
