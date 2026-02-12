
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface StepTrackerProps {
    currentStep: number;
    steps: string[];
}

export default function StepTracker({ currentStep, steps }: StepTrackerProps) {
    return (
        <div className="flex items-start justify-center">
            <div className="flex items-center w-full max-w-2xl">
                {steps.map((step, index) => (
                    <React.Fragment key={index}>
                        <div className="flex flex-col items-center text-center w-24">
                            <div
                                className={cn(
                                    `w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-colors`,
                                    index <= currentStep
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                )}
                            >
                                {index + 1}
                            </div>
                            <p className={cn(
                                "mt-2 text-xs sm:text-sm font-medium capitalize transition-colors",
                                index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                            )}>
                                {step.replace('-', ' ')}
                            </p>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={cn(
                                "flex-1 h-1 transition-colors",
                                index < currentStep ? 'bg-primary' : 'bg-border'
                            )} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};
