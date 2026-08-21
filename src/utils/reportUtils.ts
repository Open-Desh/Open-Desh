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
 * (Only returns true if authorVerified is explicitly true or official badge is present)
 */
export const isReportAuthorVerified = (
  item?: {
    authorVerified?: boolean;
    authorBadge?: string;
    authorCategory?: string;
  } | null
): boolean => {
  if (!item) return false;
  if (item.authorVerified === true) return true;
  if (item.authorVerified === false) return false;

  // If authorBadge has explicit verified text
  if (
    item.authorBadge &&
    (item.authorBadge.toLowerCase().includes("verified") ||
      item.authorBadge.toLowerCase().includes("official") ||
      item.authorBadge.toLowerCase().includes("authority"))
  ) {
    return true;
  }

  return false;
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
