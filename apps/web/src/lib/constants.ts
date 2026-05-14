import type { ProjectPriority, ProjectStatus, TicketPriority, TicketStatus } from "../types";

export const projectStatuses: ProjectStatus[] = ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];
export const projectPriorities: ProjectPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export const ticketStatuses: TicketStatus[] = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "QA_TESTING", "DONE", "BLOCKED", "CLOSED"];
export const ticketPriorities: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
