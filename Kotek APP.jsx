import React, { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceArea, CartesianGrid,
} from "recharts";

/* ============================================================
   KotoDziennik — wirtualny behawiorysta kota (MVP)
   Rdzeń wartości: aplikacja uczy się NORMY danego kota i wykrywa
   ODCHYLENIA. Koty maskują ból/stres — sygnałem jest zmiana trendu.
   Frameworki: AAFP/ISFM 5 filarów + behawioralne wskaźniki choroby.
   ============================================================ */

/* ---------- warstwa zapisu (window.storage + fallback) ---------- */
const mem = {};
const store = {
  async get(k) {
    try { const r = await window.storage.get(k, false); return r ? JSON.parse(r.value) : (mem[k] ?? null); }
    catch { return mem[k] ?? null; }
  },
  async set(k, v) {
    mem[k] = v;
    try { await window.storage.set(k, JSON.stringify(v), false); } catch {}
  },
};

/* ---------- konfiguracja śledzonych wskaźników ---------- */
const METRICS = [
  { key: "play",  label: "Zabawa i aktywność", icon: "🪶", normal: 2, concern: "low",
    options: [{v:0,l:"Brak"},{v:1,l:"Mało"},{v:2,l:"Jak zwykle"},{v:3,l:"Dużo"}] },
  { key: "appetite", label: "Apetyt", icon: "🍽", normal: 2, concern: "both", red: [0],
    options: [{v:0,l:"Nie je"},{v:1,l:"Mniej"},{v:2,l:"Jak zwykle"},{v:3,l:"Więcej"}] },
  { key: "vocal", label: "Miauczenie", icon: "🔊", normal: 1, concern: "high",
    options: [{v:0,l:"Mniej"},{v:1,l:"Jak zwykle"},{v:2,l:"Więcej"},{v:3,l:"Nocne / pod drzwiami"}] },
  { key: "social", label: "Kontakt z domem", icon: "🐾", normal: 1, concern: "both",
    options: [{v:0,l:"Chowa się"},{v:1,l:"Jak zwykle"},{v:2,l:"Lepki / nachalny"}] },
  { key: "mood", label: "Nastrój / napięcie", icon: "🌙", normal: 0, concern: "high",
    options: [{v:0,l:"Spokojny"},{v:1,l:"Czujny"},{v:2,l:"Lękliwy"},{v:3,l:"Agresywny"}] },
];

const LITTER = [
  { key: "ok", l: "Bez zmian", good: true },
  { key: "outside", l: "Poza kuwetą" },
  { key: "more", l: "Częściej" },
  { key: "less", l: "Rzadziej" },
  { key: "diarrhea", l: "Biegunka" },
  { key: "strain", l: "Zaparcie / wysiłek" },
  { key: "blood", l: "Krew", red: true },
  { key: "nourine", l: "Brak moczu", red: true },
];

const EVENTS = ["Przeprowadzka","Nowy zwierzak","Nowy domownik","Goście","Remont/hałas",
  "Zmiana karmy","Zmiana kuwety","Wizyta u weta","Sam w domu dłużej","Inne zwierzę za oknem"];

const PILLARS = [
  { key: "p1", t: "Bezpieczne kryjówki", d: "Miejsca, gdzie kot może się schować i odpocząć — najlepiej wyżej." },
  { key: "p2", t: "Rozdzielone zasoby", d: "Miska, woda, kuweta, drapak, legowiska — osobno i w kilku miejscach." },
  { key: "p3", t: "Zabawa łowiecka", d: "Codzienna zabawa naśladująca polowanie (wędka, podchody)." },
  { key: "p4", t: "Przewidywalny kontakt", d: "Spójne, łagodne interakcje — bez zmuszania do kontaktu." },
  { key: "p5", t: "Szacunek dla węchu", d: "Bez intensywnych zapachów; nie myć wszystkich legowisk naraz." },
];

/* ---------- pomocnicze ---------- */
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmt = (s) => { const d = new Date(s + "T00:00"); return d.toLocaleDateString("pl-PL",{day:"numeric",month:"short"}); };
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); };

function mode(arr) {
  if (!arr.length) return null;
  const c = {}; arr.forEach(v => c[v] = (c[v]||0)+1);
  return +Object.keys(c).reduce((a,b)=> c[b]>c[a]?b:a);
}

const MIN_DAYS = 7;   // minimum dni, by ustalić normę
const WIN = 7;        // okno "ostatnich dni"

function computeSignals(logs) {
  const sorted = [...logs].sort((a,b)=> a.date<b.date?1:-1);
  const recent = sorted.slice(0, WIN);
  const sigs = [];
  if (logs.length < MIN_DAYS) return { sigs, ready:false, have:logs.length };

  METRICS.forEach(m => {
    const all = logs.filter(l => l.m && l.m[m.key]!=null).map(l => l.m[m.key]);
    const older = sorted.slice(WIN).filter(l=>l.m && l.m[m.key]!=null).map(l=>l.m[m.key]);
    const base = mode(older.length>=3 ? older : all);
    if (base==null) return;
    const recVals = recent.filter(l=>l.m && l.m[m.key]!=null).map(l=>l.m[m.key]);
    if (recVals.length < 3) return;
    // czerwone flagi
    if (m.red && recVals.some(v=>m.red.includes(v))) {
      sigs.push({ key:m.key, label:m.label, icon:m.icon, sev:"high",
        text:`„${m.options.find(o=>m.red.includes(o.v)).l}" w ostatnich dniach`, base });
      return;
    }
    let off;
    if (m.concern==="low") off = recVals.filter(v=>v<base);
    else if (m.concern==="high") off = recVals.filter(v=>v>base);
    else off = recVals.filter(v=>v!==base);
    if (off.length>=3 && off.length/recVals.length>=0.5) {
      const dir = m.concern==="low" ? "poniżej normy"
        : m.concern==="high" ? "powyżej normy" : "inaczej niż zwykle";
      sigs.push({ key:m.key, label:m.label, icon:m.icon, sev:"med",
        text:`${off.length} z ${recVals.length} ostatnich dni ${dir}`, base });
    }
  });

  // kuweta
  const litterRecent = recent.flatMap(l => l.litter || []);
  const redL = litterRecent.filter(f => LITTER.find(x=>x.key===f)?.red);
  if (redL.length) sigs.push({ key:"litter", label:"Kuweta", icon:"⚠️", sev:"high",
    text:"Objaw alarmowy w kuwecie", base:null });
  else {
    const counts = {}; litterRecent.forEach(f=>{ if(f!=="ok") counts[f]=(counts[f]||0)+1; });
    const flagged = Object.entries(counts).filter(([,n])=>n>=2);
    if (flagged.length) sigs.push({ key:"litter", label:"Kuweta", icon:"🧷", sev:"med",
      text: flagged.map(([k])=>LITTER.find(x=>x.key===k)?.l).join(", "), base:null });
  }
  return { sigs, ready:true, have:logs.length };
}

/* ---------- dane przykładowe (scenariusz: mniej zabawy + nocne miauczenie po przeprowadzce) ---------- */
function demoLogs() {
  const out = [];
  for (let i = 20; i >= 0; i--) {
    const recent = i <= 6;
    out.push({
      date: daysAgo(i),
      m: {
        play: recent ? (i%2?1:0) : 2,
        appetite: recent && i<3 ? 1 : 2,
        vocal: recent ? (i<4?3:2) : 1,
        social: recent ? 0 : 1,
        mood: recent ? (i<3?2:1) : 0,
      },
      litter: ["ok"],
      events: i===18 ? ["Przeprowadzka"] : i===5 ? ["Goście"] : [],
      note: i===18 ? "Wprowadziliśmy się do nowego mieszkania." : "",
    });
  }
  return out;
}

/* =========================================================== */
export default function App() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [pillars, setPillars] = useState({});
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState("today");
  const [settings, setSettings] = useState(false);

  useEffect(() => { (async () => {
    setProfile(await store.get("cat:profile"));
    setPillars((await store.get("cat:pillars")) || {});
    setLogs((await store.get("cat:logs")) || []);
    setLoading(false);
  })(); }, []);

  const saveLogs = (l) => { setLogs(l); store.set("cat:logs", l); };
  const saveProfile = (p) => { setProfile(p); store.set("cat:profile", p); };
  const savePillars = (p) => { setPillars(p); store.set("cat:pillars", p); };

  const { sigs, ready, have } = computeSignals(logs);

  if (loading) return <Shell><div className="center muted">Wczytuję…</div></Shell>;
  if (!profile) return <Onboarding onDone={(p, pil, demo) => {
    saveProfile(p); savePillars(pil); if (demo) saveLogs(demoLogs());
  }} />;

  return (
    <Shell>
      <Style />
      <header className="hdr">
        <div className="hdr-cat">
          <span className="hdr-emoji">{profile.emoji}</span>
          <div>
            <div className="hdr-name">{profile.name}</div>
            <div className="hdr-sub">{ready ? "norma ustalona" : `uczę się normy · ${have}/${MIN_DAYS} dni`}</div>
          </div>
        </div>
        <button className="gear" onClick={()=>setSettings(true)}>⚙</button>
      </header>

      <main className="main">
        {tab==="today" && <Today profile={profile} logs={logs} saveLogs={saveLogs}
          sigs={sigs} ready={ready} have={have} goConsult={()=>setTab("ai")} />}
        {tab==="trends" && <Trends logs={logs} />}
        {tab==="ai" && <Consult profile={profile} pillars={pillars} logs={logs} sigs={sigs} />}
      </main>

      <nav className="tabs">
        {[["today","Dziś","◉"],["trends","Trendy","◔"],["ai","Behawiorysta","✦"]].map(([k,l,i])=>(
          <button key={k} className={"tab"+(tab===k?" on":"")} onClick={()=>setTab(k)}>
            <span className="tab-i">{i}</span><span>{l}</span>
          </button>
        ))}
      </nav>

      {settings && <Settings profile={profile} pillars={pillars} logs={logs}
        saveProfile={saveProfile} savePillars={savePillars} saveLogs={saveLogs}
        close={()=>setSettings(false)} />}
    </Shell>
  );
}

/* ---------- ekran: Dziś (szybki wpis + sygnały) ---------- */
function Today({ profile, logs, saveLogs, sigs, ready, have, goConsult }) {
  const existing = logs.find(l => l.date === todayStr());
  const [m, setM] = useState(existing?.m || Object.fromEntries(METRICS.map(x=>[x.key,x.normal])));
  const [litter, setLitter] = useState(existing?.litter || ["ok"]);
  const [events, setEvents] = useState(existing?.events || []);
  const [note, setNote] = useState(existing?.note || "");
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(!existing);

  const set = (k,v)=>{ setM(s=>({...s,[k]:v})); setSaved(false); };
  const toggleLitter = (k)=>{ setSaved(false); setLitter(prev=>{
    if (k==="ok") return ["ok"];
    const next = prev.filter(x=>x!=="ok");
    return next.includes(k) ? next.filter(x=>x!==k) : [...next,k];
  }); };
  const toggleEvent = (e)=>{ setSaved(false); setEvents(p=>p.includes(e)?p.filter(x=>x!==e):[...p,e]); };

  const save = ()=>{
    const entry = { date: todayStr(), m, litter: litter.length?litter:["ok"], events, note };
    saveLogs([...logs.filter(l=>l.date!==todayStr()), entry]);
    setSaved(true); setOpen(false);
  };

  return (
    <div className="col">
      {/* sygnały */}
      {!ready && (
        <div className="card soft">
          <div className="card-h">Buduję profil normy</div>
          <p className="muted sm">Po {MIN_DAYS} dniach obserwacji zacznę porównywać każdy dzień z tym, co u {profile.name} typowe, i sam zgłoszę odchylenia. Masz {have} {have===1?"dzień":"dni"}.</p>
        </div>
      )}
      {ready && sigs.length===0 && (
        <div className="card ok-card">
          <div className="card-h">✓ Wszystko w normie</div>
          <p className="muted sm">Żaden wskaźnik nie odbiega od typowego wzorca {profile.name}. Tak trzymaj.</p>
        </div>
      )}
      {sigs.map(s=>(
        <div key={s.key} className={"card sig "+(s.sev==="high"?"sig-high":"sig-med")}>
          <div className="sig-top">
            <span className="sig-icon">{s.icon}</span>
            <div>
              <div className="card-h">{s.label}</div>
              <div className="sm">{s.text}</div>
            </div>
          </div>
          {s.sev==="high" && <div className="sig-alert">Objaw, który warto pilnie skonsultować z lekarzem weterynarii.</div>}
          <button className="link-btn" onClick={goConsult}>Zapytaj behawiorystę →</button>
        </div>
      ))}

      {/* szybki wpis */}
      <div className="card">
        <div className="row-between">
          <div className="card-h">Dziś · {fmt(todayStr())}</div>
          {existing && !open && <button className="mini" onClick={()=>setOpen(true)}>edytuj</button>}
        </div>

        {!open && existing && <p className="muted sm">Wpis zapisany. {saved && "Zaktualizowano ✓"}</p>}

        {open && <>
          <button className="allnormal" onClick={()=>{ setM(Object.fromEntries(METRICS.map(x=>[x.key,x.normal]))); setLitter(["ok"]); }}>
            Wszystko jak zwykle
          </button>

          {METRICS.map(mt=>(
            <div key={mt.key} className="metric">
              <div className="metric-l"><span>{mt.icon}</span>{mt.label}</div>
              <div className="chips">
                {mt.options.map(o=>(
                  <button key={o.v}
                    className={"chip"+(m[mt.key]===o.v?" chip-on":"")+(mt.red?.includes(o.v)?" chip-red":"")}
                    onClick={()=>set(mt.key,o.v)}>{o.l}</button>
                ))}
              </div>
            </div>
          ))}

          <div className="metric">
            <div className="metric-l"><span>🪣</span>Kuweta</div>
            <div className="chips">
              {LITTER.map(f=>(
                <button key={f.key}
                  className={"chip"+(litter.includes(f.key)?" chip-on":"")+(f.red?" chip-red":"")+(f.good?" chip-good":"")}
                  onClick={()=>toggleLitter(f.key)}>{f.l}</button>
              ))}
            </div>
          </div>

          <div className="metric">
            <div className="metric-l"><span>📍</span>Zmiany w otoczeniu</div>
            <div className="chips">
              {EVENTS.map(e=>(
                <button key={e} className={"chip chip-ev"+(events.includes(e)?" chip-on":"")}
                  onClick={()=>toggleEvent(e)}>{e}</button>
              ))}
            </div>
          </div>

          <textarea className="note" placeholder="Notatka (opcjonalnie)…" value={note}
            onChange={e=>{setNote(e.target.value); setSaved(false);}} />
          <button className="primary" onClick={save}>Zapisz dzień</button>
        </>}
      </div>
    </div>
  );
}

/* ---------- ekran: Trendy ---------- */
function Trends({ logs }) {
  const [sel, setSel] = useState("play");
  const mt = METRICS.find(x=>x.key===sel);
  const sorted = [...logs].sort((a,b)=> a.date<b.date?-1:1).slice(-30);
  const data = sorted.map(l=>({ date: fmt(l.date), v: l.m?.[sel] ?? null,
    ev:(l.events&&l.events.length)?l.events.join(", "):"" }));
  const older = [...logs].sort((a,b)=> a.date<b.date?1:-1).slice(WIN)
    .filter(l=>l.m&&l.m[sel]!=null).map(l=>l.m[sel]);
  const base = mode(older.length>=3?older:logs.filter(l=>l.m&&l.m[sel]!=null).map(l=>l.m[sel]));

  if (logs.length===0) return <div className="card center muted">Brak danych. Zacznij od zakładki „Dziś".</div>;

  return (
    <div className="col">
      <div className="chips wrapchips">
        {METRICS.map(x=>(
          <button key={x.key} className={"chip"+(sel===x.key?" chip-on":"")} onClick={()=>setSel(x.key)}>
            {x.icon} {x.label}
          </button>
        ))}
      </div>
      <div className="card">
        <div className="card-h">{mt.icon} {mt.label}</div>
        <div className="muted sm" style={{marginBottom:8}}>
          {base!=null ? <>Norma {mt.options.find(o=>o.v===base)?.l} · linia poniżej = odchylenie</> : "Zbieram dane"}
        </div>
        <div style={{height:200}}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{top:6,right:6,left:-22,bottom:0}}>
              <CartesianGrid strokeDasharray="2 4" stroke="#E3D8C5" />
              {base!=null && <ReferenceArea y1={base-0.4} y2={base+0.4} fill="#6E7F5B" fillOpacity={0.12} />}
              <XAxis dataKey="date" tick={{fontSize:10, fill:"#8A7C68"}} interval="preserveStartEnd" />
              <YAxis domain={[0, Math.max(...mt.options.map(o=>o.v))]} ticks={mt.options.map(o=>o.v)}
                tickFormatter={v=>mt.options.find(o=>o.v===v)?.l?.slice(0,6)||v} tick={{fontSize:9, fill:"#8A7C68"}} width={64}/>
              <Tooltip contentStyle={{fontSize:12, borderRadius:10, border:"1px solid #E3D8C5", fontFamily:"Hanken Grotesk"}}
                formatter={(v)=>[mt.options.find(o=>o.v===v)?.l, "Stan"]}
                labelFormatter={(l,p)=>{const e=p?.[0]?.payload?.ev; return l+(e?` · ${e}`:"");}}/>
              <Line type="monotone" dataKey="v" stroke="#B9603C" strokeWidth={2.5} dot={{r:3,fill:"#B9603C"}}
                connectNulls activeDot={{r:5}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <div className="card-h">Oś czasu zmian w otoczeniu</div>
        {sorted.filter(l=>l.events&&l.events.length).reverse().map((l,i)=>(
          <div key={i} className="tl-row">
            <span className="tl-date">{fmt(l.date)}</span>
            <span className="tl-ev">{l.events.join(", ")}{l.note?` — ${l.note}`:""}</span>
          </div>
        ))}
        {!sorted.some(l=>l.events&&l.events.length) && <p className="muted sm">Brak odnotowanych zdarzeń.</p>}
      </div>
    </div>
  );
}

/* ---------- ekran: Behawiorysta (AI) ---------- */
function Consult({ profile, pillars, logs, sigs }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs, busy]);

  const suggestions = [
    "Dlaczego miauczy w nocy pod drzwiami, skoro wcześniej był spokojny?",
    "Czy mój kot bawi się wystarczająco?",
    "Co mówią dane z ostatnich dni?",
    "Czy dobrze urządziłem mu środowisko?",
  ];

  const buildSystem = () => {
    const recent = [...logs].sort((a,b)=>a.date<b.date?1:-1).slice(0,14);
    const lines = recent.map(l=>{
      const parts = METRICS.map(m=>{
        const v=l.m?.[m.key]; return v==null?null:`${m.label}:${m.options.find(o=>o.v===v)?.l}`;
      }).filter(Boolean);
      const lit=(l.litter||[]).filter(x=>x!=="ok").map(k=>LITTER.find(x=>x.key===k)?.l);
      const ev=(l.events||[]);
      return `${l.date}: ${parts.join(", ")}${lit.length?` | kuweta: ${lit.join(",")}`:""}${ev.length?` | zdarzenia: ${ev.join(",")}`:""}${l.note?` | "${l.note}"`:""}`;
    }).join("\n");
    const pil = PILLARS.map(p=>`${p.t}: ${pillars[p.key]?"OK":"BRAK/niepewne"}`).join("; ");
    const sg = sigs.length ? sigs.map(s=>`${s.label} — ${s.text}`).join("; ") : "brak aktywnych odchyleń";
    return `Jesteś doświadczonym behawiorystą kotów z wiedzą z etologii klinicznej (wytyczne AAFP/ISFM, 5 filarów środowiska, behawioralne wskaźniki bólu/stresu/choroby).
ZASADY:
- Opieraj się na danych z dziennika tego konkretnego kota. Odnoś się do nich wprost.
- Rozróżniaj przyczyny medyczne vs behawioralne; przy objawach alarmowych (nie je >24h, problemy z oddawaniem moczu, krew, nagła agresja, apatia, szybki spadek wagi) wyraźnie kieruj PILNIE do lekarza weterynarii — nie diagnozuj chorób.
- Pytaj o brakujący kontekst (kiedy się zaczęło, co się zmieniło), jeśli to potrzebne do dobrej odpowiedzi.
- Łącz objaw z odnotowanymi zdarzeniami i z 5 filarami. Dawaj konkretne, wykonalne kroki — nie ogólniki dla laików.
- Pisz po polsku, zwięźle, bez lania wody. Maks 5–7 zdań, możesz użyć krótkiej listy kroków.

PROFIL: ${profile.name}, ${profile.sex}, ${profile.indoor}, ${profile.multi?"mieszka z innymi zwierzętami":"jedyne zwierzę"}. ${profile.notes||""}
5 FILARÓW: ${pil}
AKTYWNE ODCHYLENIA: ${sg}
DZIENNIK (ostatnie 14 dni):
${lines || "brak wpisów"}`;
  };

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    const next = [...msgs, {role:"user", content:q}];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000,
          system: buildSystem(), messages: next }),
      });
      const data = await res.json();
      const txt = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n")
        || "Przepraszam, nie udało się uzyskać odpowiedzi. Spróbuj ponownie.";
      setMsgs(m=>[...m, {role:"assistant", content:txt}]);
    } catch {
      setMsgs(m=>[...m, {role:"assistant", content:"Błąd połączenia z modelem. Spróbuj ponownie za chwilę."}]);
    } finally { setBusy(false); }
  };

  return (
    <div className="consult">
      <div className="chat">
        {msgs.length===0 && (
          <div className="card soft">
            <div className="card-h">Konsultacja</div>
            <p className="muted sm">Pytam o kontekst i odpowiadam na podstawie dziennika {profile.name}. Nie zastępuję wizyty u weterynarza.</p>
            <div className="sugs">
              {suggestions.map(s=> <button key={s} className="sug" onClick={()=>send(s)}>{s}</button>)}
            </div>
          </div>
        )}
        {msgs.map((m,i)=>(
          <div key={i} className={"bubble "+(m.role==="user"?"b-user":"b-ai")}>
            {m.role==="assistant" && <div className="b-tag">behawiorysta</div>}
            <div className="b-txt">{m.content}</div>
          </div>
        ))}
        {busy && <div className="bubble b-ai"><div className="b-txt typing">analizuję dziennik…</div></div>}
        <div ref={endRef} />
      </div>
      <div className="composer">
        <input className="cin" placeholder="Zadaj pytanie o swojego kota…" value={input}
          onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} />
        <button className="csend" onClick={()=>send()} disabled={busy}>➤</button>
      </div>
    </div>
  );
}

/* ---------- onboarding ---------- */
function Onboarding({ onDone }) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🐈");
  const [sex, setSex] = useState("kot");
  const [indoor, setIndoor] = useState("domowy");
  const [multi, setMulti] = useState(false);
  const [pil, setPil] = useState({});
  const [notes, setNotes] = useState("");
  const emojis = ["🐈","🐈‍⬛","😺","😻","🐱"];

  return (
    <Shell>
      <Style />
      <div className="onb">
        <div className="onb-logo">✦</div>
        <h1 className="onb-title">KotoDziennik</h1>
        <p className="onb-sub">Wirtualny behawiorysta, który uczy się normy Twojego kota i wyłapuje zmiany.</p>

        <div className="card">
          <label className="lbl">Imię kota</label>
          <input className="tin" value={name} onChange={e=>setName(e.target.value)} placeholder="np. Mruczek" />
          <label className="lbl">Awatar</label>
          <div className="chips">{emojis.map(e=>(
            <button key={e} className={"chip emoji"+(emoji===e?" chip-on":"")} onClick={()=>setEmoji(e)}>{e}</button>))}</div>
          <div className="row2">
            <div><label className="lbl">Płeć</label>
              <div className="chips">{["kot","kotka"].map(s=>(
                <button key={s} className={"chip"+(sex===s?" chip-on":"")} onClick={()=>setSex(s)}>{s}</button>))}</div></div>
            <div><label className="lbl">Tryb życia</label>
              <div className="chips">{["domowy","wychodzący"].map(s=>(
                <button key={s} className={"chip"+(indoor===s?" chip-on":"")} onClick={()=>setIndoor(s)}>{s}</button>))}</div></div>
          </div>
          <button className={"chip wide"+(multi?" chip-on":"")} onClick={()=>setMulti(!multi)}>
            {multi?"✓ ":""}Mieszka z innymi zwierzętami
          </button>
        </div>

        <div className="card">
          <div className="card-h">Środowisko · 5 filarów (AAFP/ISFM)</div>
          <p className="muted sm">Zaznacz, co już masz zapewnione. To kontekst dla porad.</p>
          {PILLARS.map(p=>(
            <button key={p.key} className={"pillar"+(pil[p.key]?" pillar-on":"")} onClick={()=>setPil(s=>({...s,[p.key]:!s[p.key]}))}>
              <span className="pillar-box">{pil[p.key]?"✓":""}</span>
              <span><b>{p.t}</b><br/><span className="muted sm">{p.d}</span></span>
            </button>
          ))}
        </div>

        <button className="primary big" disabled={!name.trim()}
          onClick={()=>onDone({name:name.trim(),emoji,sex,indoor,multi,notes}, pil, false)}>
          Zaczynamy
        </button>
        <button className="ghost" onClick={()=>onDone({name:name.trim()||"Demo",emoji,sex,indoor,multi,notes}, pil, true)}>
          Wypełnij przykładowymi danymi (demo)
        </button>
        <p className="disclaimer">KotoDziennik wspiera obserwację — nie zastępuje diagnozy lekarza weterynarii.</p>
      </div>
    </Shell>
  );
}

/* ---------- ustawienia ---------- */
function Settings({ profile, pillars, logs, saveProfile, savePillars, saveLogs, close }) {
  const [pil, setPil] = useState(pillars);
  const [notes, setNotes] = useState(profile.notes||"");
  return (
    <div className="overlay" onClick={close}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="row-between"><h2 className="sheet-h">Ustawienia</h2><button className="gear" onClick={close}>✕</button></div>
        <div className="card-h">5 filarów środowiska</div>
        {PILLARS.map(p=>(
          <button key={p.key} className={"pillar"+(pil[p.key]?" pillar-on":"")}
            onClick={()=>setPil(s=>({...s,[p.key]:!s[p.key]}))}>
            <span className="pillar-box">{pil[p.key]?"✓":""}</span>
            <span><b>{p.t}</b><br/><span className="muted sm">{p.d}</span></span>
          </button>
        ))}
        <label className="lbl">Notatki o kocie (rasa, choroby, charakter)</label>
        <textarea className="note" value={notes} onChange={e=>setNotes(e.target.value)} />
        <button className="primary" onClick={()=>{ savePillars(pil); saveProfile({...profile,notes}); close(); }}>Zapisz</button>
        <button className="ghost" onClick={()=>{ saveLogs(demoLogs()); close(); }}>Wczytaj dane demo (21 dni)</button>
        <button className="ghost danger" onClick={()=>{ if(confirm("Wyczyścić wszystkie dane?")){ saveLogs([]); } close(); }}>Wyczyść dziennik</button>
        <p className="muted sm" style={{marginTop:12}}>Wpisów w dzienniku: {logs.length}</p>
      </div>
    </div>
  );
}

/* ---------- powłoka + style ---------- */
function Shell({ children }) {
  return <div className="frame"><Style />{children}</div>;
}

function Style() {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
    * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
    .frame{
      max-width:460px; margin:0 auto; min-height:100vh; height:100%;
      background:
        radial-gradient(circle at 18% 12%, #F7F1E6 0%, rgba(247,241,230,0) 55%),
        radial-gradient(circle at 85% 80%, #EFE6D5 0%, rgba(239,230,213,0) 50%),
        #F2EADC;
      color:#2B241C; font-family:'Hanken Grotesk',sans-serif;
      display:flex; flex-direction:column; position:relative; overflow:hidden;
    }
    .main{ flex:1; overflow-y:auto; padding:14px 14px 90px; }
    .center{ display:flex; align-items:center; justify-content:center; min-height:50vh; }
    .muted{ color:#8A7C68; } .sm{ font-size:13px; line-height:1.45; } .col{ display:flex; flex-direction:column; gap:12px; }

    /* header */
    .hdr{ display:flex; align-items:center; justify-content:space-between; padding:16px 16px 8px; }
    .hdr-cat{ display:flex; align-items:center; gap:11px; }
    .hdr-emoji{ font-size:30px; filter:drop-shadow(0 2px 3px rgba(120,90,40,.18)); }
    .hdr-name{ font-family:'Fraunces',serif; font-size:21px; font-weight:600; letter-spacing:-.3px; }
    .hdr-sub{ font-size:11px; color:#A38A5e; text-transform:uppercase; letter-spacing:1px; }
    .gear{ width:38px; height:38px; border-radius:50%; border:1px solid #E0D4BF; background:#FBF7EF;
      font-size:17px; color:#6B5F4F; cursor:pointer; }

    /* cards */
    .card{ background:#FCF8F0; border:1px solid #E7DCC8; border-radius:18px; padding:15px 16px;
      box-shadow:0 1px 2px rgba(120,90,40,.04), 0 8px 22px rgba(120,90,40,.05); }
    .card.soft{ background:#F6EFE1; box-shadow:none; }
    .card-h{ font-family:'Fraunces',serif; font-size:16px; font-weight:600; margin-bottom:3px; }
    .row-between{ display:flex; align-items:center; justify-content:space-between; }
    .ok-card{ border-color:#CDD6BE; background:#F1F4E9; }
    .ok-card .card-h{ color:#5C6E48; }

    /* sygnały */
    .sig-top{ display:flex; gap:11px; align-items:flex-start; }
    .sig-icon{ font-size:22px; line-height:1; }
    .sig-med{ border-color:#E4C690; background:#FBF1DC; }
    .sig-high{ border-color:#D9A18C; background:#F8E7DE; }
    .sig-alert{ margin-top:8px; font-size:12.5px; color:#8E3C25; font-weight:600; }
    .link-btn{ margin-top:10px; background:none; border:none; color:#B9603C; font-weight:600;
      font-size:13px; cursor:pointer; padding:0; font-family:inherit; }

    /* metryki / chipsy */
    .metric{ margin-top:14px; }
    .metric-l{ display:flex; align-items:center; gap:7px; font-size:13px; font-weight:600; color:#5e5343; margin-bottom:7px; }
    .chips{ display:flex; flex-wrap:wrap; gap:6px; }
    .wrapchips{ margin-bottom:2px; }
    .chip{ border:1px solid #E0D4BF; background:#FFFDF8; color:#6B5F4F; border-radius:11px;
      padding:7px 11px; font-size:12.5px; font-weight:500; cursor:pointer; font-family:inherit; transition:.12s; }
    .chip:active{ transform:scale(.96); }
    .chip-on{ background:#2B241C; color:#F7F1E6; border-color:#2B241C; }
    .chip-red.chip-on{ background:#9E3A24; border-color:#9E3A24; }
    .chip-good.chip-on{ background:#5C6E48; border-color:#5C6E48; }
    .chip-ev{ font-size:11.5px; padding:6px 9px; }
    .chip.emoji{ font-size:20px; padding:5px 12px; }
    .chip.wide{ width:100%; text-align:center; margin-top:10px; }
    .allnormal{ width:100%; margin-top:12px; padding:11px; border-radius:12px; border:1px dashed #C9B79A;
      background:#F4ECDC; color:#6B5F4F; font-weight:600; cursor:pointer; font-family:inherit; font-size:13.5px; }

    .note{ width:100%; margin-top:12px; border:1px solid #E0D4BF; border-radius:12px; padding:10px;
      font-family:inherit; font-size:13px; resize:vertical; min-height:54px; background:#FFFDF8; color:#2B241C; }
    .primary{ width:100%; margin-top:13px; padding:13px; border:none; border-radius:13px; background:#B9603C;
      color:#FFF7EF; font-weight:600; font-size:14.5px; cursor:pointer; font-family:inherit; letter-spacing:.2px;
      box-shadow:0 6px 16px rgba(185,96,60,.28); }
    .primary.big{ padding:15px; font-size:15.5px; margin-top:6px; }
    .primary:disabled{ opacity:.45; box-shadow:none; }
    .ghost{ width:100%; margin-top:8px; padding:11px; border:1px solid #E0D4BF; border-radius:12px;
      background:transparent; color:#6B5F4F; font-weight:500; cursor:pointer; font-family:inherit; font-size:13px; }
    .ghost.danger{ color:#9E3A24; border-color:#E0C3B8; }
    .mini{ background:none; border:none; color:#B9603C; font-weight:600; font-size:12.5px; cursor:pointer; font-family:inherit; }

    /* trendy */
    .tl-row{ display:flex; gap:10px; padding:7px 0; border-top:1px solid #EFE6D5; font-size:13px; }
    .tl-row:first-of-type{ border-top:none; }
    .tl-date{ color:#A38A5e; min-width:54px; font-weight:600; }
    .tl-ev{ color:#4a4136; }

    /* tabs */
    .tabs{ position:absolute; bottom:0; left:0; right:0; max-width:460px; margin:0 auto; display:flex;
      background:rgba(252,248,240,.92); backdrop-filter:blur(8px); border-top:1px solid #E7DCC8; padding:7px 6px 9px; }
    .tab{ flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; background:none; border:none;
      color:#A89A84; font-size:11px; font-weight:600; cursor:pointer; font-family:inherit; padding:5px; }
    .tab-i{ font-size:16px; }
    .tab.on{ color:#B9603C; }

    /* consult */
    .consult{ display:flex; flex-direction:column; height:100%; }
    .chat{ flex:1; overflow-y:auto; padding:14px 14px 8px; display:flex; flex-direction:column; gap:11px; }
    .bubble{ max-width:86%; padding:11px 13px; border-radius:15px; font-size:13.5px; line-height:1.5; white-space:pre-wrap; }
    .b-user{ align-self:flex-end; background:#2B241C; color:#F7F1E6; border-bottom-right-radius:5px; }
    .b-ai{ align-self:flex-start; background:#FCF8F0; border:1px solid #E7DCC8; border-bottom-left-radius:5px; }
    .b-tag{ font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#B9603C; font-weight:700; margin-bottom:4px; }
    .typing{ color:#A89A84; font-style:italic; }
    .sugs{ display:flex; flex-direction:column; gap:7px; margin-top:11px; }
    .sug{ text-align:left; background:#FFFDF8; border:1px solid #E0D4BF; border-radius:12px; padding:10px 12px;
      font-size:13px; color:#4a4136; cursor:pointer; font-family:inherit; }
    .composer{ display:flex; gap:8px; padding:10px 14px calc(78px + env(safe-area-inset-bottom,0)); }
    .cin{ flex:1; border:1px solid #E0D4BF; border-radius:14px; padding:12px 14px; font-family:inherit;
      font-size:14px; background:#FFFDF8; color:#2B241C; }
    .csend{ width:46px; border:none; border-radius:14px; background:#B9603C; color:#FFF7EF; font-size:16px; cursor:pointer; }
    .csend:disabled{ opacity:.4; }

    /* onboarding */
    .onb{ padding:32px 18px 40px; display:flex; flex-direction:column; gap:14px; overflow-y:auto; height:100vh; }
    .onb-logo{ font-size:34px; color:#B9603C; text-align:center; }
    .onb-title{ font-family:'Fraunces',serif; font-size:30px; font-weight:600; text-align:center; margin:0; letter-spacing:-.5px; }
    .onb-sub{ text-align:center; color:#8A7C68; font-size:14px; margin:0 0 6px; line-height:1.5; }
    .lbl{ display:block; font-size:12px; font-weight:600; color:#8A7C68; margin:12px 0 6px; text-transform:uppercase; letter-spacing:.5px; }
    .tin,.cin{ outline:none; } .tin:focus,.cin:focus,.note:focus{ border-color:#B9603C; }
    .tin{ width:100%; border:1px solid #E0D4BF; border-radius:12px; padding:12px; font-family:inherit; font-size:15px; background:#FFFDF8; color:#2B241C; }
    .row2{ display:flex; gap:14px; } .row2>div{ flex:1; }
    .pillar{ display:flex; gap:11px; align-items:flex-start; width:100%; text-align:left; margin-top:9px;
      background:#FFFDF8; border:1px solid #E7DCC8; border-radius:13px; padding:11px 12px; cursor:pointer; font-family:inherit; color:#2B241C; }
    .pillar-on{ border-color:#5C6E48; background:#F1F4E9; }
    .pillar-box{ flex:none; width:22px; height:22px; border-radius:7px; border:1.5px solid #C9B79A; display:flex;
      align-items:center; justify-content:center; font-size:13px; color:#5C6E48; font-weight:700; margin-top:1px; }
    .pillar-on .pillar-box{ border-color:#5C6E48; background:#E2EAD3; }
    .disclaimer{ text-align:center; font-size:11.5px; color:#A89A84; margin-top:4px; line-height:1.5; }

    /* overlay */
    .overlay{ position:absolute; inset:0; background:rgba(43,36,28,.45); display:flex; align-items:flex-end;
      z-index:20; backdrop-filter:blur(2px); }
    .sheet{ width:100%; max-height:88%; overflow-y:auto; background:#F6EFE1; border-radius:22px 22px 0 0;
      padding:18px 16px calc(28px + env(safe-area-inset-bottom,0)); display:flex; flex-direction:column; gap:4px; }
    .sheet-h{ font-family:'Fraunces',serif; font-size:21px; font-weight:600; margin:0 0 8px; }
    .sheet .card-h{ margin-top:8px; }
  `}</style>;
}
