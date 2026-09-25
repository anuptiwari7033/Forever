import axios from "axios";

export const loginStore = (backendUrl, payload) =>
  axios.post(`${backendUrl}/api/store/login`, payload);

export const getStoreOrders = (backendUrl, token) =>
  axios.post(`${backendUrl}/api/store/orders`, {}, { headers: { token } });

export const markOrderPacked = (backendUrl, token, orderId) =>
  axios.post(`${backendUrl}/api/store/order/mark-packed`, { orderId }, { headers: { token } });

export const getDailySales = (backendUrl, token, date) =>
  axios.post(`${backendUrl}/api/store/sales/daily`, { date }, { headers: { token } });

export const getMonthlySales = (backendUrl, token) =>
  axios.post(`${backendUrl}/api/store/sales/monthly`, {}, { headers: { token } });
