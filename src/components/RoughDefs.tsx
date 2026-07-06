/* =============================================================
   Kotek — filtry SVG nadające krawędziom „odręczny", drżący wygląd.
   Renderowane raz (w layout) jako ukryty <svg>. Używane przez CSS:
   `filter: url(#rough)` — WYŁĄCZNIE na warstwach krawędzi (::before),
   nigdy na elementach z tekstem, by nie rozmywać pisma.
   ============================================================= */

export function RoughDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <defs>
        {/* „krzywa" obwódka wg referencji z Figmy — duże, GŁADKIE, organiczne pętle
           grubego markera. Klucz do braku „pikselozy": rozmywamy mapę szumu
           (feGaussianBlur), żeby przesunięcie zmieniało się płynnie. Niska
           częstotliwość = duże pętle, duży scale = wyraźna amplituda (Wiggle). */}
        <filter id="rough" x="-18%" y="-18%" width="136%" height="136%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008"
            numOctaves={1}
            seed={7}
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation={1.6} result="smooth" />
          <feDisplacementMap in="SourceGraphic" in2="smooth" scale={8} />
        </filter>

        {/* mocniejsze — duże kształty, ilustracje, podłoża */}
        <filter id="rough-strong" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012"
            numOctaves={2}
            seed={11}
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={4} />
        </filter>

        {/* linie/krzywe dividery i podkreślenia — ten sam gładki (rozmyty szum),
           luźny charakter co obwódki (spójność „krzywych linii" w całym UI). */}
        <filter id="rough-line" x="-8%" y="-120%" width="116%" height="340%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.008"
            numOctaves={1}
            seed={3}
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation={1.4} result="smooth" />
          <feDisplacementMap in="SourceGraphic" in2="smooth" scale={5} />
        </filter>
      </defs>
    </svg>
  );
}
