import {CachedFeedFallback} from "@/components/Feed";
import ShellRefresh from "@/components/ShellRefresh";
export default function Shell() {
  return <main className="mx-auto max-w-phone" data-shell><CachedFeedFallback /><ShellRefresh /></main>;
}
