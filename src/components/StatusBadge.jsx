import { Badge } from "@/components/ui/badge";
import { Circle, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { getStatusConfig } from "@/styling/badges";

const icons = { Circle, Clock, CheckCircle2, AlertTriangle };

export default function StatusBadge({ status }) {
  const config = getStatusConfig(status);
  const Icon = icons[config.icon];

  return (
    <Badge
      variant="outline"
      className={`gap-1 font-medium ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
