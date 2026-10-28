import assert from 'node:assert/strict';

// Only freshly created test-post roots may be traversed. Collect every page
// before deleting, including obsolete immutable card versions and orphan masks.
export async function listFixtureObjects(bucket, root) {
 const uuid='[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
 assert.match(root,new RegExp(`^${uuid}/${uuid}$`,'i'));
 const paths=[];const directories=[root];
 while(directories.length){
  const prefix=directories.pop();
  for(let offset=0;;offset+=1000){
   const {data,error}=await bucket.list(prefix,{limit:1000,offset,sortBy:{column:'name',order:'asc'}});
   assert.equal(error,null,'Fixture storage listing failed');
   for(const entry of data??[]){
    assert.ok(entry.name&&!entry.name.includes('/')&&entry.name!=='.'&&entry.name!=='..','Invalid storage entry name');
    const path=`${prefix}/${entry.name}`;
    if(entry.id)paths.push(path);else directories.push(path);
   }
   if((data?.length??0)<1000)break;
  }
 }
 return paths;
}
