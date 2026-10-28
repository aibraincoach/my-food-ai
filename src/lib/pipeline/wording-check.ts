const banned = ["coach", "coaching", "advice", "advise", "recommend", "recommendation", "goal", "target", "plan", "budget", "progress", "left", "remaining", "ring", "streak", "should", "try to", "aim for", "cut back", "next time", "keep it up", "well done", "good job"];
export function checkWording(text: string): { ok: boolean; hits: string[] } {
  const hits = banned.filter((phrase) => new RegExp(`\\b${phrase.replaceAll(" ", "\\s+")}\\b`, "i").test(text));
  return { ok: hits.length === 0, hits };
}
