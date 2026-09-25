import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { identifyStore } from "../services/socket";

export const StoreContext = createContext();

export const backendUrl = import.meta.env.VITE_BACKEND_URL;

const StoreContextProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("storeToken") || "");
  const [store, setStore] = useState(null);

  useEffect(() => {
    localStorage.setItem("storeToken", token);
  }, [token]);

  const loadProfile = async () => {
    if (!token) return;
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/store/profile`,
        {},
        { headers: { token } }
      );
      if (data.success) {
        setStore(data.store);
        identifyStore(backendUrl, data.store._id, token);
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (token) loadProfile();
  }, [token]);

  const logout = () => {
    setToken("");
    setStore(null);
    localStorage.removeItem("storeToken");
  };

  return (
    <StoreContext.Provider value={{ token, setToken, store, setStore, loadProfile, logout, backendUrl }}>
      {children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
