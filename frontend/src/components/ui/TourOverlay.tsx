import { useEffect, useState, useCallback } from 'react'
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
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const updatePosition = useCallback(() => {
    if (!step) return
    const el = document.querySelector(step.target)
    if (el) {
      setTargetRect(el.getBoundingClientRect())
    } else {
      setTargetRect(null)
    }
  }, [step])

  useEffect(() => {
    if (!step) return
    const el = document.querySelector(step.target)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Wait for scroll to finish, then measure
      const timer = setTimeout(updatePosition, 400)
      return () => clearTimeout(timer)
    }
  }, [step, updatePosition])

  // Update on scroll/resize
  useEffect(() => {
    if (!step) return
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [step, updatePosition])

  if (!step) return null

  const isLast = currentStep === totalSteps - 1
  const pad = 8

  // Calculate tooltip position
  let tooltipTop = 0
  let tooltipLeft = 0
  if (targetRect) {
    tooltipTop = targetRect.bottom + 12
    tooltipLeft = Math.max(16, Math.min(targetRect.left, window.innerWidth - 400))
    // If tooltip would go below viewport, show above
    if (tooltipTop + 300 > window.innerHeight) {
      tooltipTop = Math.max(16, targetRect.top - 320)
    }
  } else {
    // No target found — center on screen
    tooltipTop = window.innerHeight / 2 - 150
    tooltipLeft = window.innerWidth / 2 - 192
  }

  return (
    <>
      {/* Backdrop with cutout */}
      <div className="fixed inset-0 z-[9998]" onClick={onFinish}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="tour-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - pad}
                  y={targetRect.top - pad}
                  width={targetRect.width + pad * 2}
                  height={targetRect.height + pad * 2}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0" y="0" width="100%" height="100%"
            fill="rgba(0,0,0,0.6)"
            mask="url(#tour-mask)"
          />
        </svg>
      </div>

      {/* Highlight border around target */}
      {targetRect && (
        <div
          className="fixed z-[9998] border-2 border-indigo-400 rounded-lg pointer-events-none"
          style={{
            top: targetRect.top - pad,
            left: targetRect.left - pad,
            width: targetRect.width + pad * 2,
            height: targetRect.height + pad * 2,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-[9999] bg-slate-900 border border-indigo-700/50 rounded-xl shadow-2xl shadow-black/40 p-5 w-[380px] max-w-[calc(100vw-32px)]"
        style={{ top: tooltipTop, left: tooltipLeft }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-indigo-400 font-medium">Step {currentStep + 1} of {totalSteps}</span>
          </div>
          <button onClick={onFinish} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="font-semibold text-white text-sm mb-2">{step.title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-3">{step.content}</p>

        {step.example && (
          <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium mb-1">
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
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3 h-3" /> Back
          </button>
          <button
            onClick={isLast ? onFinish : onNext}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
          >
            {isLast ? 'Finish Tour' : 'Next'} <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === currentStep ? 'bg-indigo-400' : i < currentStep ? 'bg-indigo-700' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
    </>
  )
}
