import React from "react";
import { useNavigate } from "react-router-dom";
import { logout, getRole } from "../services/authService";

export default function Header() {
  const navigate = useNavigate();
  const role = getRole();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="d-flex align-items-center justify-content-between p-3 border-bottom bg-white">
      <div className="d-flex align-items-center">
        <div
          className="rounded-circle bg-dark d-inline-flex align-items-center justify-content-center me-3"
          style={{ width: 44, height: 44 }}
        >
          <span className="text-white">IT</span>
        </div>
        <div>
          <h5 className="mb-0">IT Help Desk</h5>
          <small className="text-muted">Logged in as {role}</small>
        </div>
      </div>

      <div>
        <button className="btn btn-outline-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
