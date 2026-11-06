import { useCallback, useEffect, useState } from "react";

import { loadLibrary, type Library as LibraryData } from "../app/library";
import { App, type LibraryDossierStatus } from "./App";

const STATUS_LABEL: Record<LibraryDossierStatus | "idle", string> = {
  idle: "à ouvrir",
  loading: "en cours",
  ready: "prêt",
  error: "erreur",
};

/**
 * The app opened on a library of analysed dossiers: a sidebar of dossiers,
 * one app per opened dossier, kept mounted (coming back is immediate).
 */
export function Library(props: { url: string }) {
  const [lib, setLib] = useState<LibraryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [opened, setOpened] = useState<string[]>([]);
  const [status, setStatus] = useState<Record<string, LibraryDossierStatus>>({});
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    loadLibrary(props.url)
      .then((l) => {
        setLib(l);
        const first = l.groups.flatMap((g) => g.dossiers)[0]?.slug ?? null;
        setActive(first);
        if (first) setOpened([first]);
      })
      .catch((err) => setError(String((err as Error).message ?? err)));
  }, [props.url]);

  const open = useCallback((slug: string) => {
    setActive(slug);
    setOpened((o) => (o.includes(slug) ? o : [...o, slug]));
  }, []);
  const onStatus = useCallback((slug: string, s: LibraryDossierStatus) => setStatus((x) => ({ ...x, [slug]: s })), []);

  if (error) {
    return (
      <div className="library-error" role="alert">
        <h1>addictoscope</h1>
        <p>{error}</p>
        <a href={window.location.pathname}>Ouvrir l'application sans bibliothèque</a>
      </div>
    );
  }
  if (!lib) return <p className="library-loading muted">Chargement de la bibliothèque…</p>;

  const dossiers = lib.groups.flatMap((g) => g.dossiers);
  return (
    <div className={`library${collapsed ? " collapsed" : ""}`}>
      <aside className="library-side" aria-label="Dossiers">
        <div className="library-head">
          {!collapsed && <strong>{lib.title}</strong>}
          <button className="small-btn" onClick={() => setCollapsed((c) => !c)} title={collapsed ? "Afficher les dossiers" : "Replier la liste"}>
            {collapsed ? "»" : "«"}
          </button>
        </div>
        {!collapsed &&
          lib.groups.map((g) => (
            <section key={g.title} className="library-group">
              <h2>{g.title}</h2>
              <ul>
                {g.dossiers.map((d) => {
                  const st = status[d.slug] ?? "idle";
                  return (
                    <li key={d.slug}>
                      <button className={`library-item${d.slug === active ? " active" : ""}`} aria-current={d.slug === active} onClick={() => open(d.slug)}>
                        <span className="library-title">{d.title}</span>
                        {d.summary && <span className="library-summary">{d.summary}</span>}
                        <span className="library-meta">
                          {d.docs.length} document{d.docs.length > 1 ? "s" : ""}
                          {d.events !== undefined ? ` · ${d.events} événements` : ""}
                          <span className={`library-status ${st}`}>{STATUS_LABEL[st]}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
      </aside>
      <div className="library-main">
        {dossiers
          .filter((d) => opened.includes(d.slug))
          .map((d) => (
            <div key={d.slug} className="library-dossier" hidden={d.slug !== active}>
              <App library={{ lib, dossier: d, onStatus: (s) => onStatus(d.slug, s) }} />
            </div>
          ))}
      </div>
    </div>
  );
}
