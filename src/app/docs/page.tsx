/* =============================================================
   Kotek — dokumentacja (/docs).
   Server component: tylko metadata + montaż klienta DocsApp,
   który trzyma stan zakładek (API|MCP) i wspólnego paska tokenu.
   Strona publiczna — AppFrame omija bramkę dla /docs.
   ============================================================= */
import type { Metadata } from "next";
import DocsApp from "@/components/docs/DocsApp";

export const metadata: Metadata = {
  title: "Kotek — API & MCP Docs",
  description:
    "Dokumentacja Kotka: REST API (Create, Ask, Read) oraz serwer MCP (Remote HTTP) dla agentów AI.",
};

export default function DocsPage() {
  return <DocsApp />;
}
