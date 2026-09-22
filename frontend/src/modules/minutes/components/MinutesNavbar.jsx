import { Link } from "react-router-dom";
import { useContext } from "react";
import { MinutesContext } from "../context/MinutesContext";

// This is Velora Minutes' own header — separate from the ecommerce Navbar.
// It's mounted once inside MinutesApp.jsx so it shows on every /minutes/* page.
const MinutesNavbar = () => {
  const { getMinutesCartCount } = useContext(MinutesContext);

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 mb-2">
      <Link to="/minutes" className="text-lg font-semibold text-green-700">
        Velora Minutes
      </Link>

      <div className="flex items-center gap-5 text-sm text-gray-600">
        <Link to="/minutes/orders" className="hover:text-green-700">
          Orders
        </Link>
        <Link to="/minutes/wallet" className="hover:text-green-700">
          Wallet
        </Link>
        {/* <Link to="/minutes/addresses" className="hover:text-green-700">
          Addresses
        </Link> */}
        <Link to="/minutes/notifications" className="hover:text-green-700">
          Notifications
        </Link>
        <Link to="/minutes/cart" className="font-medium text-green-700">
          Cart ({getMinutesCartCount()})
        </Link>
      </div>
    </div>
  );
};

export default MinutesNavbar;
