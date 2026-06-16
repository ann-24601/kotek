import { Suspense } from "react";
import { Agents } from "@/screens/Agents";

export default function Page() {
  // useSearchParams (obsługa ?success=1) wymaga granicy Suspense w App Routerze.
  return (
    <Suspense fallback={null}>
      <Agents />
    </Suspense>
  );
}
