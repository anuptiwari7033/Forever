import { Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import PlaceOrder from "./pages/PlaceOrder";
import Orders from "./pages/Orders";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Verify from "./pages/Verify";
import SearchBar from "./components/SearchBar";
import MinutesApp from "./modules/minutes/MinutesApp";
import ModuleSwitcher from "./modules/minutes/components/ModuleSwitcher";

const App = () => {
  const location = useLocation();
  // Sirf yehi ek line decide karti hai ki hum Velora Minutes ke andar hain ya Ecommerce me
  const isMinutes = location.pathname.startsWith("/minutes");

  return (
    <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] ">
      <ToastContainer />

      {/* Switcher hamesha top pe dikhega, dono modules me, taaki wapas switch kar sako */}
      <ModuleSwitcher />

      {/* Ecommerce ka Navbar + SearchBar sirf Ecommerce routes pe */}
      {!isMinutes && (
        <>
          <Navbar />
          <SearchBar />
        </>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/product/:productId" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/place-order" element={<PlaceOrder />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/verify" element={<Verify />} />
        {/* Velora Minutes — new quick-commerce module, fully additive */}
        <Route path="/minutes/*" element={<MinutesApp />} />
      </Routes>

      {!isMinutes && <Footer />}
    </div>
  );
};

export default App;
