type AuthSession = { signOut(options: { scope: "local" }): Promise<{ error: unknown }> };

// End this browser's session only. SDK failures must never be reported as a
// successful sign-out or redirect; the caller shows a recoverable error.
export async function endCurrentSession(auth: AuthSession): Promise<void> {
  const { error } = await auth.signOut({ scope: "local" });
  if (error) throw new Error("The session could not be ended.");
}
