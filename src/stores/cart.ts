
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';

interface CartState {
  cartItems: CartItem[];
  lastOrder: any | null;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string, unit?: string | null) => void;
  updateQuantity: (productId: string, quantity: number, unit?: string | null) => void;
  clearCart: () => void;
  setLastOrder: (order: any | null) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      cartItems: [],
      lastOrder: null,
      addToCart: (product, quantity) => {
        const { cartItems } = get();
        const selectedUnit = (product as any).selected_unit || null;
        
        const existingItem = cartItems.find((item) => 
            item.id === product.id && item.selected_unit === selectedUnit
        );

        const updatedItems = existingItem
          ? cartItems.map((item) =>
              (item.id === product.id && item.selected_unit === selectedUnit)
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          : [...cartItems, { ...product, selected_unit: selectedUnit, quantity } as CartItem];
        
        set({ cartItems: updatedItems });
      },
      removeFromCart: (productId, unit) => {
        const targetUnit = unit === undefined ? null : unit;
        set((state) => ({
          cartItems: state.cartItems.filter((item) => 
            !(item.id === productId && (item.selected_unit || null) === targetUnit)
          ),
        }));
      },
      updateQuantity: (productId, quantity, unit) => {
        const targetUnit = unit === undefined ? null : unit;
        if (quantity <= 0) {
          get().removeFromCart(productId, targetUnit);
          return;
        }
        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            (item.id === productId && (item.selected_unit || null) === targetUnit) 
                ? { ...item, quantity } 
                : item
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
    }
  )
);
