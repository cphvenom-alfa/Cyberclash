// File: src/lib/ciphers.ts
// Pure cipher helpers shared by the server (to encrypt on save) and the admin page (live preview).
export const CIPHER_VALUES = ["caesar", "atbash", "vigenere", "substitution", "railfence", "morse", "binary", "hex", "base64", "a1z26", "polybius", "reverse"] as const;
export type CipherType = (typeof CIPHER_VALUES)[number];

export const CIPHER_TYPES: { value: CipherType; label: string; level: "Easy" | "Medium" | "Hard"; info: string }[] = [
  { value: "reverse", label: "Reverse", level: "Easy", info: "The whole message written backwards." },
  { value: "atbash", label: "Atbash", level: "Easy", info: "Mirrored alphabet: A becomes Z, B becomes Y." },
  { value: "a1z26", label: "A1Z26", level: "Easy", info: "Each letter becomes its alphabet position (A=1 ... Z=26)." },
  { value: "caesar", label: "Caesar", level: "Easy", info: "Every letter shifted by a fixed number. A shift of 13 is ROT13." },
  { value: "morse", label: "Morse", level: "Medium", info: "Dots and dashes. Letters split by spaces, words by /." },
  { value: "binary", label: "Binary", level: "Medium", info: "8-bit ASCII, one group of 0s and 1s per character." },
  { value: "hex", label: "Hexadecimal", level: "Medium", info: "Two hex digits per ASCII character." },
  { value: "base64", label: "Base64", level: "Medium", info: "Standard Base64 text." },
  { value: "polybius", label: "Polybius square", level: "Medium", info: "Letters become row/column numbers in a 5x5 grid (I and J share a cell)." },
  { value: "substitution", label: "Substitution", level: "Hard", info: "Each letter swapped for another using a secret 26-letter key." },
  { value: "vigenere", label: "Vigenère", level: "Hard", info: "A repeating keyword shifts each letter by a different amount." },
  { value: "railfence", label: "Rail fence", level: "Hard", info: "Letters written in a zigzag over several rows, then read row by row." },
];

const MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--",
  N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
};
const GRID = "ABCDEFGHIKLMNOPQRSTUVWXYZ"; // Polybius: no J
const words = (t: string) => t.trim().split(/\s+/).filter(Boolean);
const shiftLetters = (t: string, f: (offset: number, i: number) => number) => {
  let i = 0;
  return t.replace(/[a-z]/gi, (c) => {
    const b = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((((c.charCodeAt(0) - b + f(c.charCodeAt(0) - b, i++)) % 26) + 26) % 26) + b);
  });
};

export const caesar = (t: string, shift: number) => shiftLetters(t, () => shift);
export const atbash = (t: string) => shiftLetters(t, (o) => 25 - 2 * o);
export const vigenere = (t: string, key: string) => {
  const k = key.toUpperCase().replace(/[^A-Z]/g, "");
  return shiftLetters(t, (_, i) => k.charCodeAt(i % k.length) - 65);
};
export const reverse = (t: string) => [...t].reverse().join("");
export const morse = (t: string) => words(t.toUpperCase()).map((w) => [...w].map((c) => MORSE[c] ?? "").filter(Boolean).join(" ")).join(" / ");
export const binary = (t: string) => [...t].map((c) => (c.charCodeAt(0) & 0xff).toString(2).padStart(8, "0")).join(" ");
export const hex = (t: string) => [...t].map((c) => (c.charCodeAt(0) & 0xff).toString(16).padStart(2, "0").toUpperCase()).join(" ");
export const base64 = (t: string) => btoa(String.fromCharCode(...new TextEncoder().encode(t)));
export const a1z26 = (t: string) => words(t.toUpperCase()).map((w) => [...w].map((c) => c.charCodeAt(0) - 64).join("-")).join(" / ");
export const polybius = (t: string) =>
  words(t.toUpperCase()).map((w) => [...w].map((c) => { const i = GRID.indexOf(c); return `${Math.floor(i / 5) + 1}${(i % 5) + 1}`; }).join(" ")).join(" / ");
export function railfence(t: string, rails: number) {
  const rows = Array.from({ length: rails }, () => "");
  let r = 0, d = 1;
  for (const ch of t.replace(/\s+/g, "").toUpperCase()) {
    rows[r] += ch;
    if (r === 0) d = 1; else if (r === rails - 1) d = -1;
    r += d;
  }
  return rows.join("");
}
export const isValidKey = (key: string) => /^[A-Za-z]{26}$/.test(key) && new Set(key.toUpperCase()).size === 26;
export const substitution = (t: string, key: string) =>
  t.replace(/[a-z]/gi, (c) => { const k = key[c.toUpperCase().charCodeAt(0) - 65]!; return c === c.toUpperCase() ? k.toUpperCase() : k.toLowerCase(); });

/** Some ciphers cannot carry punctuation. Clean the plain text first so it always decodes back to exactly what is stored. */
export function sanitize(type: CipherType, text: string) {
  const t = text.trim().replace(/\s+/g, " ");
  if (type === "morse" || type === "railfence") return t.replace(/[^a-z0-9 ]/gi, "").replace(/\s+/g, " ").trim();
  if (type === "a1z26" || type === "polybius") return t.replace(/[^a-z ]/gi, "").replace(/\s+/g, " ").trim();
  return t;
}
export const problem = (type: CipherType, text: string) =>
  type === "polybius" && /j/i.test(text) ? "Polybius merges I and J, so avoid the letter J in this message." : null;

export type CipherOpts = { shift?: number; key?: string; rails?: number };
export function encrypt(type: CipherType, text: string, o: CipherOpts) {
  switch (type) {
    case "caesar": return caesar(text, o.shift ?? 3);
    case "atbash": return atbash(text);
    case "vigenere": return vigenere(text, o.key ?? "");
    case "substitution": return substitution(text, o.key ?? "");
    case "railfence": return railfence(text, o.rails ?? 3);
    case "morse": return morse(text);
    case "binary": return binary(text);
    case "hex": return hex(text);
    case "base64": return base64(text);
    case "a1z26": return a1z26(text);
    case "polybius": return polybius(text);
    case "reverse": return reverse(text);
  }
}

// Preserve the sample seed script's existing helper signature.
export const encodeCipher = (text: string, type: string) =>
  encrypt(type as CipherType, text, {});

export function suggestHints(type: CipherType, plaintext: string, o: CipherOpts) {
  const meta = CIPHER_TYPES.find((c) => c.value === type)!;
  const method: Record<CipherType, string> = {
    caesar: `Each letter was shifted forward by ${o.shift ?? 3} places in the alphabet. Shift back to decode.`,
    atbash: "The alphabet is mirrored: A becomes Z, B becomes Y, and so on. Apply the same swap to decode.",
    vigenere: "A repeating keyword shifts each letter by a different amount. Work out the keyword, then shift back.",
    substitution: "Every letter was swapped for another using one fixed key. Look for common letters and short words.",
    railfence: `The letters were written in a zigzag across ${o.rails ?? 3} rows, then read row by row. Spaces were removed first, so add them back.`,
    morse: 'Dots and dashes. Letters are separated by spaces and words by "/".',
    binary: "Each group of 8 bits is one ASCII character.",
    hex: "Each pair of hexadecimal digits is one ASCII character.",
    base64: "This is Base64 text. Decode it to get the original message.",
    a1z26: 'Each number is a letter\'s position in the alphabet (A=1, B=2 ...). Dashes join letters and "/" separates words.',
    polybius: 'Each pair of digits is a row and column in a 5x5 alphabet grid (I and J share a cell). "/" separates words.',
    reverse: "The whole message was written backwards.",
  };
  const w = words(plaintext);
  return {
    hintType: `This message uses the ${meta.label} cipher.`,
    hintMethod: method[type],
    hintPartial: `${w.slice(0, Math.max(1, Math.ceil(w.length / 2))).join(" ")} …`,
  };
}
