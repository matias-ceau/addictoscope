import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./ui/App";
import { Library } from "./ui/Library";
import "./ui/styles.css";

/** ?library=<path>/library.json: the app opened on a library of analysed dossiers. */
const library = new URLSearchParams(window.location.search).get("library");

createRoot(document.getElementById("root")!).render(<StrictMode>{library ? <Library url={library} /> : <App />}</StrictMode>);
