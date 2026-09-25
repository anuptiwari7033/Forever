import { useContext } from "react";
import { Link } from "react-router-dom";
import { StoreContext } from "../context/StoreContext";

const Navbar = () => {
  const { store, logout } = useContext(StoreContext);

  return (
    <div className="flex items-center justify-between py-3 px-4 sm:px-[5vw] border-b border-gray-200 bg-white">
      <Link to="/" className="text-lg font-semibold text-green-700">
        Velora Minutes · Store Panel
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {store && <span className="text-gray-600">{store.name}</span>}
        <Link to="/" className="text-gray-600 hover:text-green-700">
          Orders
        </Link>
        <Link to="/sales" className="text-gray-600 hover:text-green-700">
          Sales
        </Link>
        <button onClick={logout} className="text-red-500">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;
