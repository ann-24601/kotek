"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Art } from "@/components/Illustration";
import { RoughBorder } from "@/components/RoughBorder";
import { useAuth } from "@/context/AuthContext";

type Mode = "signin" | "signup" | "forgot";

/* Ustawienie nowego hasła po wejściu z linku „resetuj hasło" (PASSWORD_RECOVERY). */
export function PasswordRecovery() {
  const { updatePassword, clearRecovery } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await updatePassword(password);
    setBusy(false);
    if (error) setError(error);
  };

  return (
    <div className="flex min-h-[100dvh] justify-center overflow-y-auto p-4">
      <div className="mt-10 w-full max-w-[420px]">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-hand text-[3.25rem] font-bold lowercase leading-none">kotek</h1>
          <p className="mt-1 text-sm text-ink-soft">Ustaw nowe hasło do konta.</p>
        </div>
        <form onSubmit={submit} className="mt-7 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-hand text-sm font-semibold text-ink-soft">Nowe hasło</span>
            <div className="relative rounded-[14px] bg-paper focus-within:outline focus-within:outline-[2.5px] focus-within:outline-dashed focus-within:outline-ink focus-within:outline-offset-[3px]">
              <RoughBorder radius={14} wavelength={22} amplitude={2.2} />
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-11 w-full rounded-[var(--r-box)] bg-transparent px-3.5 py-3 font-mono text-base text-ink placeholder:text-ink-faint focus:outline-none"
                placeholder="min. 6 znaków"
              />
            </div>
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" block size="lg" disabled={busy} className="mt-2">
            <Icon name="check" size={22} />
            {busy ? "Chwila…" : "Zapisz nowe hasło"}
          </Button>
          <Button type="button" variant="ghost" size="lg" block onClick={clearRecovery}>
            Pomiń — hasło zostaje stare
          </Button>
        </form>
      </div>
    </div>
  );
}

export function Auth() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    if (isForgot) {
      const { error } = await resetPassword(email.trim());
      setBusy(false);
      if (error) setError(error);
      else setInfo("Jeśli konto istnieje, wysłaliśmy link do zresetowania hasła. Sprawdź skrzynkę.");
      return;
    }
    const { error } = isSignup
      ? await signUp(email.trim(), password)
      : await signIn(email.trim(), password);
    setBusy(false);
    if (error) {
      setError(error);
      return;
    }
    // Przy wyłączonym potwierdzaniu e-maila signUp od razu loguje (zmiana sesji
    // obsłużona przez onAuthStateChange). Komunikat na wypadek włączonego confirm-email.
    if (isSignup) setInfo("Jeśli wymagane jest potwierdzenie — sprawdź skrzynkę.");
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
  };

  return (
    <div className="flex min-h-[100dvh] justify-center overflow-y-auto p-4">
      <div className="mt-10 w-full max-w-[420px]">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="font-hand text-[3.25rem] font-bold lowercase leading-none">kotek</h1>
          <p className="mt-1 text-sm text-ink-soft">Twój wirtualny koci behawiorysta</p>
          <div className="my-2 w-full" aria-hidden="true">
            <Art name="miauczenie" fluid className="mx-auto w-full max-w-[360px]" />
          </div>
          <p className="max-w-[34ch] text-sm text-ink-soft">
            {isForgot
              ? "Podaj e-mail konta — wyślemy link do ustawienia nowego hasła."
              : isSignup
                ? "Załóż konto, aby zapisywać wpisy o swoim kocie."
                : "Zaloguj się, aby wrócić do dziennika kota."}
          </p>
        </div>

        <form onSubmit={submit} className="mt-7 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-hand text-sm font-semibold text-ink-soft">E-mail</span>
            <div className="relative rounded-[14px] bg-paper focus-within:outline focus-within:outline-[2.5px] focus-within:outline-dashed focus-within:outline-ink focus-within:outline-offset-[3px]">
              <RoughBorder radius={14} wavelength={22} amplitude={2.2} />
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-11 w-full rounded-[var(--r-box)] bg-transparent px-3.5 py-3 font-mono text-base text-ink placeholder:text-ink-faint focus:outline-none"
                placeholder="kot@example.com"
              />
            </div>
          </label>

          {!isForgot && (
            <label className="flex flex-col gap-1.5">
              <span className="font-hand text-sm font-semibold text-ink-soft">Hasło</span>
              <div className="relative rounded-[14px] bg-paper focus-within:outline focus-within:outline-[2.5px] focus-within:outline-dashed focus-within:outline-ink focus-within:outline-offset-[3px]">
                <RoughBorder radius={14} wavelength={22} amplitude={2.2} />
                <input
                  type="password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-11 w-full rounded-[var(--r-box)] bg-transparent px-3.5 py-3 font-mono text-base text-ink placeholder:text-ink-faint focus:outline-none"
                  placeholder="min. 6 znaków"
                />
              </div>
            </label>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
          {info && <p className="text-sm text-ink-faint">{info}</p>}

          <Button type="submit" block size="lg" disabled={busy} className="mt-2">
            <Icon name={isSignup ? "plus" : "arrowRight"} size={22} />
            {busy ? "Chwila…" : isForgot ? "Wyślij link" : isSignup ? "Załóż konto" : "Zaloguj się"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            block
            onClick={() => switchMode(isSignup || isForgot ? "signin" : "signup")}
          >
            {isSignup || isForgot ? "Masz już konto? Zaloguj się" : "Pierwszy raz? Załóż konto"}
          </Button>

          {mode === "signin" && (
            <button
              type="button"
              onClick={() => switchMode("forgot")}
              className="mx-auto mt-1 font-hand text-sm font-semibold text-ink-soft underline decoration-dashed underline-offset-4 hover:text-ink"
            >
              Nie pamiętasz hasła?
            </button>
          )}
        </form>

        <p className="mt-6 px-6 text-center text-xs leading-normal text-ink-faint">
          Kotek wspiera obserwację i rytuał — nie zastępuje lekarza weterynarii.
        </p>
      </div>
    </div>
  );
}
