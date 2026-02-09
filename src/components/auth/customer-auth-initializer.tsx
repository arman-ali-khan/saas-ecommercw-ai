// src/components/auth/customer-auth-initializer.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useCustomerAuth } from '@/stores/useCustomerAuth';

export default function CustomerAuthInitializer() {
  const { refreshCustomer, customer, _hasHydrated } = useCustomerAuth();
  
  // এটি একটি 'লক' হিসেবে কাজ করবে
  const isInitialFetchDone = useRef(false);

  useEffect(() => {
    // কন্ডিশন: ১. হাইড্রেশন শেষ হতে হবে, ২. কাস্টমার থাকতে হবে, ৩. আগে কখনো ফেচ হয়নি
    if (_hasHydrated && customer && !isInitialFetchDone.current) {
      isInitialFetchDone.current = true; // সাথে সাথে লক করে দিন
      refreshCustomer();
    }
  }, [_hasHydrated, customer, refreshCustomer]);

  return null;
}