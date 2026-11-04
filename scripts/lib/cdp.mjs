// Native Chromium protocol helper; no Playwright, browser profiles or images are copied.
export const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function attachCDP(endpoint='http://127.0.0.1:9245'){
 const targets=await fetch(`${endpoint}/json/list`).then(r=>r.json());const target=targets.find(t=>t.type==='page');if(!target)throw Error('No native Chromium page');
 const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let id=0;const pending=new Map(),events=[];
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method)events.push(m);const p=pending.get(m.id);if(p){pending.delete(m.id);if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));setTimeout(()=>{if(pending.has(key)){pending.delete(key);reject(Error(`${method} timed out`));}},20000).unref();});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
 return {send,evaluate,events,close:()=>ws.close()};
}
