import { Route, Routes } from "react-router-dom";
import { useContext } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RiderContext } from "./context/RiderContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ActiveOrder from "./pages/ActiveOrder";
import Profile from "./pages/Profile";
import OrderHistory from "./pages/OrderHistory";

const App = () => {
  const { token } = useContext(RiderContext);

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer />
      {token === "" ? (
        <Login />
      ) : (
        <>
          <Navbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/order" element={<ActiveOrder />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/history" element={<OrderHistory />} />
          </Routes>
        </>
      )}
    </div>
  );
};

export default App;
