// Edge-safe name shared by middleware and the server-only reader. Incoming
// values are always removed before Auth; only middleware supplies a verified ID.
export const VERIFIED_USER_HEADER = "x-mfa-verified-user";
