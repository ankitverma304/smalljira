import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, getStoredUser, requireSession } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { canEditTicket } from "../../lib/permissions";
import type { AuthUser } from "../../types";
import type { TicketDetail } from "../../types";

export function TicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [comment, setComment] = useState("");
  const [timeHours, setTimeHours] = useState("");
  const [timeDescription, setTimeDescription] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const user = getStoredUser() as AuthUser | null;

  async function loadTicket() {
    if (!id) return;
    const data = await api<TicketDetail>(`/tickets/${id}`);
    setTicket(data);
  }

  useEffect(() => {
    void requireSession().then(loadTicket).catch((err) => setError(err instanceof Error ? err.message : "Failed to load ticket"));
  }, [id]);

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;
    setSubmitting("comment");
    try {
      await api(`/tickets/${id}/comments`, { method: "POST", body: JSON.stringify({ content: comment, mentions: [] }) });
      setComment("");
      await loadTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setSubmitting(null);
    }
  }

  async function submitTimeLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;
    setSubmitting("time");
    try {
      await api(`/tickets/${id}/time-logs`, {
        method: "POST",
        body: JSON.stringify({ hours: Number(timeHours), description: timeDescription })
      });
      setTimeHours("");
      setTimeDescription("");
      await loadTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log time");
    } finally {
      setSubmitting(null);
    }
  }

  if (!ticket) {
    return <div className="card">Loading ticket detail…</div>;
  }

  return (
    <>
      <PageHeader
        eyebrow="Ticket Detail"
        title={`${ticket.ticketNumber} · ${ticket.title}`}
        description="Dedicated ticket detail page with comments, history, dependencies, and time logs."
        actions={
          <div className="button-row">
            <Link className="button ghost" to="/tickets">
              Back to listing
            </Link>
            {canEditTicket(user) ? (
              <Link className="button" to={`/tickets/${ticket.id}/edit`}>
                Edit ticket
              </Link>
            ) : null}
          </div>
        }
      />
      {error ? <div className="card error-card">{error}</div> : null}
      <article className="card detail-card">
        <p className="muted">
          {ticket.project.code} · {ticket.status} · {ticket.priority} · Assigned to {ticket.assignee?.name ?? "Unassigned"}
        </p>
        <div className="detail-columns">
          <div>
            <h4>Checklist</h4>
            <ul className="plain-list">
              {ticket.checklistItems?.map((item) => (
                <li key={item.id}>
                  <span>{item.title}</span>
                  <strong>{item.completed ? "Done" : "Open"}</strong>
                </li>
              ))}
            </ul>
            <h4>Dependencies</h4>
            <ul className="plain-list">
              {ticket.dependenciesFrom.map((dependency) => (
                <li key={dependency.id}>
                  <span>{dependency.dependsOnTicket.ticketNumber}</span>
                  <strong>{dependency.dependsOnTicket.status}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>History</h4>
            <ul className="plain-list">
              {ticket.histories.map((entry) => (
                <li key={entry.id}>
                  <span>{entry.actor.name} · {entry.description ?? entry.type}</span>
                  <strong>{new Date(entry.createdAt).toLocaleDateString()}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="detail-columns">
          <form className="stacked-form" onSubmit={submitComment}>
            <h4>Comments</h4>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} placeholder="Add comment" required />
            <button className="button" type="submit" disabled={submitting === "comment"}>
              Add comment
            </button>
            <ul className="plain-list">
              {ticket.comments.map((entry) => (
                <li key={entry.id}>
                  <span>
                    {entry.author.name}: {entry.content}
                  </span>
                  <strong>{new Date(entry.createdAt).toLocaleString()}</strong>
                </li>
              ))}
            </ul>
          </form>
          <form className="stacked-form" onSubmit={submitTimeLog}>
            <h4>Time Logs</h4>
            <input value={timeHours} onChange={(event) => setTimeHours(event.target.value)} placeholder="Hours" required />
            <input value={timeDescription} onChange={(event) => setTimeDescription(event.target.value)} placeholder="What was done" />
            <button className="button" type="submit" disabled={submitting === "time"}>
              Log time
            </button>
            <ul className="plain-list">
              {ticket.timeLogs.map((entry) => (
                <li key={entry.id}>
                  <span>
                    {entry.user.name} · {entry.description || "Work log"}
                  </span>
                  <strong>{entry.hours}h</strong>
                </li>
              ))}
            </ul>
          </form>
        </div>
      </article>
    </>
  );
}
