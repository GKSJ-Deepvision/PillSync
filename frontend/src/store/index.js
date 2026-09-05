import { configureStore } from '@reduxjs/toolkit';

import authReducer from './authSlice.js';

export function createStore(preloadedState) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState,
  });
}

/** The application store. Tests build their own with `createStore`. */
export const store = createStore();

export default store;
