
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { type Plan } from '@/types';

import StepTracker from '@/components/get-started/StepTracker';
import SubscriptionStep from '@/components/get-started/SubscriptionStep';
import PaymentStep from '@/components/get-started/PaymentStep';
import DomainStep from '@/components/get-started/DomainStep';
import SiteInfoStep from '@/components/get-started/SiteInfoStep';
import SuccessStep from '@/components/get-started/SuccessStep';

export type FormData = {
  plan: string | null;
  domain: string;
  siteName: string;
  siteDescription: string;
  paymentMethod?: string;
  transactionId?: string;
};

const STEPS = ['subscription', 'payment', 'domain', 'site-info', 'success'];

export default function GetStartedFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStep = searchParams.get('step') || 'subscription';

  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    plan: null,
    domain: '',
    siteName: '',
    siteDescription: '',
    paymentMethod: 'mobile_banking',
    transactionId: '',
  });

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoadingPlans(true);
      const { data } = await supabase
        .from('plans')
        .select('*');

      if (data) {
        const planOrder = ['free', 'pro', 'enterprise'];
        data.sort((a, b) => planOrder.indexOf(a.id) - planOrder.indexOf(b.id));
        setPlans(data);
      }
      setIsLoadingPlans(false);
    };
    fetchPlans();
  }, []);

  const updateFormData = useCallback((data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  // Sync plan and payment info from URL (essential after redirects from Stripe/bKash)
  useEffect(() => {
    const planFromQuery = searchParams.get('plan');
    const stripeId = searchParams.get('stripe_session_id');
    const bkashTrxId = searchParams.get('trx_id');

    if (planFromQuery && plans.length > 0) {
        if (plans.some(p => p.id === planFromQuery) && formData.plan !== planFromQuery) {
            updateFormData({ plan: planFromQuery });
        }
    }

    if (stripeId && formData.transactionId !== stripeId) {
        updateFormData({ transactionId: stripeId, paymentMethod: 'credit_card' });
    } else if (bkashTrxId && formData.transactionId !== bkashTrxId) {
        updateFormData({ transactionId: bkashTrxId, paymentMethod: 'bkash' });
    }
  }, [searchParams, plans, formData.plan, formData.transactionId, updateFormData]);

  const selectedPlanDetails = plans.find((p) => p.id === formData.plan);

  const goToNextStep = () => {
    const currentIndex = STEPS.indexOf(currentStep);

    if (currentStep === 'subscription' && formData.plan === 'free') {
      router.push(`/get-started?step=domain&plan=free`);
      return;
    }

    if (currentIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentIndex + 1];
      router.push(`/get-started?step=${nextStep}${formData.plan ? `&plan=${formData.plan}` : ''}`);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    
    if (currentIndex <= 0) {
        router.push('/');
        return;
    }

    if (currentStep === 'domain' && formData.plan === 'free') {
        router.push(`/get-started?step=subscription&plan=free`);
        return;
    }

    const prevStep = STEPS[currentIndex - 1];
    router.push(`/get-started?step=${prevStep}${formData.plan ? `&plan=${formData.plan}` : ''}`);
  };

  const currentStepIndex = STEPS.indexOf(currentStep);

  return (
    <div className="container mx-auto py-12">
      <div className="max-w-4xl mx-auto">
        {currentStep !== 'success' && (
          <StepTracker currentStep={currentStepIndex} steps={STEPS.slice(0, -1)} />
        )}

        <div className="mt-12">
          {currentStep === 'subscription' && (
            <SubscriptionStep
              plans={plans}
              isLoading={isLoadingPlans}
              formData={formData}
              updateFormData={updateFormData}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
            />
          )}
          {currentStep === 'payment' && (
            <PaymentStep
              plan={selectedPlanDetails}
              formData={formData}
              updateFormData={updateFormData}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
            />
          )}
          {currentStep === 'domain' && (
            <DomainStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
            />
          )}
          {currentStep === 'site-info' && (
            <SiteInfoStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
            />
          )}
          {currentStep === 'success' && <SuccessStep formData={formData} />}
        </div>
      </div>
    </div>
  );
}
