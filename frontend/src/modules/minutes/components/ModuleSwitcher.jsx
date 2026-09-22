import { NavLink } from "react-router-dom";

// The only visual change requested on the existing Home page: two options
// at the top to choose between the existing Ecommerce site and the new
// Velora Minutes module. Ecommerce itself is untouched.
const ModuleSwitcher = () => {
  const base = "flex-1 text-center py-2 rounded-full text-sm font-medium transition-colors";
  const active = "bg-black text-white";
  const inactive = "bg-gray-100 text-gray-600 hover:bg-gray-200";

  return (
    <div className="flex gap-2 mt-4 mb-2 max-w-md">
      <NavLink to="/" end className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
        Ecommerce
      </NavLink>
      <NavLink to="/minutes" className={({ isActive }) => `${base} ${isActive ? active : inactive}`}>
        Velora Minutes
      </NavLink>
    </div>
  );
};

export default ModuleSwitcher;
