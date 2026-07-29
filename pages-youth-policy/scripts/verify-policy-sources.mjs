import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.resolve(__dirname, "..", "data", "policies.json");
const payload = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const policies = Array.isArray(payload.policies) ? payload.policies : [];
const sources = Array.isArray(payload.sources) ? payload.sources : [];
const errors = [];

const ids = new Set();
for (const item of policies) {
  if (!item.id || ids.has(String(item.id))) errors.push(`Duplicate or missing policy id: ${item.id || "(empty)"}`);
  ids.add(String(item.id));
  if (!item.title || !item.type || !item.status) errors.push(`Missing required fields: ${item.id}`);
  if (item.sourceKey && !/^https:\/\//.test(item.officialUrl || "")) {
    errors.push(`External policy has no HTTPS official URL: ${item.id}`);
  }
  if (Array.isArray(item.regions) && new Set(item.regions).size !== item.regions.length) {
    errors.push(`Duplicate regions: ${item.id}`);
  }
}

for (const key of ["youthcenter", "myhome", "hug", "manual"]) {
  if (!sources.some((source) => source.key === key)) errors.push(`Missing source metadata: ${key}`);
}

const report = {
  totalPolicies: policies.length,
  sources: sources.map(({ key, count, status }) => ({ key, count, status })),
  externalPolicies: policies.filter((item) => ["myhome", "hug"].includes(item.sourceKey)).length,
  errors
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exit(1);
