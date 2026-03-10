import { useState, useEffect } from 'react'

export interface TourStep {
  target: string
  title: string
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  example?: string
  proTip?: string
}

export function useTour(steps: TourStep[], tourKey: string) {
  const storageKey = `acc_tour_${tourKey}`
  const [currentStep, setCurrentStep] = useState(-1)
  const [hasCompleted, setHasCompleted] = useState(() =>
    localStorage.getItem(storageKey) === 'done'
  )

  const isActive = currentStep >= 0 && currentStep < steps.length

  function start() {
    setCurrentStep(0)
  }

  function next() {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      finish()
    }
  }

  function prev() {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  function finish() {
    setCurrentStep(-1)
    setHasCompleted(true)
    localStorage.setItem(storageKey, 'done')
  }

  function reset() {
    localStorage.removeItem(storageKey)
    setHasCompleted(false)
    setCurrentStep(-1)
  }

  return {
    currentStep,
    step: isActive ? steps[currentStep] : null,
    isActive,
    hasCompleted,
    totalSteps: steps.length,
    start,
    next,
    prev,
    finish,
    reset,
  }
}
