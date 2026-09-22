import React, { useState } from 'react';
import { ProcessVisualizer } from './components/ProcessVisualizer';
import { SolutionsLab } from './components/SolutionsLab';
import { QuizEngine } from './components/QuizEngine';
import { StudyReference } from './components/StudyReference';
import { Activity, Cpu, HelpCircle, BookOpen, Layers } from 'lucide-react';

export default function App() {
  const [currentModule, setCurrentModule] = useState<'3dsim' | 'solutions' | 'quiz' | 'guide'>('3dsim');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Module Identification */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm tracking-wide">
                  ILM 310305cB
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-xs text-cyan-400 font-mono font-medium">Nonlinear Control Simulator</span>
              </div>
              <p className="text-[11px] text-slate-400">Alberta Apprenticeship & Industry Training</p>
            </div>
          </div>

          {/* Module Nav Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setCurrentModule('3dsim')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                currentModule === '3dsim'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>3D Machine Lab</span>
            </button>

            <button
              onClick={() => setCurrentModule('solutions')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                currentModule === 'solutions'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Compensation Lab</span>
            </button>

            <button
              onClick={() => setCurrentModule('quiz')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                currentModule === 'quiz'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Quiz Engine</span>
            </button>

            <button
              onClick={() => setCurrentModule('guide')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                currentModule === 'guide'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Study Notes</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {currentModule === '3dsim' && <ProcessVisualizer />}
        {currentModule === 'solutions' && <SolutionsLab />}
        {currentModule === 'quiz' && <QuizEngine />}
        {currentModule === 'guide' && <StudyReference />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 bg-slate-950 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Nonlinear Control Loops Educational Applet (ILM 310305cB)</span>
          <div className="flex items-center gap-3">
            <span>KaTeX Math Engine</span>
            <span>·</span>
            <span>Three.js Procedural 3D</span>
            <span>·</span>
            <span className="text-cyan-400">GitHub Pages Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
