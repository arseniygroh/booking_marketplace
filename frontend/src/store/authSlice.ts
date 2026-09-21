import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { User, AuthState } from '../types';

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
        },
    }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;