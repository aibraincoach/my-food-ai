// Installed only by the disposable integration runner (including its local app).
// Keep the production client URL and request/parser paths; replace the external
// provider transport with scripted HTTP responses, never real USDA traffic.
const base=process.env.TEST_FDC_FIXTURE_URL;
if(base){
 const local=new URL(base);
 if(process.env.MFA_TEST_DISPOSABLE!=='1'||!['127.0.0.1','localhost','[::1]'].includes(local.hostname))throw Error('Scripted providers require a disposable loopback stack.');
 const fetcher=globalThis.fetch;
 globalThis.fetch=(input,init)=>{
  const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
  if(url.hostname==='api.nal.usda.gov'&&url.pathname.startsWith('/fdc/v1/')){
   const fixture=new URL(local);fixture.pathname=url.pathname;fixture.search=url.search;
   return fetcher(input instanceof Request?new Request(fixture,input):fixture,init);
  }
  return fetcher(input,init);
 };
}
