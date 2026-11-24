// Wording snapshots only: acknowledge subscriptions/heartbeats without data.
// The disposable stack has no Realtime server. Never use for event correctness.
export async function readingRealtime(context,{fail=false}={}){
 const receipt={fixture:'subscription-ack-only',joins:0,acknowledgedJoins:0,heartbeats:0,dataEvents:0,connections:0,unhandled:[],fail};
 await context.routeWebSocket(/\/realtime\/v1\/websocket/,socket=>{
  receipt.connections++;socket.onMessage(raw=>{
   const decoded=JSON.parse(String(raw)),array=Array.isArray(decoded);
   const message=array?{join_ref:decoded[0],ref:decoded[1],topic:decoded[2],event:decoded[3],payload:decoded[4]}:decoded;
   if(!['phx_join','heartbeat'].includes(message.event)){if(!receipt.unhandled.includes(message.event??'unknown'))receipt.unhandled.push(message.event??'unknown');return;}
   if(message.event==='phx_join'){receipt.joins++;if(!fail)receipt.acknowledgedJoins++;}else receipt.heartbeats++;
   const response=message.event==='phx_join'?{postgres_changes:(message.payload.config?.postgres_changes??[]).map((filter,index)=>({...filter,id:index+1}))}:{};
   const payload={status:fail?'error':'ok',response:fail?{reason:'synthetic transport fault'}:response};
   socket.send(JSON.stringify(array?[message.join_ref,message.ref,message.topic,'phx_reply',payload]:{topic:message.topic,event:'phx_reply',ref:message.ref,join_ref:message.join_ref,payload}));
  });
 });
 return receipt;
}
