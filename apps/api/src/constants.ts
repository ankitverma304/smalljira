export const ROLES = ["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_LEAD", "DEVELOPER", "QA", "USER"] as const;
export const PROJECT_STATUSES = ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;
export const PROJECT_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const TICKET_STATUSES = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "QA_TESTING", "DONE", "BLOCKED", "CLOSED"] as const;
export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const HISTORY_TYPES = ["CREATED", "UPDATED", "STATUS_CHANGED", "ASSIGNED", "COMMENTED", "TIME_LOGGED", "ATTACHMENT_ADDED", "CHECKLIST_UPDATED"] as const;

export type Role = (typeof ROLES)[number];
