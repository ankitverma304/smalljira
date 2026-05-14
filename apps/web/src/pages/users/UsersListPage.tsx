import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getStoredUser, requireSession } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { canManageUsers } from "../../lib/permissions";
import type { AuthUser } from "../../types";
import type { Role, UserSummary } from "../../types";

export function UsersListPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const user = getStoredUser() as AuthUser | null;

  useEffect(() => {
    void requireSession()
      .then(() => api<{ users: UserSummary[]; roles: Role[] }>("/users"))
      .then((data) => {
        setUsers(data.users);
        setRoles(data.roles);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load users"));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Users"
        title="User Listing"
        description="Separate page for listing and editing user accounts."
        actions={
          <div className="button-row">
            {canManageUsers(user) ? (
              <Link className="button" to="/users/new">
                Add user
              </Link>
            ) : null}
            <Link className="button ghost" to="/roles">
              Roles
            </Link>
          </div>
        }
      />
      {error ? <div className="card error-card">{error}</div> : null}
      <div className="list-grid">
        {users.map((user) => (
          <article className="card entity-card" key={user.id}>
            <div className="section-header">
              <div>
                <h3>{user.name}</h3>
                <p className="muted">
                  {user.email} · {user.role}
                </p>
              </div>
              <span className="pill">{user.isActive ? "Active" : "Inactive"}</span>
            </div>
            {canManageUsers(user) ? (
              <div className="button-row">
                <button className="button ghost" type="button" onClick={() => navigate(`/users/${user.id}/edit`)}>
                  Edit
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
      <article className="card">
        <h3>Available roles</h3>
        <div className="button-row top-gap">
          {roles.map((role) => (
            <span className="pill" key={role}>
              {role}
            </span>
          ))}
        </div>
      </article>
    </>
  );
}
