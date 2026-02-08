import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
};

// Mock initial data based on the landing page
const initialPlans: Plan[] = [
    {
      id: 'free',
      name: 'শুরু',
      price: 'বিনামূল্যে',
      period: '',
      description: 'আপনার যাত্রা শুরু করার জন্য আদর্শ।',
      features: [
        '১০টি পণ্য পর্যন্ত',
        'বেসিক স্টোর কাস্টমাইজেশন',
        'ব্যক্তিগত ব্যবহারকারীর পৃষ্ঠা',
      ],
    },
    {
      id: 'pro',
      name: 'প্রো',
      price: '৳ ৯৯৯',
      period: '/মাস',
      description: 'আপনার ব্যবসা বাড়ানোর জন্য শক্তিশালী সরঞ্জাম।',
      features: [
        'সীমাহীন পণ্য',
        'উন্নত কাস্টমাইজেশন',
        'এআই-চালিত সরঞ্জাম',
        'অগ্রাধিকার সমর্থন',
      ],
    },
    {
      id: 'enterprise',
      name: 'এন্টারপ্রাইজ',
      price: 'কাস্টম',
      period: '',
      description: 'বড় আকারের ব্যবসার জন্য উপযুক্ত সমাধান।',
      features: [
        'প্রো-এর সবকিছু',
        'ডেডিকেটেড অ্যাকাউন্ট ম্যানেজার',
        'কাস্টম ইন্টিগ্রেশন',
        'এসএলএ',
      ],
    },
];

interface PlansState {
  plans: Plan[];
  addPlan: (plan: Omit<Plan, 'id' | 'features'> & { features: string }) => void;
  updatePlan: (plan: Omit<Plan, 'features'> & { features: string }) => void;
  deletePlan: (planId: string) => void;
}

export const usePlans = create<PlansState>()(
  persist(
    (set) => ({
      plans: initialPlans,
      addPlan: (planData) => {
        const newPlan = {
            ...planData,
            id: Date.now().toString(),
            features: planData.features.split('\n').filter(f => f.trim() !== '')
        };
        set((state) => ({
          plans: [...state.plans, newPlan],
        }));
      },
      updatePlan: (updatedPlanData) => {
        const updatedPlan = {
            ...updatedPlanData,
            features: updatedPlanData.features.split('\n').filter(f => f.trim() !== '')
        }
        set((state) => ({
          plans: state.plans.map((p) =>
            p.id === updatedPlan.id ? updatedPlan : p
          ),
        }));
      },
      deletePlan: (planId) => {
        set((state) => ({
          plans: state.plans.filter((p) => p.id !== planId),
        }));
      },
    }),
    {
      name: 'bangla-naturals-plans',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
