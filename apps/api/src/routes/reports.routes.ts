import dayjs from "dayjs";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/overview", async (_req, res) => {
  const [projects, tickets, users, timeLogs] = await Promise.all([
    prisma.project.findMany({ include: { tickets: true } }),
    prisma.ticket.findMany(),
    prisma.user.findMany(),
    prisma.timeLog.findMany()
  ]);

  const ticketsByStatus = tickets.reduce<Record<string, number>>((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] ?? 0) + 1;
    return acc;
  }, {});

  const projectCompletion = projects.map((project) => {
    const done = project.tickets.filter((ticket) => ticket.status === "DONE" || ticket.status === "CLOSED").length;
    return {
      projectId: project.id,
      projectName: project.name,
      totalTickets: project.tickets.length,
      doneTickets: done,
      completionRate: project.tickets.length ? Math.round((done / project.tickets.length) * 100) : 0
    };
  });

  const totalLoggedHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);

  res.json({
    stats: {
      totalProjects: projects.length,
      totalTickets: tickets.length,
      totalUsers: users.length,
      totalLoggedHours
    },
    ticketsByStatus,
    projectCompletion
  });
});

router.get("/date-wise", async (req, res) => {
  const from = req.query.from?.toString() ?? dayjs().subtract(30, "day").startOf("day").toISOString();
  const to = req.query.to?.toString() ?? dayjs().endOf("day").toISOString();

  const logs = await prisma.timeLog.findMany({
    where: {
      loggedAt: {
        gte: new Date(from),
        lte: new Date(to)
      }
    }
  });

  const grouped = logs.reduce<Record<string, number>>((acc, log) => {
    const key = dayjs(log.loggedAt).format("YYYY-MM-DD");
    acc[key] = (acc[key] ?? 0) + log.hours;
    return acc;
  }, {});

  res.json(grouped);
});

router.get("/user-wise", async (_req, res) => {
  const users = await prisma.user.findMany({
    include: {
      assignedTickets: true,
      timeLogs: true
    }
  });

  res.json(
    users.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
      assignedTickets: user.assignedTickets.length,
      loggedHours: user.timeLogs.reduce((sum, log) => sum + log.hours, 0)
    }))
  );
});

router.get("/project-wise", async (_req, res) => {
  const projects = await prisma.project.findMany({
    include: {
      tickets: {
        include: {
          timeLogs: true
        }
      }
    },
    orderBy: { name: "asc" }
  });

  res.json(
    projects.map((project) => ({
      id: project.id,
      code: project.code,
      name: project.name,
      status: project.status,
      tickets: project.tickets.length,
      completedTickets: project.tickets.filter((ticket) => ticket.status === "DONE" || ticket.status === "CLOSED").length,
      estimatedHours: project.tickets.reduce((sum, ticket) => sum + (ticket.estimatedHours ?? 0), 0),
      actualHours: project.tickets.reduce((sum, ticket) => sum + ticket.actualHours, 0)
    }))
  );
});

router.get("/task-wise", async (_req, res) => {
  const tickets = await prisma.ticket.findMany({
    include: {
      assignee: { select: { name: true } },
      project: { select: { name: true, code: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json(
    tickets.map((ticket) => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      status: ticket.status,
      priority: ticket.priority,
      project: ticket.project,
      assignee: ticket.assignee?.name ?? null,
      estimatedHours: ticket.estimatedHours ?? 0,
      actualHours: ticket.actualHours
    }))
  );
});

export default router;
