import { useEffect, useState } from 'react'
import { X, ChevronRight, ChevronLeft, Lightbulb, Sparkles } from 'lucide-react'
import type { TourStep } from '../../hooks/useTour'

interface TourOverlayProps {
  step: TourStep | null
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onFinish: () => void
}

export function TourOverlay({ step, currentStep, totalSteps, onNext, onPrev, onFinish }: TourOverlayProps) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, height: 0 })

  useEffect(() => {
    if (!step) return
    const el = document.querySelector(step.target)
    if (el) {
      const rect = el.getBoundingClientRect()
      setPos({ top: rect.top + window.scrollY, left: rect.left, width: rect.width, height: rect.height })
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [step])

  if (!step) return null

  const isLast = currentStep === totalSteps - 1

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9998] bg-black/50 pointer-events-auto" />

      {/* Tooltip */}
      <div
        className="fixed z-[9999] bg-slate-900 border border-brand-700/50 rounded-xl shadow-2xl p-5 max-w-sm"
        style={{
          top: pos.top + pos.height + 12,
          left: Math.min(pos.left, window.innerWidth - 400),
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="text-xs text-brand-400 font-medium">Step {currentStep + 1} of {totalSteps}</span>
          </div>
          <button onClick={onFinish} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="font-semibold text-sm mb-2">{step.title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-3">{step.content}</p>

        {step.example && (
          <div className="bg-brand-900/20 border border-brand-700/30 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-brand-300 font-medium mb-1">
              <Sparkles className="w-3 h-3" /> Try This Example
            </div>
            <p className="text-xs text-slate-300">{step.example}</p>
          </div>
        )}

        {step.proTip && (
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-yellow-300 font-medium mb-1">
              <Lightbulb className="w-3 h-3" /> Pro Tip
            </div>
            <p className="text-xs text-slate-300">{step.proTip}</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={onPrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3 h-3" /> Back
          </button>
          <button
            onClick={isLast ? onFinish : onNext}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
          >
            {isLast ? 'Finish Tour' : 'Next'} <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1 mt-3">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${i === currentStep ? 'bg-brand-400' : i < currentStep ? 'bg-brand-700' : 'bg-slate-700'}`}
            />
          ))}
        </div>
      </div>
    </>
  )
}
