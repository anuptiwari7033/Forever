import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ShopContext } from "../../../context/ShopContext";
import {
  fetchWallet as apiFetchWallet,
  fetchAddresses as apiFetchAddresses,
  fetchMinutesCart as apiFetchMinutesCart,
  syncMinutesCart as apiSyncMinutesCart,
} from "../services/minutesApi";
import { identifyCustomer } from "../services/socketService";

export const MinutesContext = createContext();

const ADDRESS_STORAGE_KEY = "minutes_confirmed_address";

const readStoredAddress = (currentToken) => {
  try {
    const raw = localStorage.getItem(ADDRESS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed.token !== currentToken || !parsed.address) return null;

    return parsed.address;
  } catch (e) {
    return null;
  }
};

// Deliberately reuses ShopContext's `token` / `backendUrl` / `navigate`
// instead of re-implementing login, per the "reuse existing authentication"
// requirement — a customer who is logged into the ecommerce side is
// automatically logged into Velora Minutes too.
const MinutesContextProvider = ({ children }) => {
  const { token, backendUrl, navigate } = useContext(ShopContext);

  const [minutesCart, setMinutesCart] = useState({}); // { productId: { product, quantity } }
  const [selectedStore, setSelectedStore] = useState(null);
  const [cartLoaded, setCartLoaded] = useState(false); // gates the sync effect below until the server copy has actually loaded
  const [addresses, setAddresses] = useState([]);

  const [selectedAddress, setSelectedAddress] = useState(() =>
    readStoredAddress(token)
  );

  const [addressConfirmed, setAddressConfirmedState] = useState(
    () => !!readStoredAddress(token)
  );

  const confirmAddress = (address) => {
    setSelectedAddress(address);
    setAddressConfirmedState(true);

    try {
      localStorage.setItem(
        ADDRESS_STORAGE_KEY,
        JSON.stringify({ token, address })
      );
    } catch (e) {}
  };

  const clearConfirmedAddress = () => {
    setAddressConfirmedState(false);

    try {
      localStorage.removeItem(ADDRESS_STORAGE_KEY);
    } catch (e) {}
  };

  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });

  const addToMinutesCart = (product, quantity = 1) => {
    if (selectedStore && product.storeId && product.storeId !== selectedStore) {
      const confirmSwitch = window.confirm(
        "Your cart has items from another store. Start a new cart for this store?"
      );
      if (!confirmSwitch) return;
      setMinutesCart({});
    }

    setSelectedStore(product.storeId);
    setMinutesCart((prev) => {
      const existing = prev[product._id];
      return {
        ...prev,
        [product._id]: {
          product,
          quantity: (existing?.quantity || 0) + quantity,
        },
      };
    });
    toast.success(`${product.name} added to cart`);
  };

  const updateMinutesCartQuantity = (productId, quantity) => {
    setMinutesCart((prev) => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[productId];
      } else {
        next[productId] = { ...next[productId], quantity };
      }
      return next;
    });
  };

  const clearMinutesCart = () => {
    setMinutesCart({});
    setSelectedStore(null);
  };

  const getMinutesCartCount = () =>
    Object.values(minutesCart).reduce((sum, item) => sum + item.quantity, 0);

  const getMinutesCartAmount = () =>
    Object.values(minutesCart).reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

  const loadAddresses = async () => {
    if (!token) return;

    try {
      const { data } = await apiFetchAddresses(backendUrl, token);

      if (data.success) {
        setAddresses(data.addresses);

        if (!addressConfirmed) {
          const def =
            data.addresses.find((a) => a.isDefault) || data.addresses[0];

          if (def) setSelectedAddress(def);
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  const loadWallet = async () => {
    if (!token) return;
    try {
      const { data } = await apiFetchWallet(backendUrl, token);
      if (data.success) setWallet(data.wallet);
    } catch (e) {
      console.log(e);
    }
  };

  // ---- Minutes cart: load from server on mount, then keep server in sync ----
  const loadMinutesCart = async () => {
    if (!token) {
      setCartLoaded(true);
      return;
    }
    try {
      const { data } = await apiFetchMinutesCart(backendUrl, token);
      if (data.success) {
        setMinutesCart(data.cartData || {});
        setSelectedStore(data.selectedStore || null);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setCartLoaded(true);
    }
  };

  useEffect(() => {
    if (token) {
      loadAddresses();
      loadWallet();
      loadMinutesCart();
    } else {
      setCartLoaded(true);
    }
  }, [token]);

  // Skip the very first render after load so we don't immediately re-save
  // the exact data we just fetched; every real change after that gets
  // pushed to the server so it survives leaving /minutes/* or logging out.
  const firstSyncSkipped = useRef(false);

  useEffect(() => {
    if (!cartLoaded || !token) return;

    if (!firstSyncSkipped.current) {
      firstSyncSkipped.current = true;
      return;
    }

    apiSyncMinutesCart(backendUrl, token, {
      cartData: minutesCart,
      selectedStore,
    }).catch(console.log);
  }, [minutesCart, selectedStore, cartLoaded, token]);

  useEffect(() => {
    // Best-effort socket identity handshake so the backend can route
    // notifications/order updates to this browser tab.
    try {
      identifyCustomer(backendUrl, token);
    } catch (e) {}
  }, [backendUrl, token]);

  const value = {
    token,
    backendUrl,
    navigate,
    minutesCart,
    addToMinutesCart,
    updateMinutesCartQuantity,
    clearMinutesCart,
    getMinutesCartCount,
    getMinutesCartAmount,
    selectedStore,
    setSelectedStore,
    addresses,
    loadAddresses,
    selectedAddress,
    setSelectedAddress,
    addressConfirmed,
    confirmAddress,
    clearConfirmedAddress,
    wallet,
    loadWallet,
  };

  return (
    <MinutesContext.Provider value={value}>
      {children}
    </MinutesContext.Provider>
  );
};

export default MinutesContextProvider;