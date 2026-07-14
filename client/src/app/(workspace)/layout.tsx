import { ReactNode } from "react";

import { ProtectedShell } from "@/components/workspace/protected-shell";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
