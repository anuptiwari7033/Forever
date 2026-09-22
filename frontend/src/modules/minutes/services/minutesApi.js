import axios from "axios";

// Every function takes backendUrl/token explicitly instead of importing a
// singleton, so it stays easy to test and mirrors how ShopContext.jsx
// already calls axios (headers: { token }).

export const fetchCategories = (backendUrl) =>
  axios.get(`${backendUrl}/api/minutes/category/list`);

export const fetchNearbyStores = (backendUrl, lat, lng) =>
  axios.get(`${backendUrl}/api/minutes/store/nearby`, { params: { lat, lng } });

export const fetchStoreCategories = (backendUrl, storeId) =>
  axios.get(`${backendUrl}/api/minutes/category/store/${storeId}`);

export const fetchStore = (backendUrl, storeId) =>
  axios.get(`${backendUrl}/api/minutes/store/${storeId}`);

export const fetchStoreProducts = (backendUrl, storeId) =>
  axios.get(`${backendUrl}/api/minutes/product/store/${storeId}`);

export const fetchProductsByCategory = (backendUrl, category) =>
  axios.get(`${backendUrl}/api/minutes/product/category/${category}`);

export const searchMinuteProducts = (backendUrl, q) =>
  axios.get(`${backendUrl}/api/minutes/product/search`, { params: { q } });

export const fetchProduct = (backendUrl, productId) =>
  axios.get(`${backendUrl}/api/minutes/product/${productId}`);

export const placeMinuteOrder = (backendUrl, token, payload) =>
  axios.post(`${backendUrl}/api/minutes/order/place`, payload, { headers: { token } });

export const fetchMyMinuteOrders = (backendUrl, token) =>
  axios.post(`${backendUrl}/api/minutes/order/user-orders`, {}, { headers: { token } });

export const fetchMinuteOrder = (backendUrl, token, orderId) =>
  axios.get(`${backendUrl}/api/minutes/order/${orderId}`, { headers: { token } });

export const cancelMinuteOrder = (backendUrl, token, orderId) =>
  axios.post(`${backendUrl}/api/minutes/order/cancel`, { orderId }, { headers: { token } });

export const fetchAddresses = (backendUrl, token) =>
  axios.post(`${backendUrl}/api/minutes/address/list`, {}, { headers: { token } });

export const addAddress = (backendUrl, token, payload) =>
  axios.post(`${backendUrl}/api/minutes/address/add`, payload, { headers: { token } });

export const removeAddress = (backendUrl, token, addressId) =>
  axios.post(`${backendUrl}/api/minutes/address/remove`, { addressId }, { headers: { token } });

export const applyCoupon = (backendUrl, token, code, orderAmount) =>
  axios.post(`${backendUrl}/api/minutes/coupon/apply`, { code, orderAmount }, { headers: { token } });

export const fetchWallet = (backendUrl, token) =>
  axios.post(`${backendUrl}/api/minutes/wallet/get`, {}, { headers: { token } });

// Server-persisted Forever Minutes cart — separate from the ecommerce
// cart, so switching modules or logging out/in never wipes either one.
export const fetchMinutesCart = (backendUrl, token) =>
  axios.post(`${backendUrl}/api/minutes/cart/get`, {}, { headers: { token } });

export const syncMinutesCart = (backendUrl, token, payload) =>
  axios.post(`${backendUrl}/api/minutes/cart/sync`, payload, { headers: { token } });

export const fetchNotifications = (backendUrl, token) =>
  axios.get(`${backendUrl}/api/notification/customer`, { headers: { token } });

export const fetchLiveTracking = (backendUrl, token, orderId) =>
  axios.get(`${backendUrl}/api/tracking/live/${orderId}`, { headers: { token } });
