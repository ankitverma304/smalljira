import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getStoredUser, requireSession } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { canCreateTicket, canDeleteTicket, canEditTicket } from "../../lib/permissions";
import type { AuthUser } from "../../types";
import type { TicketSummary } from "../../types";

export function TicketListPage() {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const user = getStoredUser() as AuthUser | null;

  async function loadTickets() {
    const data = await api<TicketSummary[]>("/tickets");
    setTickets(data);
  }

  useEffect(() => {
    void requireSession().then(loadTickets).catch((err) => setError(err instanceof Error ? err.message : "Failed to load tickets"));
  }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await api(`/tickets/${id}`, { method: "DELETE" });
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete ticket");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Tickets"
        title="Ticket Listing"
        description="Separate page for listing, opening, editing, and creating tickets."
        actions={canCreateTicket(user) ? (
          <Link className="button" to="/tickets/new">
            Add ticket
          </Link>
        ) : undefined}
      />
      {error ? <div className="card error-card">{error}</div> : null}
      <div className="list-grid">
        {tickets.map((ticket) => (
          <article className="card entity-card" key={ticket.id}>
            <div className="section-header">
              <div>
                <h3>
                  {ticket.ticketNumber} · {ticket.title}
                </h3>
                <p className="muted">
                  {ticket.project.code} · {ticket.status} · {ticket.priority}
                </p>
              </div>
              <span className="pill">{ticket.assignee?.name ?? "Unassigned"}</span>
            </div>
            <p className="muted">{ticket.description || "No description provided."}</p>
            <div className="button-row">
              <button className="button ghost" type="button" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                View
              </button>
              {canEditTicket(user) ? (
                <button className="button ghost" type="button" onClick={() => navigate(`/tickets/${ticket.id}/edit`)}>
                  Edit
                </button>
              ) : null}
              {canDeleteTicket(user) ? (
                <button className="button danger-inline" type="button" onClick={() => void handleDelete(ticket.id)} disabled={deletingId === ticket.id}>
                  Delete
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
