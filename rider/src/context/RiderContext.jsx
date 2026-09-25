import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { identifyRider } from "../services/socket";

export const RiderContext = createContext();

export const backendUrl = import.meta.env.VITE_BACKEND_URL;

const RiderContextProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("riderToken") || "");
  const [rider, setRider] = useState(null);

  useEffect(() => {
    localStorage.setItem("riderToken", token);
  }, [token]);

  const loadProfile = async () => {
    if (!token) return;
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/rider/profile`,
        {},
        { headers: { token } }
      );
      if (data.success) {
        setRider(data.rider);
        identifyRider(backendUrl, data.rider._id, token);
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
    setRider(null);
    localStorage.removeItem("riderToken");
  };

  return (
    <RiderContext.Provider
      value={{ token, setToken, rider, setRider, loadProfile, logout, backendUrl }}
    >
      {children}
    </RiderContext.Provider>
  );
};

export default RiderContextProvider;
