let io = null;

const socketAuthMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    socket.user = {
      userId: payload.id || payload.userId || payload.sub || 'unknown',
      roles: payload.roles || [],
    };
    next();
  } catch {
    next(new Error('Invalid token'));
  }
};

module.exports = {
  setIo: (instance) => {
    io = instance;
    io.use(socketAuthMiddleware);
    io.on('connection', (socket) => {
      socket.on('disconnect', () => {});
    });
  },
  emit: (event, data) => { if (io) io.emit(event, data || {}); },
};
