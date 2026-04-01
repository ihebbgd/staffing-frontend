// NotificationResponse
export interface Notification {
  id: string;
  recipientId?: string;
  title: string;
  message?: string;
  type?: string;
  read: boolean;
  createdAt?: string;
}

// POST /api/notifications — NotificationRequest. `title` required.
export interface NotificationRequest {
  recipientId?: string;
  title: string;
  message?: string;
  type?: string;
}
