# ILM Nonlinear Control Systems - 3D Quiz & Simulator

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen.svg)](https://rapidrawrich.github.io/Closed-Loop-Control-B/)

An interactive educational 3D visualizer and quiz simulator designed for the Alberta Apprenticeship and Industry Training (AIT) **ILM Module 310305cB: Closed Loop Control - Nonlinear Loops**.

🔗 **Live Application:** [https://rapidrawrich.github.io/Closed-Loop-Control-B/](https://rapidrawrich.github.io/Closed-Loop-Control-B/)

---

## 🌟 Key Features

- **Interactive 3D Process Visualizer:**
  - Real-time 3D WebGL industrial simulations exploring nonlinearities such as valve stiction/backlash, pH titration curves, level geometry variations, and temperature cross-coupling.
- **Dynamic Analysis & Machine Graphs:**
  - Step-response and limit-cycle waveforms, strip charts, phase planes, and gain-scheduling profiles.
- **Interactive Solutions Lab:**
  - Hands-on experimentation with compensation techniques: dual-mode controllers, split-range outputs, characterizers, and adaptive gain.
- **Comprehensive Quiz Engine:**
  - Curated exam preparation questions reflecting Alberta Apprenticeship standards with instant feedback, mathematical explanations, and KaTeX-rendered equations.
- **Technical Study Reference:**
  - In-depth theoretical breakdowns covering nonlinear process dynamics, compensation techniques, and instrumentation best practices.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### Installation & Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/RapidRawRich/Closed-Loop-Control-B.git
   cd Closed-Loop-Control-B
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Launch development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building & Deploying

To build the production bundle:
```bash
npm run build
```

To deploy updates directly to GitHub Pages:
```bash
npm run deploy
```

---

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **3D Engine:** [Three.js](https://threejs.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Math Formatting:** [KaTeX](https://katex.org/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Hosting:** [GitHub Pages](https://pages.github.com/)
