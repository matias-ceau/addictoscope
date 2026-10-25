import { FilePicker, PasteButton, UploadIcon } from "./DropOverlay";

const STEPS = [
  { title: "Déposez", text: "Comptes rendus, historiques d'observations, courriers : PDF, Word, texte, ou un texte collé." },
  { title: "Vérifiez", text: "Les noms, numéros et adresses détectés sont surlignés sur la page. Un clic pour corriger." },
  { title: "Récupérez", text: "Un PDF (ou un texte) pseudonymisé, prêt pour l'analyse par IA." },
];

export function Welcome({ onFiles }: { onFiles: (files: File[]) => void }) {
  return (
    <main className="welcome">
      <FilePicker onFiles={onFiles} className="welcome-drop">
        <span className="welcome-icon">
          <UploadIcon size={34} />
        </span>
        <strong>Glissez vos documents patient ici</strong>
        <span className="muted">ou cliquez pour choisir des fichiers (PDF, Word, texte)</span>
      </FilePicker>
      <PasteButton onFiles={onFiles} className="welcome-paste" />
      <ol className="steps">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <span className="step-num">{i + 1}</span>
            <div>
              <strong>{s.title}</strong>
              <p>{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="welcome-note">
        La pseudonymisation s'exécute entièrement dans ce navigateur : les documents d'origine ne sont jamais envoyés
        sur Internet. Seuls les documents pseudonymisés et vérifiés pourront, plus tard, être confiés à une IA.
      </p>
    </main>
  );
}
