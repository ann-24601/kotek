import { Suspense } from "react";
import { AddEntryScreen } from "@/screens/AddEntryScreen";

// useSearchParams (parametr ?date=) wymaga granicy Suspense przy prerenderze
export default function Page() {
  return (
    <Suspense>
      <AddEntryScreen />
    </Suspense>
  );
}
