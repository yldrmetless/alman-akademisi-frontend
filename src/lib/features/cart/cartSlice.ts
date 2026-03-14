import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/lib/store";

export type CartItemType = "course" | "digital_product";

export interface CartItem {
    id: number | string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    type: CartItemType;
    stock_limit: number;
}

interface CartState {
    items: CartItem[];
}

export const CART_STORAGE_KEY = "cart_items_v1";

const loadCartItemsFromStorage = (): CartItem[] => {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed as CartItem[];
    } catch {
        return [];
    }
};

const initialState: CartState = {
    items: loadCartItemsFromStorage(),
};

const clampQuantity = (quantity: number, stockLimit: number) => {
    const safeStock = Math.max(0, stockLimit);
    if (safeStock === 0) return 0;
    return Math.min(safeStock, Math.max(1, quantity));
};

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addToCart: (state, action: PayloadAction<CartItem>) => {
            const incoming = action.payload;
            const stockLimit = Math.max(0, Number(incoming.stock_limit ?? 0));
            if (stockLimit === 0) return;

            const existingItem = state.items.find(
                (item) => item.id === incoming.id && item.type === incoming.type
            );

            if (existingItem) {
                existingItem.quantity = clampQuantity(existingItem.quantity + incoming.quantity, stockLimit);
                existingItem.stock_limit = stockLimit;
                existingItem.price = Number(incoming.price);
                existingItem.image = incoming.image;
                existingItem.name = incoming.name;
                return;
            }

            state.items.push({
                ...incoming,
                price: Number(incoming.price),
                stock_limit: stockLimit,
                quantity: clampQuantity(incoming.quantity, stockLimit),
            });
        },
        removeFromCart: (state, action: PayloadAction<{ id: number | string; type: CartItemType }>) => {
            state.items = state.items.filter(
                (item) => !(item.id === action.payload.id && item.type === action.payload.type)
            );
        },
        updateQuantity: (
            state,
            action: PayloadAction<{ id: number | string; type: CartItemType; quantity: number }>
        ) => {
            const target = state.items.find(
                (item) => item.id === action.payload.id && item.type === action.payload.type
            );
            if (!target) return;

            target.quantity = clampQuantity(action.payload.quantity, target.stock_limit);
        },
        clearCart: (state) => {
            state.items = [];
        },
    },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartCount = createSelector([selectCartItems], (items) => items.length);
export const selectCartTotalPrice = createSelector([selectCartItems], (items) =>
    items.reduce((total, item) => total + item.price * item.quantity, 0)
);
