import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getStoredUser, requireSession } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { canCreateProject, canDeleteProject, canEditProject } from "../../lib/permissions";
import type { AuthUser } from "../../types";
import type { ProjectSummary } from "../../types";

export function ProjectListPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const user = getStoredUser() as AuthUser | null;

  async function loadProjects() {
    const data = await api<ProjectSummary[]>("/projects");
    setProjects(data);
  }

  useEffect(() => {
    void requireSession().then(loadProjects).catch((err) => setError(err instanceof Error ? err.message : "Failed to load projects"));
  }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await api(`/projects/${id}`, { method: "DELETE" });
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="Project Listing"
        description="Separate page for listing and navigating to create or edit project records."
        actions={canCreateProject(user) ? (
          <Link className="button" to="/projects/new">
            Add project
          </Link>
        ) : undefined}
      />
      {error ? <div className="card error-card">{error}</div> : null}
      <div className="list-grid">
        {projects.map((project) => (
          <article className="card entity-card" key={project.id}>
            <div className="section-header">
              <div>
                <h3>
                  {project.code} · {project.name}
                </h3>
                <p className="muted">
                  {project.status} · {project.priority} · {project.manager?.name ?? "No manager"}
                </p>
              </div>
              <span className="pill">{project._count?.tickets ?? 0} tickets</span>
            </div>
            <p className="muted">{project.description || "No description provided."}</p>
            {canEditProject(user) || canDeleteProject(user) ? (
              <div className="button-row">
                {canEditProject(user) ? (
                  <button className="button ghost" type="button" onClick={() => navigate(`/projects/${project.id}/edit`)}>
                    Edit
                  </button>
                ) : null}
                {canDeleteProject(user) ? (
                  <button className="button danger-inline" type="button" onClick={() => void handleDelete(project.id)} disabled={deletingId === project.id}>
                    Delete
                  </button>
                ) : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}
