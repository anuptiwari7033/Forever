import { io } from "socket.io-client";

let socket = null;

export const getSocket = (backendUrl) => {
  if (!socket) {
    socket = io(backendUrl, { transports: ["websocket"], autoConnect: true });
  }
  return socket;
};

export const identifyStore = (backendUrl, storeId, token) => {
  const s = getSocket(backendUrl);
  s.emit("store-connected", { storeId, token });
};
