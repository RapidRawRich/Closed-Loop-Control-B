import React, { useState } from 'react';
import { Latex } from './Latex';
import { QUIZ_QUESTIONS, QuizQuestion } from '../data/quizQuestions';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const QuizEngine: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<number, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showSummary, setShowSummary] = useState<boolean>(false);

  // Filter questions based on category
  const filteredQuestions = selectedCategory === 'All'
    ? QUIZ_QUESTIONS
    : QUIZ_QUESTIONS.filter((q) => q.category === selectedCategory);

  const currentQ: QuizQuestion | undefined = filteredQuestions[currentIndex] || filteredQuestions[0];

  const handleSelectOption = (qId: number, key: string) => {
    if (submittedQuestions[qId]) return; // locked once checked
    setUserAnswers((prev) => ({ ...prev, [qId]: key }));
  };

  const handleCheckAnswer = (qId: number) => {
    setSubmittedQuestions((prev) => ({ ...prev, [qId]: true }));
    const isCorrect = userAnswers[qId] === currentQ.correctAnswer;
    if (isCorrect) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#06b6d4', '#10b981', '#f59e0b']
      });
    }
  };

  const handleResetQuiz = () => {
    setUserAnswers({});
    setSubmittedQuestions({});
    setCurrentIndex(0);
    setShowSummary(false);
  };

  // Calculate score metrics
  const totalAnswered = Object.keys(submittedQuestions).length;
  const totalCorrect = Object.entries(submittedQuestions).reduce((acc, [qIdStr, isSubmitted]) => {
    const qId = Number(qIdStr);
    const q = QUIZ_QUESTIONS.find((item) => item.id === qId);
    if (isSubmitted && q && userAnswers[qId] === q.correctAnswer) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const percentage = QUIZ_QUESTIONS.length > 0 ? Math.round((totalCorrect / QUIZ_QUESTIONS.length) * 100) : 0;
  const isComplete = totalAnswered === QUIZ_QUESTIONS.length;

  return (
    <div className="space-y-6">
      {/* Quiz Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            ILM 310305cB Module Exam Simulator
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Alberta Apprenticeship Third Period</span>
            <span aria-hidden="true">·</span>
            <span>13 Objective Self-Test Questions</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-cyan-400">Passing Score: 70%</span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          {['All', 'Linear vs Nonlinear', 'Process Gain', 'Installed Characteristic', 'Compensation Techniques'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentIndex(0);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            )
          )}
        </div>
      </div>

      {/* Progress & Score Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
          <span className="text-xs text-slate-400">Questions Answered:</span>
          <span className="font-mono text-cyan-400 font-bold">
            {totalAnswered} / {QUIZ_QUESTIONS.length}
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
          <span className="text-xs text-slate-400">Current Score:</span>
          <span className="font-mono text-emerald-400 font-bold">
            {totalCorrect} ({percentage}%)
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
          <span className="text-xs text-slate-400">Readiness Status:</span>
          <span
            className={`font-semibold text-xs ${
              percentage >= 70 ? 'text-emerald-400' : totalAnswered > 5 ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            {percentage >= 70 ? 'Quiz Ready (PASS)' : totalAnswered > 5 ? 'Review Needed' : 'In Progress'}
          </span>
        </div>
        <button
          onClick={handleResetQuiz}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-3 rounded-lg flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Quiz Session
        </button>
      </div>

      {/* Main Question Card or Summary View */}
      {!showSummary ? (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
          {/* Question Index & Category Badge */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 font-bold">
                Question {currentIndex + 1} of {filteredQuestions.length}
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400">{currentQ.category}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Reference: {currentQ.ilmReference}
            </div>
          </div>

          {/* Question Statement */}
          <div className="space-y-3">
            <p className="text-base text-slate-100 font-medium leading-relaxed">{currentQ.question}</p>
            {currentQ.latexFormula && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
                <Latex block math={currentQ.latexFormula} />
              </div>
            )}
          </div>

          {/* Options List */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt) => {
              const isSelected = userAnswers[currentQ.id] === opt.key;
              const isSubmitted = submittedQuestions[currentQ.id];
              const isCorrectAnswer = opt.key === currentQ.correctAnswer;

              let itemStyles = 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700';
              if (isSelected && !isSubmitted) {
                itemStyles = 'bg-cyan-950/40 border-cyan-500 text-cyan-200 shadow-sm';
              } else if (isSubmitted) {
                if (isCorrectAnswer) {
                  itemStyles = 'bg-emerald-950/40 border-emerald-500 text-emerald-200';
                } else if (isSelected && !isCorrectAnswer) {
                  itemStyles = 'bg-rose-950/40 border-rose-500 text-rose-200';
                }
              }

              return (
                <button
                  key={opt.key}
                  disabled={isSubmitted}
                  onClick={() => handleSelectOption(currentQ.id, opt.key)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-start gap-3 ${itemStyles}`}
                >
                  <span
                    className={`font-mono text-xs w-6 h-6 flex items-center justify-center rounded border shrink-0 ${
                      isSelected ? 'border-cyan-400 bg-cyan-950 text-cyan-300' : 'border-slate-700 bg-slate-900 text-slate-400'
                    }`}
                  >
                    {opt.key}
                  </span>
                  <div className="flex-1 text-sm pt-0.5">
                    {opt.text}
                    {opt.latex && <Latex math={opt.latex} className="ml-1" />}
                  </div>
                  {isSubmitted && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  {isSubmitted && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Row: Check Answer & Detailed Solution */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
            <div>
              {!submittedQuestions[currentQ.id] ? (
                <button
                  disabled={!userAnswers[currentQ.id]}
                  onClick={() => handleCheckAnswer(currentQ.id)}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  Check Answer
                </button>
              ) : (
                <span className="text-xs font-mono text-slate-400">
                  {userAnswers[currentQ.id] === currentQ.correctAnswer ? (
                    <span className="text-emerald-400 font-bold">✓ Correct Answer!</span>
                  ) : (
                    <span className="text-rose-400 font-bold">✗ Incorrect</span>
                  )}
                </span>
              )}
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 hover:border-slate-700 text-slate-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-400 px-2">
                {currentIndex + 1} / {filteredQuestions.length}
              </span>
              <button
                disabled={currentIndex === filteredQuestions.length - 1}
                onClick={() => setCurrentIndex((prev) => Math.min(filteredQuestions.length - 1, prev + 1))}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 hover:border-slate-700 text-slate-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Detailed Solution Box (shows once submitted) */}
          {submittedQuestions[currentQ.id] && (
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 font-semibold text-cyan-400">
                <BookOpen className="w-4 h-4" />
                Technical Explanation & ILM Guide Reference:
              </div>
              <p className="leading-relaxed">{currentQ.explanation}</p>
            </div>
          )}
        </div>
      ) : (
        /* Final Exam Performance Summary */
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400">
            <Award className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-white">Quiz Completed</h3>
            <p className="text-sm text-slate-400">
              You scored <span className="font-bold text-cyan-400">{totalCorrect}</span> out of{' '}
              <span className="font-bold text-white">{QUIZ_QUESTIONS.length}</span> ({percentage}%)
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
            {percentage >= 70 ? (
              <p className="text-emerald-400 font-medium">
                Congratulations! You have demonstrated strong mastery of ILM Module 310305cB (Closed Loop Control - Part B: Nonlinear Loops).
              </p>
            ) : (
              <p className="text-amber-400 font-medium">
                Review recommended for installed valve characteristics and heat exchanger flow gain variations before writing your certification quiz.
              </p>
            )}
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowSummary(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
            >
              Review Questions
            </button>
            <button
              onClick={handleResetQuiz}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold"
            >
              Retake Exam
            </button>
          </div>
        </div>
      )}

      {/* Button to view summary when completed */}
      {isComplete && !showSummary && (
        <div className="text-center pt-2">
          <button
            onClick={() => setShowSummary(true)}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs shadow-lg hover:opacity-95 transition-opacity"
          >
            View Final Results & Analysis
          </button>
        </div>
      )}
    </div>
  );
};
