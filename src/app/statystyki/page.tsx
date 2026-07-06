import { redirect } from "next/navigation";

// Statystyki przeniesione na stronę startową („Dzisiaj"). Zachowujemy trasę
// jako przekierowanie, by stare linki/zakładki nie prowadziły do 404.
export default function Page() {
  redirect("/");
}
