'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';

interface CartState {
  cartItems: CartItem[];
  lastOrder: any | null;
  _hasHydrated: boolean;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setLastOrder: (order: any | null) => void;
  setHasHydrated: (hydrated: boolean) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      cartItems: [],
      lastOrder: null,
      _hasHydrated: false,
      setHasHydrated: (hydrated) => {
        set({ _hasHydrated: hydrated });
      },
      addToCart: (product, quantity) => {
        const { cartItems } = get();
        const existingItem = cartItems.find((item) => item.id === product.id);
        const updatedItems = existingItem
          ? cartItems.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          : [...cartItems, { ...product, quantity }];
        set({ cartItems: updatedItems });
      },
      removeFromCart: (productId) => {
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.id !== productId),
        }));
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          ),
        }));
      },
      clearCart: () => {
        set({ cartItems: [] });
      },
      setLastOrder: (order: any | null) => {
        set({ lastOrder: order });
      },
    }),
    {
      name: 'bangla-naturals-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cartItems: state.cartItems,
        lastOrder: state.lastOrder,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
