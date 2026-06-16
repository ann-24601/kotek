/* =============================================================
   Kotek — webhook Stripe. JEDYNE wiarygodne źródło wiedzy, że
   ktoś kupił agenta. Redirect po płatności jest zawodny (user może
   nie wrócić), więc odblokowanie zapisujemy TU, na podstawie zdarzenia
   checkout.session.completed, kluczem service_role do tabeli entitlements.

   Łączenie płatności z kontem:
   - client_reference_id  = user_id (doklejony do Payment Linku w aplikacji)
   - metadata.agent_id    = który agent (ustawiony na Payment Linku w Stripe)
   ============================================================= */

import Stripe from "stripe";
import { adminClient } from "@/lib/server/admin";
import { paidAgents } from "@/lib/agents/registry";

export const runtime = "nodejs";
// Webhook musi widzieć surowe body do weryfikacji podpisu — bez cache'owania.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    console.error("Webhook Stripe: brak STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET.");
    return Response.json({ error: "Webhook nie jest skonfigurowany." }, { status: 500 });
  }

  const stripe = new Stripe(secretKey);
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Brak podpisu." }, { status: 400 });
  }

  // Surowy tekst body — KONIECZNY do weryfikacji podpisu Stripe.
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook Stripe: nieprawidłowy podpis:", err);
    return Response.json({ error: "Nieprawidłowy podpis." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;

    // Który agent? Najpierw metadane z Payment Linku, a jeśli ich nie ma
    // (no-code Payment Linki bywają zawodne) i istnieje dokładnie jeden płatny
    // agent — przyjmujemy jego. To upraszcza konfigurację i nie da się pomylić.
    const paid = paidAgents();
    const agentId =
      session.metadata?.agent_id ?? (paid.length === 1 ? paid[0].id : undefined);

    if (!userId || !agentId) {
      // Brak danych do połączenia płatności z kontem — logujemy, ale zwracamy 200,
      // żeby Stripe nie ponawiał w nieskończoność źle skonfigurowanego eventu.
      console.error("Webhook Stripe: brak client_reference_id lub metadata.agent_id.", {
        userId,
        agentId,
        sessionId: session.id,
      });
      return Response.json({ received: true, skipped: true });
    }

    // Idempotencja: stripe_session_id ma UNIQUE — powtórka eventu nie tworzy duplikatu.
    const { error } = await adminClient()
      .from("entitlements")
      .upsert(
        {
          user_id: userId,
          agent_id: agentId,
          source: "stripe",
          stripe_session_id: session.id,
        },
        { onConflict: "stripe_session_id", ignoreDuplicates: true },
      );

    // 23505 = unique_violation: user już ma tego agenta (np. ponowny zakup) —
    // to nie błąd, uprawnienie i tak jest przyznane.
    if (error && error.code !== "23505") {
      console.error("Webhook Stripe: zapis entitlements nie powiódł się:", error);
      // 500 → Stripe ponowi dostarczenie eventu.
      return Response.json({ error: "Zapis nie powiódł się." }, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
