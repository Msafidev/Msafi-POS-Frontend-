import { createSlice } from "@reduxjs/toolkit";

const persisted = JSON.parse(localStorage.getItem("msafipos_auth") || "null");

const initialState = persisted || {
  user: null,
  accessToken: null,
  refreshToken: null,
};

function persist(state) {
  localStorage.setItem("msafipos_auth", JSON.stringify(state));
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, access, refresh } = action.payload;
      state.user = user;
      state.accessToken = access;
      state.refreshToken = refresh;
      persist(state);
    },
    setTokens(state, action) {
      const { accessToken, refreshToken } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      persist(state);
    },
    setUser(state, action) {
      state.user = action.payload;
      persist(state);
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem("msafipos_auth");
    },
  },
});

export const { setCredentials, setTokens, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
