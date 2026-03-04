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
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [formData, setFormData] = useState<FormData>({
    plan: null,
    domain: '',
    siteName: '',
    siteDescription: '',
    paymentMethod: 'sslcommerz',
    transactionId: '',
  });

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoadingPlans(true);
      const { data } = await supabase.from('plans').select('*');
      if (data) {
        const planOrder = ['free', 'pro', 'enterprise'];
        data.sort((a, b) => planOrder.indexOf(a.id) - planOrder.indexOf(b.id));
        setPlans(data);
      }
      setIsLoadingPlans(false);
    };
    
    const trackVisitor = async () => {
        try {
            const response = await fetch('/api/saas/tracking');
            if (response.ok) {
                const data = await response.json();
                if (data.countryCode && data.countryCode !== 'BD') setLang('en');
            }
        } catch (e) { console.error(e); }
    };

    fetchPlans();
    trackVisitor();
  }, []);

  const updateFormData = useCallback((data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  useEffect(() => {
    const planFromQuery = searchParams.get('plan');
    const stripeId = searchParams.get('stripe_session_id');
    const sslTrxId = searchParams.get('ssl_trx_id');

    if (planFromQuery && plans.length > 0) {
        if (plans.some(p => p.id === planFromQuery) && formData.plan !== planFromQuery) {
            updateFormData({ plan: planFromQuery });
        }
    }

    if (stripeId && formData.transactionId !== stripeId) {
        updateFormData({ transactionId: stripeId, paymentMethod: 'credit_card' });
    } else if (sslTrxId && formData.transactionId !== sslTrxId) {
        updateFormData({ transactionId: sslTrxId, paymentMethod: 'sslcommerz' });
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
    if (currentIndex <= 0) { router.push('/'); return; }
    if (currentStep === 'domain' && formData.plan === 'free') {
        router.push(`/get-started?step=subscription&plan=free`);
        return;
    }
    const prevStep = STEPS[currentIndex - 1];
    router.push(`/get-started?step=${prevStep}${formData.plan ? `&plan=${formData.plan}` : ''}`);
  };

  const currentStepIndex = STEPS.indexOf(currentStep);

  return (
    <div className="container mx-auto py-12 pt-32">
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
              lang={lang}
            />
          )}
          {currentStep === 'payment' && (
            <PaymentStep
              plan={selectedPlanDetails}
              formData={formData}
              updateFormData={updateFormData}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              lang={lang}
            />
          )}
          {currentStep === 'domain' && (
            <DomainStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              lang={lang}
            />
          )}
          {currentStep === 'site-info' && (
            <SiteInfoStep
              formData={formData}
              updateFormData={updateFormData}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              lang={lang}
            />
          )}
          {currentStep === 'success' && <SuccessStep formData={formData} lang={lang} />}
        </div>
      </div>
    </div>
  );
}