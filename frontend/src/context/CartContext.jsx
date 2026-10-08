import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const EMPTY = { items: [], totalItems: 0, subtotal: 0 };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(EMPTY);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch {
      /* keep the previous cart; pages show their own errors */
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load the cart whenever the logged-in user changes; clear it on logout.
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Each action returns the updated cart and throws on API errors (callers show the message).
  const addToCart = useCallback(async (bookId, quantity = 1) => {
    const { data } = await api.post('/cart', { bookId, quantity });
    setCart(data);
    return data;
  }, []);

  const updateQuantity = useCallback(async (bookId, quantity) => {
    const { data } = await api.put(`/cart/${bookId}`, { quantity });
    setCart(data);
    return data;
  }, []);

  const removeItem = useCallback(async (bookId) => {
    const { data } = await api.delete(`/cart/${bookId}`);
    setCart(data);
    return data;
  }, []);

  const clearCart = useCallback(async () => {
    const { data } = await api.delete('/cart');
    setCart(data);
    return data;
  }, []);

  const value = useMemo(
    () => ({
      cart,
      items: cart.items,
      itemCount: cart.totalItems,
      subtotal: cart.subtotal,
      loading,
      refresh,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [cart, loading, refresh, addToCart, updateQuantity, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
