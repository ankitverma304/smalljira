import { useEffect, useState } from "react";
import { api, requireSession } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import type { ProjectReport, ReportOverview, TaskReport, UserReport } from "../types";

export function ReportsPage() {
  const [overview, setOverview] = useState<ReportOverview | null>(null);
  const [userReport, setUserReport] = useState<UserReport[]>([]);
  const [projectReport, setProjectReport] = useState<ProjectReport[]>([]);
  const [taskReport, setTaskReport] = useState<TaskReport[]>([]);

  useEffect(() => {
    void requireSession()
      .then(() =>
        Promise.all([
          api<ReportOverview>("/reports/overview").then(setOverview),
          api<UserReport[]>("/reports/user-wise").then(setUserReport),
          api<ProjectReport[]>("/reports/project-wise").then(setProjectReport),
          api<TaskReport[]>("/reports/task-wise").then(setTaskReport)
        ])
      )
      .catch(console.error);
  }, []);

  return (
    <>
      <PageHeader eyebrow="Reports" title="Reports & Analytics" description="Dedicated reporting page with separate sections for workflow, users, projects, and tasks." />
      <section className="workspace-grid">
        <article className="card">
          <h3>Status Mix</h3>
          <ul className="plain-list">
            {Object.entries(overview?.ticketsByStatus ?? {}).map(([status, count]) => (
              <li key={status}>
                <span>{status}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h3>User Wise</h3>
          <ul className="plain-list">
            {userReport.map((item) => (
              <li key={item.id}>
                <span>
                  {item.name} · {item.role}
                </span>
                <strong>
                  {item.assignedTickets} tickets / {item.loggedHours}h
                </strong>
              </li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h3>Project Wise</h3>
          <ul className="plain-list">
            {projectReport.map((item) => (
              <li key={item.id}>
                <span>
                  {item.code} · {item.name}
                </span>
                <strong>
                  {item.completedTickets}/{item.tickets}
                </strong>
              </li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h3>Task Wise</h3>
          <ul className="plain-list">
            {taskReport.map((item) => (
              <li key={item.id}>
                <span>
                  {item.ticketNumber} · {item.title}
                </span>
                <strong>
                  {item.actualHours}/{item.estimatedHours}h
                </strong>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </>
  );
}
