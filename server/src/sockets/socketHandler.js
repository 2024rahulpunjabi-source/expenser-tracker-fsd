import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Message } from '../models/Message.js';
import { logger } from '../utils/logger.js';

let ioInstance = null;
const onlineUsers = new Map(); // userId -> { socketId, name, role }

export const initSocket = (httpServer) => {
  const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

  ioInstance = new Server(httpServer, {
    cors: {
      origin: [allowedOrigin, 'http://localhost:3000', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Socket authentication middleware
  ioInstance.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'dev_secret_key_123456'
      );

      const user = await User.findById(decoded.id).select('name email role avatar');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  ioInstance.on('connection', (socket) => {
    const user = socket.user;
    logger.info(`WebSocket connected: ${user.name} (${user.email}) - Socket: ${socket.id}`);

    // Track online user
    onlineUsers.set(user._id.toString(), {
      socketId: socket.id,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    });

    // Join personal user room for targeted notifications
    socket.join(`user:${user._id}`);

    // Join default chat room
    socket.join('general');

    // Broadcast updated online count
    ioInstance.emit('users:online', {
      count: onlineUsers.size,
      users: Array.from(onlineUsers.values()).map((u) => ({
        name: u.name,
        role: u.role,
      })),
    });

    // Handle room join
    socket.on('room:join', (room) => {
      socket.join(room);
      logger.debug(`${user.name} joined room ${room}`);
    });

    // Handle live message event from client
    socket.on('chat:send', async ({ message, room = 'general' }) => {
      try {
        if (!message || !message.trim()) return;

        const newMsg = await Message.create({
          sender: user._id,
          senderName: user.name,
          senderRole: user.role,
          room,
          message: message.trim(),
        });

        await newMsg.populate('sender', 'name email role avatar');
        ioInstance.to(room).emit('chat:message', newMsg);
      } catch (err) {
        logger.error(`Error broadcasting chat message: ${err.message}`);
      }
    });

    // Handle typing indicators
    socket.on('chat:typing', ({ room = 'general', isTyping }) => {
      socket.to(room).emit('chat:user_typing', {
        userId: user._id,
        userName: user.name,
        isTyping,
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      onlineUsers.delete(user._id.toString());
      logger.info(`WebSocket disconnected: ${user.name}`);
      ioInstance.emit('users:online', {
        count: onlineUsers.size,
        users: Array.from(onlineUsers.values()).map((u) => ({
          name: u.name,
          role: u.role,
        })),
      });
    });
  });

  return ioInstance;
};

export const getIO = () => {
  return ioInstance;
};
