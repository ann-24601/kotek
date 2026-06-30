/* =============================================================
   Kotek — odwołanie osobistego tokenu API.
   DELETE /api/tokens/:id — usuwa token zalogowanego użytkownika.
   Autoryzacja: Authorization: Bearer <access_token sesji Supabase>.
   ============================================================= */
import { adminClient } from "@/lib/server/admin";
import { requireUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!id) {
    return Response.json({ error: "Brak identyfikatora tokenu." }, { status: 400 });
  }

  try {
    const sb = adminClient();
    // Zawężenie do user_id sprawia, że można odwołać tylko własny token.
    const { error } = await sb
      .from("api_tokens")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.userId);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (err) {
    console.error("tokens DELETE error:", err);
    return Response.json({ error: "Nie udało się odwołać tokenu." }, { status: 500 });
  }
}
