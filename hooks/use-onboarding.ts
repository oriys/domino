"use client"

import { useCallback, useState } from "react"

const STORAGE_KEY = "domino-onboarding-completed"

export function useOnboarding() {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [shouldAutoStart, setShouldAutoStart] = useState(() => {
    if (typeof window === "undefined") return false
    return !localStorage.getItem(STORAGE_KEY)
  })

  const start = useCallback(() => {
    setIsActive(true)
    setCurrentStep(0)
    setShouldAutoStart(false)
  }, [])

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => prev + 1)
  }, [])

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }, [])

  const complete = useCallback(() => {
    setIsActive(false)
    localStorage.setItem(STORAGE_KEY, "true")
  }, [])

  const skip = useCallback(() => {
    setIsActive(false)
    localStorage.setItem(STORAGE_KEY, "true")
  }, [])

  const restart = useCallback(() => {
    setIsActive(true)
    setCurrentStep(0)
  }, [])

  return {
    isActive,
    shouldAutoStart,
    currentStep,
    start,
    nextStep,
    prevStep,
    complete,
    skip,
    restart,
  }
}
