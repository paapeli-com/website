/* SSH keys, made and read in the browser.
 *
 * Nova stopped generating key pairs (API 2.92): a new pair is made here with
 * Web Crypto, only the public half goes to the account, and the private half
 * is handed to its owner as a file once. Nothing private is kept or sent.
 *
 * The private key comes in two files:
 *   OpenSSH   "-----BEGIN OPENSSH PRIVATE KEY-----", for ssh on Linux, macOS
 *             and Windows 10 and later.
 *   PuTTY     a .ppk (version 2, read by every PuTTY since 0.68).
 * Neither has a passphrase; `ssh-keygen -p` or PuTTYgen adds one.
 *
 * A pasted public key is checked the way a server would read it: the text
 * says its type, the base64 decodes, and the type inside agrees with it.
 */

export type KeyAlgorithm = "ed25519" | "rsa" | "ecdsa" | "sk" | "x509";
export type KeyFileFormat = "openssh" | "ppk";

const enc = new TextEncoder();

const u32 = (n: number) => new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);

function concat(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

const sshString = (v: Uint8Array | string) => {
  const b = typeof v === "string" ? enc.encode(v) : v;
  return concat(u32(b.length), b);
};

/** A big-endian unsigned integer as SSH writes it: no leading zeros, and one
    zero byte in front when the top bit is set, so it never reads negative. */
function mpint(b: Uint8Array) {
  let i = 0;
  while (i < b.length - 1 && b[i] === 0) i++;
  const x = b.slice(i);
  return sshString(x[0] & 0x80 ? concat(new Uint8Array([0]), x) : x);
}

function toBase64(b: Uint8Array) {
  let s = "";
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

function fromBase64(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "="));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

const wrap = (s: string, width: number) => s.match(new RegExp(`.{1,${width}}`, "g")) ?? [];

/** "SHA256:…", as `ssh-keygen -l` prints it. */
async function sha256Fingerprint(blob: Uint8Array<ArrayBuffer>) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", blob));
  return `SHA256:${toBase64(digest).replace(/=+$/, "")}`;
}

// ---- Reading a public key ----------------------------------------------------

export interface ParsedKey {
  algorithm: KeyAlgorithm;
  /** RSA's modulus size, ECDSA's curve size. */
  bits?: number;
  /** The key on one line, as it is stored. */
  publicKey: string;
  fingerprint: string;
}

export type ParseProblem = "empty" | "format" | "dsa" | "certificate";

/** Reads `ssh-ed25519 AAAA… comment` from a reader that walks the blob. */
function readBlob(blob: Uint8Array) {
  let at = 0;
  const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  return () => {
    if (at + 4 > blob.length) throw new Error("short");
    const len = view.getUint32(at);
    at += 4;
    if (at + len > blob.length) throw new Error("short");
    const out = blob.subarray(at, at + len);
    at += len;
    return out;
  };
}

export async function parsePublicKey(text: string): Promise<ParsedKey | ParseProblem> {
  const trimmed = text.trim();
  if (!trimmed) return "empty";
  const [type, body, ...rest] = trimmed.split(/\s+/);
  if (type === "ssh-dss") return "dsa";
  if (!/^(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp(256|384|521)|sk-(ssh-ed25519|ecdsa-sha2-nistp256)@openssh\.com)$/.test(type) || !body)
    return "format";
  try {
    const blob = fromBase64(body);
    const next = readBlob(blob);
    if (new TextDecoder().decode(next()) !== type) return "format";
    let algorithm: KeyAlgorithm = "ed25519";
    let bits: number | undefined;
    if (type === "ssh-rsa") {
      algorithm = "rsa";
      next(); // e
      const n = next();
      let i = 0;
      while (i < n.length && n[i] === 0) i++;
      bits = (n.length - i) * 8;
    } else if (type.startsWith("ecdsa")) {
      algorithm = "ecdsa";
      bits = Number(type.slice(-3));
    } else if (type.startsWith("sk-")) {
      algorithm = "sk";
    }
    const comment = rest.join(" ");
    return {
      algorithm,
      bits,
      publicKey: [type, body, comment].filter(Boolean).join(" "),
      fingerprint: await sha256Fingerprint(blob),
    };
  } catch {
    return "format";
  }
}

/** An X.509 certificate, for Windows servers (Nova's "x509" key type). Its
    fingerprint is the SHA-1 of the certificate, as Nova gives it. */
export async function parseCertificate(text: string): Promise<ParsedKey | ParseProblem> {
  const trimmed = text.trim();
  if (!trimmed) return "empty";
  const m = trimmed.match(/^-----BEGIN CERTIFICATE-----([\s\S]+?)-----END CERTIFICATE-----$/);
  if (!m) return "certificate";
  try {
    const der = fromBase64(m[1].replace(/\s+/g, ""));
    if (der[0] !== 0x30) return "certificate";
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-1", der));
    return {
      algorithm: "x509",
      publicKey: trimmed,
      fingerprint: [...digest].map((b) => b.toString(16).padStart(2, "0")).join(":"),
    };
  } catch {
    return "certificate";
  }
}

// ---- Making a key pair -------------------------------------------------------

export interface GeneratedKey extends ParsedKey {
  /** The private key in each file it can be saved as. */
  files: Record<KeyFileFormat, string>;
}

/** The private key as OpenSSH writes it, with no passphrase. */
function opensshPrivate(publicBlob: Uint8Array, keyPart: Uint8Array, comment: string) {
  const check = crypto.getRandomValues(new Uint32Array(1))[0];
  let priv = concat(u32(check), u32(check), keyPart, sshString(comment));
  const pad: number[] = [];
  for (let i = 1; (priv.length + pad.length) % 8 !== 0; i++) pad.push(i);
  priv = concat(priv, new Uint8Array(pad));
  const body = concat(
    enc.encode("openssh-key-v1\0"),
    sshString("none"),
    sshString("none"),
    sshString(""),
    u32(1),
    sshString(publicBlob),
    sshString(priv),
  );
  return `-----BEGIN OPENSSH PRIVATE KEY-----\n${wrap(toBase64(body), 70).join("\n")}\n-----END OPENSSH PRIVATE KEY-----\n`;
}

/** The private key as PuTTYgen saves it, version 2, with no passphrase. */
async function puttyPrivate(type: string, publicBlob: Uint8Array, privateBlob: Uint8Array, comment: string) {
  const macKey = await crypto.subtle.digest("SHA-1", enc.encode("putty-private-key-file-mac-key"));
  const hmac = await crypto.subtle.importKey("raw", macKey, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const macData = concat(sshString(type), sshString("none"), sshString(comment), sshString(publicBlob), sshString(privateBlob));
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", hmac, macData));
  const pub = wrap(toBase64(publicBlob), 64);
  const prv = wrap(toBase64(privateBlob), 64);
  return [
    `PuTTY-User-Key-File-2: ${type}`,
    "Encryption: none",
    `Comment: ${comment}`,
    `Public-Lines: ${pub.length}`,
    ...pub,
    `Private-Lines: ${prv.length}`,
    ...prv,
    `Private-MAC: ${[...mac].map((b) => b.toString(16).padStart(2, "0")).join("")}`,
    "",
  ].join("\r\n");
}

/** Whether this browser can make Ed25519 keys (all current ones can). */
export async function canMakeEd25519() {
  try {
    await crypto.subtle.generateKey({ name: "Ed25519" }, false, ["sign", "verify"]);
    return true;
  } catch {
    return false;
  }
}

export async function generateKeyPair(algorithm: "ed25519" | "rsa", comment: string): Promise<GeneratedKey> {
  if (algorithm === "ed25519") {
    const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
    const pub = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
    /* PKCS#8 for Ed25519 ends with the 32-byte seed. */
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
    const seed = pkcs8.slice(-32);
    const type = "ssh-ed25519";
    const publicBlob = concat(sshString(type), sshString(pub));
    const keyPart = concat(sshString(type), sshString(pub), sshString(concat(seed, pub)));
    return {
      algorithm,
      publicKey: `${type} ${toBase64(publicBlob)} ${comment}`,
      fingerprint: await sha256Fingerprint(publicBlob),
      files: {
        openssh: opensshPrivate(publicBlob, keyPart, comment),
        ppk: await puttyPrivate(type, publicBlob, sshString(seed), comment),
      },
    };
  }

  const pair = (await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const [n, e, d, p, q, qi] = [jwk.n, jwk.e, jwk.d, jwk.p, jwk.q, jwk.qi].map((v) => fromBase64(v ?? ""));
  const type = "ssh-rsa";
  const publicBlob = concat(sshString(type), mpint(e), mpint(n));
  const keyPart = concat(sshString(type), mpint(n), mpint(e), mpint(d), mpint(qi), mpint(p), mpint(q));
  return {
    algorithm,
    bits: 4096,
    publicKey: `${type} ${toBase64(publicBlob)} ${comment}`,
    fingerprint: await sha256Fingerprint(publicBlob),
    files: {
      openssh: opensshPrivate(publicBlob, keyPart, comment),
      ppk: await puttyPrivate(type, publicBlob, concat(mpint(d), mpint(p), mpint(q), mpint(qi)), comment),
    },
  };
}

/** Hands a text to the browser as a file to save. */
export function downloadText(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/octet-stream" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/** "Ed25519", "RSA 4096", "ECDSA 256", "X.509". */
export function algorithmLabel(algorithm: KeyAlgorithm, bits?: number) {
  const name = { ed25519: "Ed25519", rsa: "RSA", ecdsa: "ECDSA", sk: "FIDO2", x509: "X.509" }[algorithm];
  return bits ? `${name} ${bits}` : name;
}
