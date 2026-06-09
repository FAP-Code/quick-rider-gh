import { prisma } from '../config/prisma';
import { NotificationType, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Prisma.InputJsonObject;
}

export async function createNotification(payload: NotificationPayload) {
  return prisma.notification.create({
    data: {
      userId: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    },
  });
}

export async function createBulkNotifications(payloads: NotificationPayload[]) {
  return prisma.notification.createMany({
    data: payloads.map((p) => ({
      userId: p.userId,
      type: p.type,
      title: p.title,
      body: p.body,
      data: p.data,
    })),
  });
}

// Send push notification via FCM (placeholder — wire up Firebase Admin SDK)
export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    // TODO: integrate Firebase Admin SDK
    logger.info({ msg: 'Push notification queued', fcmToken: fcmToken.slice(0, 8) + '...', title });
    void data;
  } catch (err) {
    logger.error({ msg: 'Push notification failed', error: err });
  }
}

export async function notifyRiderNewOrder(riderId: string, orderId: string, customerName: string) {
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    include: { user: { select: { id: true, fcmToken: true } } },
  });
  if (!rider) return;

  await createNotification({
    userId: rider.user.id,
    type: NotificationType.ORDER_REQUEST,
    title: 'New Delivery Request',
    body: `${customerName} has a new delivery request for you.`,
    data: { orderId },
  });

  if (rider.user.fcmToken) {
    await sendPushNotification(
      rider.user.fcmToken,
      'New Delivery Request',
      `${customerName} has a new delivery request for you.`,
      { orderId }
    );
  }
}

export async function notifyCustomerOrderAccepted(
  customerId: string,
  orderId: string,
  riderName: string
) {
  await createNotification({
    userId: customerId,
    type: NotificationType.ORDER_ACCEPTED,
    title: 'Rider Accepted Your Request',
    body: `${riderName} is on the way to pick up your order.`,
    data: { orderId },
  });
}

export async function notifyCustomerDelivered(customerId: string, orderId: string) {
  await createNotification({
    userId: customerId,
    type: NotificationType.DELIVERY_COMPLETED,
    title: 'Delivery Completed!',
    body: 'Your order has been delivered. Please rate your experience.',
    data: { orderId },
  });
}
