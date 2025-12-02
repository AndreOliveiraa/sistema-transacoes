import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";

const useAutoLogout = (timeoutMs) => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  const doLogout = useCallback(() => {
    if (token) {
      alert("Sessão expirada por inatividade.");
      dispatch(logout());
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (!token) return;

    let timer;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(doLogout, timeoutMs);
    };

    const events = [
      "load",
      "mousemove",
      "mousedown",
      "click",
      "scroll",
      "keypress",
    ];

    resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [token, doLogout, timeoutMs]);
};

export default useAutoLogout;
