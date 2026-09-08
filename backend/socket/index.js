import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { setIO } from "./ioInstance.js";

// Initializes Socket.IO on top of the existing HTTP server.
// This does not touch any existing REST route/controller — it is purely additive.
const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  setIO(io);

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Lightweight identity handshake so we know if this socket belongs to a
    // customer, a rider, or an anonymous/admin viewer.
    socket.on("customer-connected", ({ userId }) => {
      socket.userId = userId;
      socket.role = "customer";
      if (userId) socket.join(`customer:${userId}`);
    });

    socket.on("rider-connected", ({ riderId, token }) => {
      try {
        if (token) jwt.verify(token, process.env.JWT_SECRET);
      } catch (e) {
        socket.emit("error", { message: "Invalid rider token" });
        return;
      }
      socket.riderId = riderId;
      socket.role = "rider";
      if (riderId) socket.join(`rider:${riderId}`);
    });

    socket.on("store-connected", ({ storeId, token }) => {
      try {
        if (token) jwt.verify(token, process.env.JWT_SECRET);
      } catch (e) {
        socket.emit("error", { message: "Invalid store token" });
        return;
      }
      socket.storeId = storeId;
      socket.role = "store";
      if (storeId) socket.join(`store:${storeId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export default initSocket;
