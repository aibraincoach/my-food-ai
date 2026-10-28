// node scripts/backlog.mjs
// Regenerates BACKLOG.md from the open GitHub issues. Never edit BACKLOG.md by hand.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

// The repository is explicit, so the issues read always belong to the file written below.
const REPO = "aibraincoach/my-food-ai";
const issues = JSON.parse(execFileSync("gh", ["issue", "list", "--repo", REPO, "--state", "open", "--limit", "500", "--json", "number,title,labels,body"], { encoding: "utf8" }));
// Reviewer findings that were waived or deferred carry "tracked-finding"; they are never listed here.
const listed = issues.filter(({ labels }) => !labels.some((label) => label.name === "tracked-finding"));
listed.sort((a, b) => a.number - b.number);

// An issue labelled "blocked" is marked inline; its reason is the body's "Blocked: ..." line.
const line = ({ number, title, labels, body }) => {
  if (!labels.some((label) => label.name === "blocked")) return `- #${number} ${title}`;
  const reason = /^Blocked:\s*(.+)$/m.exec(body ?? "")?.[1].trim().replace(/\.$/, "");
  return `- #${number} ${title} (blocked: ${reason ?? "see the issue"})`;
};

const text = [
  "# My Food AI — Backlog†",
  "",
  ...listed.map(line),
  "",
  "† One GitHub issue per item, with a title that states the done condition; an issue is closed by its pull request. This file is regenerated from the open issues by `node scripts/backlog.mjs` and is never edited by hand.",
  "",
].join("\n");

writeFileSync(new URL("../BACKLOG.md", import.meta.url), text);
console.log(`BACKLOG.md written with ${listed.length} open issues (${issues.length - listed.length} tracked findings left out).`);
