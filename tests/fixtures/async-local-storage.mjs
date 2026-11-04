// Next installs this runtime global before middleware runs. Standalone Node
// tests need the same context when exercising Next's instrumented console.
import {AsyncLocalStorage} from 'node:async_hooks';
globalThis.AsyncLocalStorage ??= AsyncLocalStorage;
