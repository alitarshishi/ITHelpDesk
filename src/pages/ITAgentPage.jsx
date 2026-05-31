import React from "react";
import Header from "./Header";

export default function ITAgentPage() {
  return (
    <div className="min-vh-100 bg-light">
      <Header />
      <div className="container py-4">
        <h3>IT Agent</h3>
        <p>Manage and resolve tickets assigned to you or your queue.</p>
        <div className="card p-3">
          <p className="mb-0">
            (Placeholder) Ticket list and resolution tools.
          </p>
        </div>
      </div>
    </div>
  );
}
