"use client"

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface Step {
  id: number
  name: string
  description: string
  href: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
}

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={cn(
              stepIdx !== steps.length - 1 ? 'flex-1' : '',
              'relative'
            )}
          >
            {stepIdx < currentStep ? (
              // Completed step
              <>
                <div className="flex items-center">
                  <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full">
                    <Check className="w-5 h-5 text-white" />
                  </span>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{step.name}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute top-4 w-full -translate-x-1/2 left-1/2">
                    <div className="h-0.5 bg-blue-600 w-full" />
                  </div>
                )}
              </>
            ) : stepIdx === currentStep ? (
              // Current step
              <>
                <div className="flex items-center">
                  <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full">
                    <span className="text-white text-sm">{step.id}</span>
                  </span>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-600">{step.name}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute top-4 w-full -translate-x-1/2 left-1/2">
                    <div className="h-0.5 bg-gray-200 w-full" />
                  </div>
                )}
              </>
            ) : (
              // Upcoming step
              <>
                <div className="flex items-center">
                  <span className="relative z-10 w-8 h-8 flex items-center justify-center border-2 border-gray-300 rounded-full bg-white">
                    <span className="text-gray-500 text-sm">{step.id}</span>
                  </span>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">{step.name}</p>
                    <p className="text-xs text-gray-400">{step.description}</p>
                  </div>
                </div>
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute top-4 w-full -translate-x-1/2 left-1/2">
                    <div className="h-0.5 bg-gray-200 w-full" />
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}