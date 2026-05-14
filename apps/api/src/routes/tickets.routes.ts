import { Router } from "express";
import { z } from "zod";
import { HISTORY_TYPES, TICKET_PRIORITIES, TICKET_STATUSES } from "../constants.js";
import { prisma } from "../lib/prisma.js";
import { fromDelimitedString, toDelimitedString } from "../lib/transformers.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { writeAuditLog } from "../services/audit.service.js";

const router = Router();

const ticketSchema = z.object({
  projectId: z.string(),
  title: z.string().min(3),
  description: z.string().optional(),
  priority: z.enum(TICKET_PRIORITIES).default("MEDIUM"),
  status: z.enum(TICKET_STATUSES).default("TODO"),
  assigneeId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  estimatedHours: z.number().nonnegative().optional(),
  actualHours: z.number().nonnegative().optional(),
  tags: z.array(z.string()).default([]),
  supportRequired: z.boolean().default(false),
  checklist: z.array(z.string()).default([]),
  dependencyIds: z.array(z.string()).default([])
});

const commentSchema = z.object({
  content: z.string().min(1),
  mentions: z.array(z.string()).default([])
});

const timeLogSchema = z.object({
  hours: z.number().positive(),
  description: z.string().optional()
});

function mapTicket(ticket: any) {
  return {
    ...ticket,
    tags: fromDelimitedString(ticket.tags),
    startDate: ticket.startDate?.toISOString() ?? null,
    endDate: ticket.endDate?.toISOString() ?? null
  };
}

router.use(requireAuth);

router.get("/", async (req, res) => {
  const projectId = req.query.projectId?.toString();
  const tickets = await prisma.ticket.findMany({
    where: projectId ? { projectId } : undefined,
    include: {
      assignee: { select: { id: true, name: true, role: true } },
      project: { select: { id: true, name: true, code: true } },
      checklistItems: true,
      dependenciesFrom: {
        include: { dependsOnTicket: { select: { id: true, ticketNumber: true, title: true, status: true } } }
      },
      _count: { select: { comments: true, timeLogs: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(tickets.map(mapTicket));
});

router.post("/", requireRole(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_LEAD"]), async (req, res) => {
  const body = ticketSchema.parse(req.body);
  const project = await prisma.project.findUnique({ where: { id: body.projectId } });

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const lastTicket = await prisma.ticket.findFirst({
    orderBy: { sequence: "desc" },
    select: { sequence: true }
  });
  const nextSequence = (lastTicket?.sequence ?? 1000) + 1;
  const ticketNumber = `TKT-${nextSequence}`;

  const ticket = await prisma.ticket.create({
    data: {
      sequence: nextSequence,
      ticketNumber,
      projectId: body.projectId,
      title: body.title,
      description: body.description,
      priority: body.priority,
      status: body.status,
      assigneeId: body.assigneeId,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      estimatedHours: body.estimatedHours,
      actualHours: body.actualHours ?? 0,
      tags: toDelimitedString(body.tags),
      supportRequired: body.supportRequired,
      checklistItems: body.checklist.length
        ? {
            create: body.checklist.map((title) => ({ title }))
          }
        : undefined,
      dependenciesFrom: body.dependencyIds.length
        ? {
            create: body.dependencyIds.map((dependsOnTicketId) => ({ dependsOnTicketId }))
          }
        : undefined,
      histories: {
        create: {
          actorId: req.user!.id,
          type: HISTORY_TYPES[0],
          description: "Ticket created"
        }
      }
    },
    include: {
      checklistItems: true,
      assignee: { select: { id: true, name: true, role: true } },
      project: { select: { id: true, name: true, code: true } },
      _count: { select: { comments: true, timeLogs: true } }
    }
  });

  await writeAuditLog({
    actorId: req.user!.id,
    action: "TICKET_CREATED",
    entityType: "TICKET",
    entityId: ticket.id
  });

  res.status(201).json(mapTicket(ticket));
});

router.put("/:id", requireRole(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_LEAD", "DEVELOPER", "QA"]), async (req, res) => {
  const ticketId = String(req.params.id);
  const body = ticketSchema.partial().parse(req.body);
  const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });

  if (!existing) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      projectId: body.projectId,
      title: body.title,
      description: body.description,
      priority: body.priority,
      status: body.status,
      assigneeId: body.assigneeId === "" ? null : body.assigneeId,
      startDate: body.startDate ? new Date(body.startDate) : body.startDate === "" ? null : undefined,
      endDate: body.endDate ? new Date(body.endDate) : body.endDate === "" ? null : undefined,
      estimatedHours: body.estimatedHours,
      actualHours: body.actualHours,
      tags: body.tags ? toDelimitedString(body.tags) : undefined,
      supportRequired: body.supportRequired
    },
    include: {
      assignee: { select: { id: true, name: true, role: true } },
      project: { select: { id: true, name: true, code: true } },
      checklistItems: true,
      _count: { select: { comments: true, timeLogs: true } }
    }
  });

  if (body.checklist) {
    await prisma.ticketChecklistItem.deleteMany({ where: { ticketId } });
    if (body.checklist.length) {
      await prisma.ticketChecklistItem.createMany({
        data: body.checklist.map((title) => ({
          ticketId,
          title
        }))
      });
    }
  }

  if (body.dependencyIds) {
    await prisma.ticketDependency.deleteMany({ where: { ticketId } });
    if (body.dependencyIds.length) {
      await prisma.ticketDependency.createMany({
        data: body.dependencyIds.map((dependsOnTicketId) => ({
          ticketId,
          dependsOnTicketId
        }))
      });
    }
  }

  if (body.status && body.status !== existing.status) {
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        actorId: req.user!.id,
        type: "STATUS_CHANGED",
        field: "status",
        fromValue: existing.status,
        toValue: body.status,
        description: `Status changed from ${existing.status} to ${body.status}`
      }
    });
  }

  if (body.assigneeId && body.assigneeId !== existing.assigneeId) {
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        actorId: req.user!.id,
        type: "ASSIGNED",
        field: "assigneeId",
        fromValue: existing.assigneeId ?? "",
        toValue: body.assigneeId,
        description: "Ticket reassigned"
      }
    });
  }

  await writeAuditLog({
    actorId: req.user!.id,
    action: "TICKET_UPDATED",
    entityType: "TICKET",
    entityId: ticket.id
  });

  res.json(mapTicket(ticket));
});

router.delete("/:id", requireRole(["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"]), async (req, res) => {
  const ticketId = String(req.params.id);
  await prisma.ticket.delete({ where: { id: ticketId } });

  await writeAuditLog({
    actorId: req.user!.id,
    action: "TICKET_DELETED",
    entityType: "TICKET",
    entityId: ticketId
  });

  res.status(204).send();
});

router.get("/:id", async (req, res) => {
  const ticketId = String(req.params.id);
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      project: { select: { id: true, name: true, code: true } },
      assignee: { select: { id: true, name: true, role: true } },
      checklistItems: true,
      comments: {
        include: {
          author: { select: { id: true, name: true, role: true } },
          attachments: true
        },
        orderBy: { createdAt: "desc" }
      },
      histories: {
        include: { actor: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "desc" }
      },
      timeLogs: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { loggedAt: "desc" }
      },
      dependenciesFrom: {
        include: { dependsOnTicket: { select: { id: true, ticketNumber: true, title: true, status: true } } }
      },
      attachments: true
    }
  });

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  res.json({
    ...mapTicket(ticket),
    comments: ticket.comments.map((comment) => ({
      ...comment,
      mentions: fromDelimitedString(comment.mentions)
    }))
  });
});

router.post("/:id/comments", async (req, res) => {
  const ticketId = String(req.params.id);
  const body = commentSchema.parse(req.body);

  const comment = await prisma.ticketComment.create({
    data: {
      ticketId,
      authorId: req.user!.id,
      content: body.content,
      mentions: toDelimitedString(body.mentions)
    },
    include: {
      author: { select: { id: true, name: true, role: true } }
    }
  });

  await prisma.ticketHistory.create({
      data: {
      ticketId,
      actorId: req.user!.id,
      type: "COMMENTED",
      description: "Comment added"
    }
  });

  if (body.mentions.length) {
    await prisma.notification.createMany({
      data: body.mentions.map((userId) => ({
        userId,
        title: "Mentioned in ticket comment",
        body: comment.content.slice(0, 160)
      }))
    });
  }

  res.status(201).json({
    ...comment,
    mentions: body.mentions
  });
});

router.post("/:id/time-logs", async (req, res) => {
  const ticketId = String(req.params.id);
  const body = timeLogSchema.parse(req.body);

  const timeLog = await prisma.timeLog.create({
    data: {
      ticketId,
      userId: req.user!.id,
      hours: body.hours,
      description: body.description
    },
    include: {
      user: { select: { id: true, name: true, role: true } }
    }
  });

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      actualHours: {
        increment: body.hours
      }
    }
  });

  await prisma.ticketHistory.create({
      data: {
      ticketId,
      actorId: req.user!.id,
      type: "TIME_LOGGED",
      description: `${body.hours} hours logged`
    }
  });

  res.status(201).json(timeLog);
});

export default router;
