import { AppNotification } from "../types.ts";

export const initialSeedNotifications: AppNotification[] = [
  {
    id: "notif_001",
    recipientId: "user_nitesh_001",
    type: "reply",
    actorId: "citizen_rahul",
    actorName: "Rahul Sharma",
    actorUsername: "rahul_ranchi",
    actorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    actorCategory: "citizen",
    actorBadge: "Verified Resident",
    title: "Rahul Sharma replied to your report",
    message: "Thank you for raising this issue. We have faced this blackspot problem for 2 months.",
    targetReportId: "rep_001",
    timestamp: "15m ago",
    createdAt: Date.now() - 15 * 60 * 1000,
    read: false,
  },
  {
    id: "notif_002",
    recipientId: "user_nitesh_001",
    type: "like",
    actorId: "citizen_ananya",
    actorName: "Ananya Roy",
    actorUsername: "ananya_civic",
    actorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80",
    actorCategory: "citizen",
    actorBadge: "Active Citizen",
    title: "Ananya Roy upvoted your report",
    message: "upvoted your civic report on Infrastructure",
    targetReportId: "rep_001",
    timestamp: "1h ago",
    createdAt: Date.now() - 60 * 60 * 1000,
    read: false,
  },
];

