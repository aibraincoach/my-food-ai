import { headers } from "next/headers";
import { VERIFIED_USER_HEADER } from "./verified-user-header";

export { VERIFIED_USER_HEADER } from "./verified-user-header";

export async function verifiedUserId(): Promise<string | null> {
  return (await headers()).get(VERIFIED_USER_HEADER);
}
