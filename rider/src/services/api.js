import axios from "axios";

// export const fetchStoreList = (backendUrl) =>
//   axios.get(`${backendUrl}/api/minutes/store/names`);

// export const registerRider = (backendUrl, payload) =>
//   axios.post(`${backendUrl}/api/rider/register`, payload);

export const loginRider = (backendUrl, payload) =>
  axios.post(`${backendUrl}/api/rider/login`, payload);

export const updateRiderProfile = (backendUrl, token, formData) =>
  axios.post(`${backendUrl}/api/rider/profile/update`, formData, { headers: { token } });

export const toggleRiderStatus = (backendUrl, token, lat, lng) =>
  axios.post(`${backendUrl}/api/rider/toggle-status`, { lat, lng }, { headers: { token } });

export const getAssignedOrder = (backendUrl, token) =>
  axios.post(`${backendUrl}/api/rider/assigned-order`, {}, { headers: { token } });

export const getRiderOrderHistory = (backendUrl, token) =>
  axios.post(`${backendUrl}/api/rider/order-history`, {}, { headers: { token } });

export const acceptOrderRest = (backendUrl, token, orderId) =>
  axios.post(`${backendUrl}/api/rider/order/accept`, { orderId }, { headers: { token } });

export const rejectOrderRest = (backendUrl, token, orderId) =>
  axios.post(`${backendUrl}/api/rider/order/reject`, { orderId }, { headers: { token } });

export const arrivedAtStoreRest = (backendUrl, token, orderId) =>
  axios.post(`${backendUrl}/api/rider/order/arrived-at-store`, { orderId }, { headers: { token } });

export const pickupOrderRest = (backendUrl, token, orderId) =>
  axios.post(`${backendUrl}/api/rider/order/pickup`, { orderId }, { headers: { token } });

export const deliveredOrderRest = (backendUrl, token, orderId) =>
  axios.post(`${backendUrl}/api/rider/order/delivered`, { orderId }, { headers: { token } });

export const getRiderNotifications = (backendUrl, token) =>
  axios.get(`${backendUrl}/api/notification/rider`, { headers: { token } });
