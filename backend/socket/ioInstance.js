// Shared Socket.IO instance holder.
// Controllers/services import this instead of importing server.js directly,
// which avoids circular imports while still letting any module emit events.
let ioInstance = null;

export const setIO = (io) => {
  ioInstance = io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.IO has not been initialized yet.");
  }
  return ioInstance;
};

export default { setIO, getIO };
