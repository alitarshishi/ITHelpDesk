import React from "react";
import Header from "./Header";

export default function AdminPage() {
  return (
    <div className="min-vh-100 bg-light">
      <Header />
      <div className="container py-4">
        <h3>Admin Dashboard</h3>
        <p>Full system access. Manage users, settings, and all tickets.</p>
        <div className="card p-3">
          <p className="mb-0">
            (Placeholder) Admin tools and system overview go here.
          </p>
        </div>
      </div>
    </div>
  );
}
