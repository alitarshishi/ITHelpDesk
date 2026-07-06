import { Badge } from "@/components/ui/badge";
import { getPriorityConfig } from "@/styling/badges";

export default function PriorityBadge({ priority }) {
  const config = getPriorityConfig(priority);
  return (
    <Badge className={`font-medium ${config.className}`}>{config.label}</Badge>
  );
}
