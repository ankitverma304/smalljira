export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "TEAM_LEAD"
  | "DEVELOPER"
  | "QA"
  | "USER";

export type ProjectStatus = "PLANNED" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
export type ProjectPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TicketStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "QA_TESTING" | "DONE" | "BLOCKED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type ProjectSummary = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  clientName?: string | null;
  type?: string | null;
  priority: ProjectPriority;
  status: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  expectedDuration?: number | null;
  tags: string[];
  managerId?: string | null;
  manager?: { id: string; name: string; email: string } | null;
  members?: Array<{ id: string; roleLabel?: string | null; user: { id: string; name: string; role: Role } }>;
  _count?: { tickets: number };
};

export type TicketSummary = {
  id: string;
  projectId: string;
  ticketNumber: string;
  title: string;
  description?: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  startDate?: string | null;
  endDate?: string | null;
  estimatedHours?: number | null;
  actualHours: number;
  tags: string[];
  supportRequired: boolean;
  assigneeId?: string | null;
  assignee?: { id: string; name: string; role: Role } | null;
  project: { id: string; name: string; code: string };
  checklistItems?: Array<{ id: string; title: string; completed: boolean }>;
  _count?: { comments: number; timeLogs: number };
};

export type TicketDetail = TicketSummary & {
  comments: Array<{
    id: string;
    content: string;
    mentions: string[];
    createdAt: string;
    author: { id: string; name: string; role: Role };
  }>;
  histories: Array<{
    id: string;
    type: string;
    description?: string | null;
    fromValue?: string | null;
    toValue?: string | null;
    createdAt: string;
    actor: { id: string; name: string; role: Role };
  }>;
  timeLogs: Array<{
    id: string;
    hours: number;
    description?: string | null;
    loggedAt: string;
    user: { id: string; name: string; role: Role };
  }>;
  dependenciesFrom: Array<{
    id: string;
    dependsOnTicket: { id: string; ticketNumber: string; title: string; status: TicketStatus };
  }>;
};

export type ReportOverview = {
  stats: {
    totalProjects: number;
    totalTickets: number;
    totalUsers: number;
    totalLoggedHours: number;
  };
  ticketsByStatus: Record<string, number>;
  projectCompletion: Array<{
    projectId: string;
    projectName: string;
    totalTickets: number;
    doneTickets: number;
    completionRate: number;
  }>;
};

export type UserReport = {
  id: string;
  name: string;
  role: Role;
  assignedTickets: number;
  loggedHours: number;
};

export type ProjectReport = {
  id: string;
  code: string;
  name: string;
  status: ProjectStatus;
  tickets: number;
  completedTickets: number;
  estimatedHours: number;
  actualHours: number;
};

export type TaskReport = {
  id: string;
  ticketNumber: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  project: { name: string; code: string };
  assignee: string | null;
  estimatedHours: number;
  actualHours: number;
};
