import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    // This replaces your "Restore session" useEffect logic
    user: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null,
    token: localStorage.getItem("token") || null,
    loading: false, 
  },
  reducers: {
    // This replaces your login() function
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    },
    // This replaces your logout() function
    logOut: (state) => {
      state.user = null;
      state.token = null;
      localStorage.clear();
      // Using window.location.href here is fine, but usually 
      // we navigate using React Router after dispatching this.
      window.location.href = "/login";
    },
  },
});

export const { setCredentials, logOut } = authSlice.actions;
export default authSlice.reducer;