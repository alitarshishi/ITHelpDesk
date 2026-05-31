import React from "react";
import Header from "./Header";

export default function EmployeePage() {
  return (
    <div className="min-vh-100 bg-light">
      <Header />
      <div className="container py-4">
        <h3>Employee</h3>
        <p>Submit new tickets and view your existing requests.</p>
        <div className="card p-3">
          <p className="mb-0">(Placeholder) New ticket form and my tickets.</p>
        </div>
      </div>
    </div>
  );
}
