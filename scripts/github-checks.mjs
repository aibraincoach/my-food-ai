import { execFileSync } from "node:child_process";

/** Collect every check-run page before deciding whether a head has finished building. */
export function fetchGithubCheckRuns(repo, sha, exec = execFileSync) {
  const out = exec("gh", ["api", `repos/${repo}/commits/${sha}/check-runs`, "--paginate", "--slurp"], {
    encoding: "utf8",
    timeout: 20_000,
    maxBuffer: 5 * 1024 * 1024,
  }).trim();
  return out ? JSON.parse(out).flatMap((page) => page.check_runs) : [];
}

/** Combined commit status for a head. Vercel posts context "Vercel" with state success|pending|failure. */
export function fetchGithubCommitStatus(repo, sha, exec = execFileSync) {
  const out = exec("gh", ["api", `repos/${repo}/commits/${sha}/status`], {
    encoding: "utf8",
    timeout: 20_000,
    maxBuffer: 5 * 1024 * 1024,
  }).trim();
  const parsed = out ? JSON.parse(out) : { state: "pending", statuses: [] };
  return {
    state: parsed.state,
    statuses: (parsed.statuses ?? []).map((s) => ({ context: s.context, state: s.state })),
  };
}
