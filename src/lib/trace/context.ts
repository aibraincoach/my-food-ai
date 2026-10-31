import { AsyncLocalStorage } from "node:async_hooks";

export const traceContext = new AsyncLocalStorage<{ postId: string | null; deadlineAt?: number }>();
