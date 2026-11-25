// Named marker loader for Node server tests and operator source-loading tools.
// Usage: node --import ./scripts/lib/server-only.mjs --import tsx <server-script>
// Never preload this on Next: its compiler must enforce server-only boundaries.
// Only the marker is substituted; no application dependency or output is mocked.
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,nextResolve){
 if(specifier==='server-only')return {url:new URL('./server-only-empty.cjs',import.meta.url).href,shortCircuit:true};
 return nextResolve(specifier,context);
}});
