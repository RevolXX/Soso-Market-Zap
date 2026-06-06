import crypto from "node:crypto";

let counter = 0;

export function createId(): string {
  counter += 1;
  const ts = Date.now().toString(36);
  const rand = crypto.randomBytes(4).toString("hex");
  return `sig_${ts}_${rand}_${counter}`;
}
