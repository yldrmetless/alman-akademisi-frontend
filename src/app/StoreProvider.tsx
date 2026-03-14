'use client';

import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from '../lib/store';
import { CART_STORAGE_KEY } from '@/lib/features/cart/cartSlice';

export default function StoreProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const storeRef = useRef<AppStore | null>(null);
    if (!storeRef.current) {
        storeRef.current = makeStore();
    }

    useEffect(() => {
        if (!storeRef.current) return;

        const unsubscribe = storeRef.current.subscribe(() => {
            const state = storeRef.current?.getState();
            if (!state) return;

            try {
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart.items));
            } catch {
                // Ignore storage quota/private mode errors safely.
            }
        });

        return unsubscribe;
    }, []);

    return <Provider store={storeRef.current}>{children}</Provider>;
}
