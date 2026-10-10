/**
 * The correspondence table (pseudonym -> real value) is the one thing that
 * re-identifies a patient. It never leaves the browser unencrypted: the
 * export is AES-GCM with a key derived from a user password (PBKDF2).
 */
export interface KeyEntry {
  label: string;
  category: string;
  values: string[];
}

const ITERATIONS = 310_000;

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptKeyfile(entries: KeyEntry[], password: string): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const plain = new TextEncoder().encode(JSON.stringify({ formatVersion: 1, entries }));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain));
  const header = new TextEncoder().encode("AXKEY1");
  const out = new Uint8Array(header.length + salt.length + iv.length + cipher.length);
  out.set(header, 0);
  out.set(salt, header.length);
  out.set(iv, header.length + salt.length);
  out.set(cipher, header.length + salt.length + iv.length);
  return out;
}

export async function decryptKeyfile(data: Uint8Array, password: string): Promise<KeyEntry[]> {
  const header = new TextDecoder().decode(data.slice(0, 6));
  if (header !== "AXKEY1") throw new Error("Not an addictoscope key file");
  const salt = data.slice(6, 22);
  const iv = data.slice(22, 34);
  const key = await deriveKey(password, salt);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data.slice(34));
  return JSON.parse(new TextDecoder().decode(plain)).entries;
}
