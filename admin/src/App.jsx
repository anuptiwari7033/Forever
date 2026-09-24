import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import SideBar from "./components/SideBar";
import Add from "./pages/Add";
import List from "./pages/List";
import Order from "./pages/Order";
import MinutesStores from "./pages/minutes/MinutesStores";
import MinutesCategories from "./pages/minutes/MinutesCategories";
import MinutesProducts from "./pages/minutes/MinutesProducts";
import MinutesOrders from "./pages/minutes/MinutesOrders";
import Riders from "./pages/minutes/Riders";
import LiveTracking from "./pages/minutes/LiveTracking";
import Analytics from "./pages/minutes/Analytics";
import { useEffect, useState } from "react";
import Login from "./components/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const currency = "$";

const App = () => {
  const [token, setToken] = useState(
    localStorage.getItem("token") ? localStorage.getItem("token") : ""
  );

  useEffect(() => {
    localStorage.setItem("token", token);
  }, [token]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer />
      {token === "" ? (
        <Login setToken={setToken} />
      ) : (
        <>
          <Navbar setToken={setToken} />
          <hr />
          <div className="flex w-full">
            <SideBar />
            <div className="w-[70%] mx-auto ml-[max(5vw, 25px)], my-8 text-gray-600 text-base">
              <Routes>
                <Route path="/add" element={<Add token={token} />} />
                <Route path="/list" element={<List token={token} />} />
                <Route path="/order" element={<Order token={token} />} />
                <Route path="/minutes/stores" element={<MinutesStores token={token} />} />
                <Route path="/minutes/categories" element={<MinutesCategories token={token} />} />
                <Route path="/minutes/products" element={<MinutesProducts token={token} />} />
                <Route path="/minutes/orders" element={<MinutesOrders token={token} />} />
                <Route path="/minutes/riders" element={<Riders token={token} />} />
                <Route path="/minutes/live-tracking" element={<LiveTracking token={token} />} />
                <Route path="/minutes/analytics" element={<Analytics token={token} />} />
              </Routes>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
