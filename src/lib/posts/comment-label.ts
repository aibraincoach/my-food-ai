// Translate the legacy model heading once. Ordinary prose and an already
// normalized heading must survive repeated rendering without another prefix.
export function formatModelCommentLabels(body: string): string {
  return body.replace(/(^|\n)([\t ]*)(?:leftovers[\t ]*·[\t ]*)?not eaten:/gi, '$1$2Leftovers:');
}
