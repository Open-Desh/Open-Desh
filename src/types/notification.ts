import { UserCategory } from "../types.ts";

export type NotificationType =
  | "reply"
  | "rereport"
  | "like"
  | "status_update"
  | "official_action"
  | "mention"
  | "follow";

export interface AppNotification {
  id: string;
  recipientId: string; // User receiving this notification
  type: NotificationType;
  actorId: string;
  actorName: string;
  actorUsername: string;
  actorAvatar: string;
  actorCategory?: UserCategory;
  actorBadge?: string;
  title: string;
  message: string;
  targetReportId?: string; // If related to a post report
  targetReplyId?: string;
  timestamp: string; // e.g. "Just now", "2m ago"
  createdAt: number; // Unix epoch ms for sorting
  read: boolean;
  actionUrl?: string;
  metadata?: {
    category?: string;
    oldStatus?: string;
    newStatus?: string;
    slaHours?: string;
    deptName?: string;
  };
}
