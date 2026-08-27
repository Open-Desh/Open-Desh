import { ReportIssue, UserProfile, ThreadedReply } from "../types";

/**
 * Strips leading @ from username or author name so handles like '@mla' render cleanly as 'mla'
 */
export const getCleanAuthorUsername = (
  authorUsername?: string,
  authorName?: string
): string => {
  if (authorUsername && authorUsername.trim()) {
    return authorUsername.trim().replace(/^@+/, "");
  }
  if (authorName && authorName.trim()) {
    return authorName.trim().replace(/^@+/, "");
  }
  return "citizen";
};

/**
 * Checks if the author has genuine database-backed verification
 * (Returns true if authorVerified is explicitly true, or if author matches active verified user, or official authority)
 */
export const isReportAuthorVerified = (
  item?: {
    authorVerified?: boolean;
    authorBadge?: string;
    authorCategory?: string;
    authorId?: string;
    authorUsername?: string;
  } | null,
  activeUser?: {
    id?: string;
    username?: string;
    verified?: boolean;
    category?: string;
  } | null
): boolean => {
  if (!item) return false;

  // 1. If activeUser is logged in & verified, check if this report is authored by activeUser
  if (activeUser && activeUser.verified) {
    const cleanItemUsername = item.authorUsername
      ? item.authorUsername.replace(/^@+/, "").trim().toLowerCase()
      : "";
    const cleanActiveUsername = activeUser.username
      ? activeUser.username.replace(/^@+/, "").trim().toLowerCase()
      : "";

    const isSameId = Boolean(
      item.authorId &&
        activeUser.id &&
        (item.authorId === activeUser.id ||
          item.authorId.toLowerCase() === activeUser.id.toLowerCase())
    );

    const isSameUsername = Boolean(
      cleanItemUsername &&
        cleanActiveUsername &&
        cleanItemUsername === cleanActiveUsername
    );

    if (isSameId || isSameUsername) {
      return true;
    }
  }

  // 2. Direct verified boolean flag on the report object
  if (item.authorVerified === true) return true;

  // 3. Department and Representative accounts are verified authorities
  if (
    item.authorCategory === "department" ||
    item.authorCategory === "representative"
  ) {
    return true;
  }

  // 4. If authorBadge has explicit verified text
  if (
    item.authorBadge &&
    (item.authorBadge.toLowerCase().includes("verified") ||
      item.authorBadge.toLowerCase().includes("official") ||
      item.authorBadge.toLowerCase().includes("authority") ||
      item.authorBadge.toLowerCase().includes("officer"))
  ) {
    return true;
  }

  return false;
};

/**
 * Resolves the genuine verified category approved by document verification.
 * If a user was verified for 'citizen' but edits profile to 'business' or 'representative',
 * their verified badge category stays strictly the document-verified one ('citizen')
 * until new documents are approved by Open Desh administration.
 */
export const getReportAuthorVerifiedCategory = (
  item?: {
    authorVerified?: boolean;
    authorVerifiedCategory?: string;
    authorCategory?: string;
    authorId?: string;
    authorUsername?: string;
  } | null,
  activeUser?: {
    id?: string;
    username?: string;
    verified?: boolean;
    verifiedCategory?: string;
    category?: string;
  } | null
): string => {
  if (!item) return "citizen";

  // 1. If this item is authored by active logged-in user who is verified
  if (activeUser && activeUser.verified) {
    const cleanItemUsername = item.authorUsername
      ? item.authorUsername.replace(/^@+/, "").trim().toLowerCase()
      : "";
    const cleanActiveUsername = activeUser.username
      ? activeUser.username.replace(/^@+/, "").trim().toLowerCase()
      : "";

    const isSameId = Boolean(
      item.authorId &&
        activeUser.id &&
        (item.authorId === activeUser.id ||
          item.authorId.toLowerCase() === activeUser.id.toLowerCase())
    );

    const isSameUsername = Boolean(
      cleanItemUsername &&
        cleanActiveUsername &&
        cleanItemUsername === cleanActiveUsername
    );

    if (isSameId || isSameUsername) {
      // Prioritize the document-verified category!
      return activeUser.verifiedCategory || (activeUser.verified ? activeUser.category : undefined) || "citizen";
    }
  }

  // 2. Direct verifiedCategory recorded on the item/report
  if (item.authorVerifiedCategory) {
    return item.authorVerifiedCategory;
  }

  // 3. Fallback to author category
  return item.authorCategory || "citizen";
};

/**
 * Normalizes a handle to have exactly one leading @ symbol, e.g. "@@savekto" -> "@savekto"
 */
export const formatHandleWithAt = (handle?: string): string => {
  if (!handle) return "";
  const clean = handle.trim().replace(/^@+/, "");
  return clean ? `@${clean}` : "";
};

/**
 * Normalizes a handle to remove all leading @ symbols, e.g. "@savekto" -> "savekto"
 */
export const cleanHandle = (handle?: string): string => {
  if (!handle) return "";
  return handle.trim().replace(/^@+/, "");
};

/**
 * Cleans report text to eliminate manual @mentions, Cc: tagging blocks, or dangling handles
 * so the main description text stays pristine and tagged authorities only live in verified bottom pills.
 */
export const cleanReportText = (rawText: string = ""): string => {
  if (!rawText) return "";

  let cleaned = rawText;
  // 1. Remove Cc: @handle @handle... blocks (whether inline at the end or on separate lines)
  cleaned = cleaned.replace(/\s+Cc:\s*[@\w\s,._-]+$/gi, "");
  cleaned = cleaned.replace(/(?:\r?\n)+\s*Cc:\s*.+$/gim, "");

  // 2. Remove all standalone or inline @mentions (e.g. @savekto, @mcg_gurgaon, @@handle)
  // so they do not show in the post content text
  cleaned = cleaned.replace(/(?:^|\s)@+([a-zA-Z0-9_]+)/g, " ");

  // 3. Remove any remaining stray leading @ or @@ if present at start of lines
  cleaned = cleaned.replace(/^@+[a-zA-Z0-9_]+\s*/gm, "");

  // 4. Normalize whitespace and remove empty lines
  cleaned = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line, idx, arr) => line !== "" || (idx > 0 && arr[idx - 1] !== ""))
    .join("\n");

  return cleaned.trim();
};

/**
 * Accurately formats timestamps into dynamic relative time (e.g. "Just now", "2m ago", "1h ago", "3d ago", "21 Aug")
 * Handles numeric epochs, ISO date strings, or relative strings seamlessly.
 */
export const formatReportTimestamp = (
  timestampOrCreatedAt?: string | number | null,
  fallbackCreatedAt?: string | number | null
): string => {
  const target = fallbackCreatedAt !== undefined && fallbackCreatedAt !== null && fallbackCreatedAt !== "" 
    ? fallbackCreatedAt 
    : timestampOrCreatedAt;

  if (!target) return "Just now";

  // 1. If it's a number (milliseconds epoch)
  if (typeof target === "number") {
    return formatTimeDifference(target);
  }

  const str = String(target).trim();
  if (!str) return "Just now";

  // 2. If it is a pure numeric string (epoch ms or seconds)
  if (/^\d{10,14}$/.test(str)) {
    const epoch = parseInt(str, 10);
    // If in seconds instead of ms (10 digits)
    const ms = epoch < 10000000000 ? epoch * 1000 : epoch;
    return formatTimeDifference(ms);
  }

  // 3. Try parsing ISO string or standard Date string
  if (str.includes("T") || str.includes("-") || str.includes("/")) {
    const parsedDate = new Date(str);
    if (!isNaN(parsedDate.getTime())) {
      return formatTimeDifference(parsedDate.getTime());
    }
  }

  // 4. If str is already an expressive relative timestamp (e.g. "2 hours ago", "45 mins ago", "1h ago", "15m ago")
  if (
    str.includes("ago") ||
    str.includes("yesterday") ||
    str.includes("Yesterday") ||
    str.includes("mins") ||
    str.includes("hours") ||
    str.includes("days")
  ) {
    return str;
  }

  // 5. Fallback
  return str || "Just now";
};

function formatTimeDifference(epoch: number): string {
  const now = Date.now();
  const diffSec = Math.floor((now - epoch) / 1000);

  if (diffSec < 45) return "Just now";
  if (diffSec < 90) return "1m ago";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 7200) return "1h ago";
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return "1d ago";
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  const date = new Date(epoch);
  const day = date.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const currentYear = new Date().getFullYear();
  if (date.getFullYear() === currentYear) {
    return `${day} ${month}`;
  }
  return `${day} ${month} ${date.getFullYear()}`;
}

