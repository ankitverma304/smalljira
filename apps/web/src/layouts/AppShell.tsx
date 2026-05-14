import type { PropsWithChildren } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getStoredUser, logout } from "../api/client";
import { canViewRoles, canViewUsers } from "../lib/permissions";
import type { AuthUser } from "../types";

export function AppShell({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const user = getStoredUser() as AuthUser | null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>ProjectMGT</h1>
        </div>
        <div className="sidebar-copy">
          Local-first demo for project planning, ticket execution, comments, history, and reporting.
        </div>
        <nav>
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/projects">Projects</NavLink>
          <NavLink to="/tickets">Tickets</NavLink>
          {canViewUsers(user) ? <NavLink to="/users">Users</NavLink> : null}
          {canViewRoles(user) ? <NavLink to="/roles">Roles</NavLink> : null}
          <NavLink to="/reports">Reports</NavLink>
        </nav>
        <div className="sidebar-user">
          <strong>{user?.name ?? "Unknown user"}</strong>
          <span>{user?.role ?? "No role"}</span>
          <button
            className="button ghost"
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="content">
        {children}
      </main>
    </div>
  );
}
