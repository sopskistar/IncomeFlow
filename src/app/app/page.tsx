import { Suspense } from "react";
import { Workspace } from "@/components/workspace";
export const metadata = { title: "Workspace" };
export default function AppPage() {
  return (
    <Suspense
      fallback={
        <main className="container loading-state">
          Loading your income workspace…
        </main>
      }
    >
      <Workspace />
    </Suspense>
  );
}
