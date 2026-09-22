// import { io } from "socket.io-client";

// let socket = null;

// // A single shared socket for the whole customer session — created lazily
// // so we don't open a connection until the user actually opens Forever Minutes.
// export const getSocket = (backendUrl) => {
//   if (!socket) {
//     socket = io(backendUrl, { transports: ["websocket"], autoConnect: true });
//   }
//   return socket;
// };

// export const joinOrderRoom = (backendUrl, orderId) => {
//   const s = getSocket(backendUrl);
//   s.emit("join-order", { orderId });
//   return s;
// };

// export const leaveOrderRoom = (backendUrl, orderId) => {
//   if (!socket) return;
//   socket.emit("leave-order", { orderId });
// };

// export const identifyCustomer = (backendUrl, userId) => {
//   const s = getSocket(backendUrl);
//   s.emit("customer-connected", { userId });
// };
import { io } from "socket.io-client";

let socket = null;

export const getSocket = (backendUrl) => {
  if (!socket) {
    socket = io(backendUrl, {
      transports: ["websocket"],
      autoConnect: true,
    });
  }
  return socket;
};

export const identifyCustomer = (backendUrl, token) => {
  const s = getSocket(backendUrl);

  if (!token) return;

  const payload = JSON.parse(atob(token.split(".")[1]));

  s.emit("customer-connected", {
    userId: payload.id,
  });
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
