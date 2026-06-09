import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

const connectedRiders = new Map<string, string>(); // riderId -> socketId
const connectedUsers = new Map<string, string>();   // userId -> socketId

export function initSocketServer(httpServer: Server): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.slice(7);
      if (!token) return next(new Error('Authentication required'));

      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const { userId, role } = socket.data;
    connectedUsers.set(userId, socket.id);
    logger.info({ msg: 'Socket connected', userId, role });

    if (role === 'RIDER') {
      const rider = await prisma.rider.findUnique({ where: { userId } });
      if (rider) {
        connectedRiders.set(rider.id, socket.id);
        socket.join(`rider:${rider.id}`);
      }
    }
    socket.join(`user:${userId}`);

    // Rider sends location update
    socket.on('rider:location', async (data: { latitude: number; longitude: number }) => {
      if (role !== 'RIDER') return;
      const rider = await prisma.rider.findUnique({ where: { userId } });
      if (!rider) return;

      await prisma.rider.update({
        where: { id: rider.id },
        data: { currentLatitude: data.latitude, currentLongitude: data.longitude, lastLocationUpdate: new Date() },
      });

      // Broadcast to customers tracking this rider's active order
      const activeOrder = await prisma.order.findFirst({
        where: {
          riderId: rider.id,
          status: { in: ['ACCEPTED', 'RIDER_EN_ROUTE', 'PICKED_UP', 'IN_TRANSIT'] },
        },
      });

      if (activeOrder) {
        io.to(`user:${activeOrder.customerId}`).emit('rider:location:update', {
          orderId: activeOrder.id,
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    });

    // Chat message
    socket.on('message:send', async (data: { orderId: string; content: string }) => {
      const order = await prisma.order.findUnique({ where: { id: data.orderId } });
      if (!order) return;

      const message = await prisma.message.create({
        data: { orderId: data.orderId, senderId: userId, content: data.content },
        include: { sender: { select: { id: true, firstName: true, profilePhotoUrl: true } } },
      });

      // Send to all participants in the order room
      io.to(`order:${data.orderId}`).emit('message:new', message);
    });

    // Join order room for real-time chat
    socket.on('order:join', (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    socket.on('order:leave', (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    // SOS alert
    socket.on('sos:alert', async (data: { orderId: string; latitude: number; longitude: number }) => {
      logger.warn({ msg: 'SOS alert received', userId, ...data });
      // Notify all admins
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      admins.forEach((admin) => {
        const adminSocketId = connectedUsers.get(admin.id);
        if (adminSocketId) {
          io.to(adminSocketId).emit('sos:alert', { userId, ...data });
        }
      });
    });

    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      if (role === 'RIDER') {
        connectedRiders.forEach((socketId, riderId) => {
          if (socketId === socket.id) connectedRiders.delete(riderId);
        });
      }
      logger.info({ msg: 'Socket disconnected', userId });
    });
  });

  return io;
}

export function emitToUser(io: SocketServer, userId: string, event: string, data: unknown): void {
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToRider(io: SocketServer, riderId: string, event: string, data: unknown): void {
  io.to(`rider:${riderId}`).emit(event, data);
}
