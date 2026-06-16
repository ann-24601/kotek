"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { HandUnderline } from "@/components/Squiggle";
import { useAuth } from "@/context/AuthContext";

type Mode = "signin" | "signup";

export function Auth() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
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

  const toggleMode = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError(null);
    setInfo(null);
  };

  return (
    <div className="flex min-h-[100dvh] justify-center overflow-y-auto p-4">
      <div className="mt-10 w-full max-w-[420px]">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="tag">cześć!</span>
          <div className="sketch-box sketch-box-alt my-2" aria-hidden="true">
            <Icon name="cat" size={88} strokeWidth={1.6} />
          </div>
          <h1 className="text-[2.25rem] leading-none">Kotek</h1>
          <HandUnderline width={132} />
          <p className="mt-1 max-w-[34ch] text-sm text-ink-soft">
            {isSignup
              ? "Załóż konto, aby zapisywać wpisy o swoim kocie."
              : "Zaloguj się, aby wrócić do dziennika kota."}
          </p>
        </div>

        <form onSubmit={submit} className="mt-7 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-hand text-sm font-semibold text-ink-soft">E-mail</span>
            <div className="ink-edge rounded-[var(--r-box)] bg-paper focus-within:outline focus-within:outline-[2.5px] focus-within:outline-dashed focus-within:outline-ink focus-within:outline-offset-[3px]">
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

          <label className="flex flex-col gap-1.5">
            <span className="font-hand text-sm font-semibold text-ink-soft">Hasło</span>
            <div className="ink-edge rounded-[var(--r-box)] bg-paper focus-within:outline focus-within:outline-[2.5px] focus-within:outline-dashed focus-within:outline-ink focus-within:outline-offset-[3px]">
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

          {error && <p className="text-sm text-danger">{error}</p>}
          {info && <p className="text-sm text-ink-faint">{info}</p>}

          <Button type="submit" block size="lg" disabled={busy} className="mt-2">
            <Icon name={isSignup ? "plus" : "arrowRight"} size={22} />
            {busy ? "Chwila…" : isSignup ? "Załóż konto" : "Zaloguj się"}
          </Button>

          <Button type="button" variant="ghost" block onClick={toggleMode}>
            {isSignup ? "Masz już konto? Zaloguj się" : "Nie masz konta? Załóż konto"}
          </Button>
        </form>

        <p className="mt-6 px-6 text-center text-xs leading-normal text-ink-faint">
          Kotek wspiera obserwację i rytuał — nie zastępuje lekarza weterynarii.
        </p>
      </div>
    </div>
  );
}
