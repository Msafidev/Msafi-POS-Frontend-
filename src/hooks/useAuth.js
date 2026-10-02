import { useSelector, useDispatch } from "react-redux";
import { logout as logoutAction } from "../store/slices/authSlice";

export function useAuth() {
  const { user, accessToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  return {
    user,
    isAuthenticated: Boolean(accessToken && user),
    role: user?.role,
    logout: () => {
      dispatch(logoutAction());
    },
  };
}
