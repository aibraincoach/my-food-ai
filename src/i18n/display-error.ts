// Only messages already rendered from a dictionary may cross a UI error boundary.
// Ordinary exceptions (network/SDK/developer messages) use the caller's localized fallback.
export class DisplayError extends Error {}
export function displayErrorText(error:unknown,fallback:string):string {
 return error instanceof DisplayError ? error.message : fallback;
}
