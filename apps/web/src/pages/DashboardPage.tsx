import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, requireSession } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import type { ReportOverview } from "../types";

export function DashboardPage() {
  const [overview, setOverview] = useState<ReportOverview | null>(null);

  useEffect(() => {
    void requireSession().then(() => api<ReportOverview>("/reports/overview").then(setOverview)).catch(console.error);
  }, []);

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Project & Ticket Management</p>
          <h2>Manage every feature from dedicated pages and URLs.</h2>
          <p className="hero-copy">
            Projects, tickets, ticket details, comments, time logs, and reports are now separated into their own routes for listing,
            create, and edit flows.
          </p>
        </div>
      </section>

      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Use the navigation to jump into dedicated feature pages."
        actions={
          <div className="button-row">
            <Link className="button" to="/projects">
              Projects
            </Link>
            <Link className="button ghost" to="/tickets">
              Tickets
            </Link>
          </div>
        }
      />

      <section className="grid stats-grid">
        <StatCard label="Projects" value={overview?.stats.totalProjects ?? 0} />
        <StatCard label="Tickets" value={overview?.stats.totalTickets ?? 0} />
        <StatCard label="Users" value={overview?.stats.totalUsers ?? 0} />
        <StatCard label="Logged Hours" value={overview?.stats.totalLoggedHours ?? 0} />
      </section>
    </>
  );
}
