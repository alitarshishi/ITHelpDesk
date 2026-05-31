import React from "react";
import Header from "./Header";

export default function ManagerPage() {
  return (
    <div className="min-vh-100 bg-light">
      <Header />
      <div className="container py-4">
        <h3>Manager</h3>
        <p>Monitor team tickets and view reporting metrics.</p>
        <div className="card p-3">
          <p className="mb-0">(Placeholder) Team dashboard and reports.</p>
        </div>
      </div>
    </div>
  );
}
