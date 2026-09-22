import { Routes, Route } from "react-router-dom";
import MinutesContextProvider from "./context/MinutesContext";
import MinutesHome from "./pages/MinutesHome";
import StoreProducts from "./pages/StoreProducts";
import ProductDetails from "./pages/ProductDetails";
import { CategoryProducts, SearchResults } from "./pages/CategoryAndSearch";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderTracking from "./pages/OrderTracking";
import Addresses from "./pages/Addresses";
import Wallet from "./pages/Wallet";
import Notifications from "./pages/Notifications";
import MinutesNavbar from "./components/MinutesNavbar";

// Mounted as <Route path="/minutes/*" element={<MinutesApp />} /> in the
// existing App.jsx. Everything here is additive — none of the existing
// ecommerce routes/pages are touched.
const MinutesApp = () => {
  return (
    <MinutesContextProvider>
      <MinutesNavbar />
      <Routes>
        <Route path="/" element={<MinutesHome />} />
        <Route path="store/:storeId" element={<StoreProducts />} />
        <Route path="product/:productId" element={<ProductDetails />} />
        <Route path="category/:categoryName" element={<CategoryProducts />} />
        <Route path="search" element={<SearchResults />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:orderId" element={<OrderTracking />} />
        <Route path="addresses" element={<Addresses />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="notifications" element={<Notifications />} />
      </Routes>
    </MinutesContextProvider>
  );
};

export default MinutesApp;
