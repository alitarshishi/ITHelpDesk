import { Badge } from "@/components/ui/badge";
import { getRoleConfig } from "@/styling/badges";

export default function RoleBadge({ role }) {
  const config = getRoleConfig(role);
  return (
    <Badge variant="outline" className={`font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
}
