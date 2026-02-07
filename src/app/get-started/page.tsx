'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import StepTracker from '@/components/get-started/StepTracker';
import SubscriptionStep from '@/components/get-started/SubscriptionStep';
import PaymentStep from '@/components/get-started/PaymentStep';
import DomainStep from '@/components/get-started/DomainStep';
import SiteInfoStep from '@/components/get-started/SiteInfoStep';
import SuccessStep from '@/components/get-started/SuccessStep';

export type FormData = {
  plan: 'free' | 'pro' | 'enterprise' | null;
  domain: string;
  siteName: string;
  siteDescription: string;
};

const STEPS = ['subscription', 'payment', 'domain', 'site-info', 'success'];

export default function GetStartedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStep = searchParams.get('step') || 'subscription';

  const [formData, setFormData] = useState<FormData>({
    plan: null,
    domain: '',
    siteName: '',
    siteDescription: '',
  });

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const goToNextStep = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    
    // Skip payment for free plan
    if (currentStep === 'subscription' && formData.plan === 'free') {
      router.push(`/get-started?step=domain`);
      return;
    }

    if (currentIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentIndex + 1];
      router.push(`/get-started?step=${nextStep}`);
    }
  };

  const goToStep = (step: string) => {
    router.push(`/get-started?step=${step}`);
  }

  const currentStepIndex = STEPS.indexOf(currentStep);

  return (
    <div className="container mx-auto py-12">
      <div className="max-w-4xl mx-auto">
        {currentStep !== 'success' && <StepTracker currentStep={currentStepIndex} steps={STEPS.slice(0,-1)} />}
        
        <div className="mt-12">
          {currentStep === 'subscription' && (
            <SubscriptionStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={goToNextStep}
            />
          )}
          {currentStep === 'payment' && (
            <PaymentStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={goToNextStep}
            />
          )}
          {currentStep === 'domain' && (
            <DomainStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={goToNextStep}
            />
          )}
          {currentStep === 'site-info' && (
            <SiteInfoStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={goToNextStep}
            />
          )}
          {currentStep === 'success' && <SuccessStep formData={formData} />}
        </div>
      </div>
    </div>
  );
}
