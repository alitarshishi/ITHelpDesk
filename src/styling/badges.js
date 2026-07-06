export const statusConfig = {
  open: {
    label: "Open",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: "Circle",
  },
  "in progress": {
    label: "In Progress",
    className: "bg-amber-50 text-amber-800 border-amber-200",
    icon: "Clock",
  },
  resolved: {
    label: "Resolved",
    className: "bg-green-50 text-green-700 border-green-200",
    icon: "CheckCircle2",
  },
  closed: {
    label: "Closed",
    className: "bg-gray-50 text-gray-600 border-gray-200",
    icon: "CheckCircle2",
  },
  escalated: {
    label: "Escalated",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: "AlertTriangle",
  },
};

export const priorityConfig = {
  low: { label: "Low", className: "bg-blue-500 text-white" },
  medium: { label: "Medium", className: "bg-amber-500 text-white" },
  high: { label: "High", className: "bg-orange-500 text-white" },
  critical: { label: "Critical", className: "bg-red-900 text-white" },
};

export const roleConfig = {
  Admin: { label: "Admin", className: "bg-red-50 text-red-700" },
  Employee: { label: "Employee", className: "bg-blue-50 text-blue-700" },
  ITAgent: { label: "IT Agent", className: "bg-green-50 text-green-700" },
  Manager: { label: "Manager", className: "bg-amber-50 text-amber-800" },
};

export function getStatusConfig(status) {
  const key = (status || "").toLowerCase();
  return (
    statusConfig[key] || {
      label: status || "—",
      className: "bg-gray-50 text-gray-600 border-gray-200",
      icon: "Circle",
    }
  );
}

export function getPriorityConfig(priority) {
  const key = (priority || "").toLowerCase();
  return (
    priorityConfig[key] || {
      label: priority || "—",
      className: "bg-gray-200 text-gray-700",
    }
  );
}

export function getRoleConfig(role) {
  return (
    roleConfig[role] || {
      label: role || "—",
      className: "bg-gray-50 text-gray-600",
    }
  );
}
