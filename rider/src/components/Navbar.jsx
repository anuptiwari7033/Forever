import { useContext } from "react";
import { Link } from "react-router-dom";
import { RiderContext } from "../context/RiderContext";

const Navbar = () => {
  const { rider, logout } = useContext(RiderContext);

  return (
    <div className="flex items-center justify-between py-3 px-4 sm:px-[5vw] border-b border-gray-200 bg-white">
      <Link to="/" className="text-lg font-semibold text-green-700">
        Velora Minutes · Rider
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {rider && <span className="text-gray-600">Hi, {rider.name}</span>}
        <Link to="/profile" className="text-gray-600 hover:text-green-700">
          Profile
        </Link>
        <Link to="/history" className="text-gray-600 hover:text-green-700">
          History
        </Link>
        <button onClick={logout} className="text-red-500">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;
