import { io } from "socket.io-client";

let socket = null;

export const getSocket = (backendUrl) => {
  if (!socket) {
    socket = io(backendUrl, { transports: ["websocket"], autoConnect: true });
  }
  return socket;
};

export const identifyRider = (backendUrl, riderId, token) => {
  const s = getSocket(backendUrl);
  s.emit("rider-connected", { riderId, token });
};

export const joinOrderRoom = (backendUrl, orderId) => {
  const s = getSocket(backendUrl);
  s.emit("join-order", { orderId });
  return s;
};

export const leaveOrderRoom = (backendUrl, orderId) => {
  if (!socket) return;
  socket.emit("leave-order", { orderId });
};

export const emitLocationUpdate = (backendUrl, orderId, riderId, lat, lng) => {
  const s = getSocket(backendUrl);
  s.emit("location-update", { orderId, riderId, lat, lng });
};
