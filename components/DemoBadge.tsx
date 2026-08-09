import type React from "react";

export function DemoBadge({ children = "Illustrative demo data" }: { children?: React.ReactNode }) {
  return <span className="demoBadge">{children}</span>;
}
