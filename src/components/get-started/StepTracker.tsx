interface StepTrackerProps {
    currentStep: number;
    steps: string[];
}

export default function StepTracker({ currentStep, steps }: StepTrackerProps) {
    return (
        <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-center">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold
                                ${index <= currentStep
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                        >
                            {index + 1}
                        </div>
                        <p className={`ml-3 font-medium capitalize ${index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.replace('-', ' ')}
                        </p>
                        {index < steps.length - 1 && (
                            <div className="w-16 h-0.5 bg-border mx-4" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
