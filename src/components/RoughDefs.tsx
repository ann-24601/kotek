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
        {/* delikatne „drżenie" — ramki pól, przyciski, pigułki */}
        <filter id="rough" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.018"
            numOctaves={2}
            seed={7}
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={2.6} />
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

        {/* linie/krzywe dividery — cienkie ślady długopisu */}
        <filter id="rough-line" x="-4%" y="-30%" width="108%" height="160%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.03"
            numOctaves={2}
            seed={3}
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={2.2} />
        </filter>
      </defs>
    </svg>
  );
}
