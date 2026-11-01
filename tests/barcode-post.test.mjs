// node --import tsx --env-file=.env.local --test tests/barcode-post.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { resolveProduct } from "../src/lib/fdc/barcode-resolver.ts";
import { user as testUser } from "./db/helpers.mjs";
import { signInAsTestUser } from "../scripts/lib/session.mjs";
import { lookupBarcode, productFromFood, barcodeAmounts, barcodeNutrition, amountInBasis, packageAmount } from "../src/lib/fdc/barcode.ts";

const migration = readFileSync(new URL("../supabase/migrations/0020_food_post_photo.sql", import.meta.url), "utf8");
const sql = (text) => {
  const result = spawnSync("psql", ["-X", "-qAt", "--dbname", process.env.SUPABASE_DB_URL], { input: text, encoding: "utf8", timeout: 90000 });
  assert.ifError(result.error); assert.equal(result.status, 0, result.stderr); return result.stdout;
};
const quote = (text) => `'${String(text).replaceAll("'", "''")}'`;

test("barcode portions stay in their declared mass or volume basis, with deduplicated serving and pack choices", () => {
  const food = { fdcId: 7, description: "Oat drink", servingSize: 250, servingSizeUnit: "ml", packageWeight: "1 L", foodNutrients: [{ nutrientId: 1008, value: 61 }] };
  const product = productFromFood(food, "070847811169");
  assert.deepEqual(barcodeAmounts(product), [100, 250, 500, 1000]);
  assert.equal(packageAmount(product), 1000);
  assert.equal(barcodeNutrition(product, 250).calories, 152.5);
  assert.equal(barcodeNutrition(product, 250).source_ref, "7");
  assert.equal(barcodeNutrition(product, 250).portion_unit, "ml");
  assert.equal(amountInBasis(1, "g", "ml"), null);
  assert.equal(amountInBasis(1, "fl oz", "ml"), 29.5735295625);
  assert.equal(amountInBasis(1, "oz", "g"), 28.349523125);
  assert.equal(amountInBasis(Infinity, "ml", "ml"), null);
  assert.equal(packageAmount({ ...product, packageWeight: "six bottles" }), null);
  assert.deepEqual(barcodeAmounts({ ...product, servingSize: null, packageWeight: null }), [100, 200, 250]);
});

test("live GTIN nutrition creates an atomic ready photo post; old RPC calls work and RLS hides every row", { skip: !process.env.SUPABASE_DB_URL || !process.env.FDC_API_KEY }, async () => {
  const product = await lookupBarcode("016000275683");
  assert.ok(product); assert.match(product.name, /corn puffs/i);
  const nutrition = barcodeNutrition(product, 27);
  const result = sql(`\\set ON_ERROR_STOP on
begin;
${migration}
select gen_random_uuid() as owner, gen_random_uuid() as other, gen_random_uuid() as stage \\gset
insert into auth.users(id) values (:'owner'),(:'other');
insert into profiles(id,handle) values (:'owner','bc-'||:'owner'),(:'other','bc-'||:'other');
select :'owner'||'/'||:'stage'||'/0.jpg' as path \\gset
insert into storage.objects(bucket_id,name) values ('media',:'path'),('media',replace(:'path','.jpg','.feed.jpg'));
select public.create_food_post(:'owner',now(),${quote(product.name)},27,${quote(JSON.stringify(nutrition))}::jsonb,jsonb_build_object('path',:'path','width',390,'height',390)) as post \\gset
select (select status='ready' from posts where id=:'post')
 and (select count(*)=0 from jobs where post_id=:'post')
 and (select count(*)=1 from current_post_items where post_id=:'post')
 and (select name=${quote(product.name)} and portion_grams=27 from current_post_items where post_id=:'post')
 and (select abs(n.calories-${nutrition.calories})<0.0001 and n.source_ref=${quote(String(product.fdcId))} from item_nutrition n join post_items i on i.id=n.post_item_id where i.post_id=:'post')
 and (select count(*)=1 from post_media where post_id=:'post' and kind='photo' and position=0 and storage_path=:'path') as photo_ok \\gset
\\if :photo_ok
\\else
select 1/0 as photo_post_failed;
\\endif
-- Volume is a known volume, never a guessed mass; its stored nutrition is still the selected portion.
select public.create_food_post(:'owner',now(),'Oat drink',250,'{"calories":152.5,"portion_unit":"ml"}') as volume \\gset
select portion_text='250 ml' and portion_grams is null as volume_ok from current_post_items where post_id=:'volume' \\gset
\\if :volume_ok
\\else
select 1/0 as volume_recorded_as_mass;
\\endif
-- Existing food-search/drink callers use the original five arguments.
select public.create_food_post(:'owner',now(),'Legacy caller',100,'{}') as legacy \\gset
select count(*)=0 as legacy_ok from post_media where post_id=:'legacy' \\gset
\\if :legacy_ok
\\else
select 1/0 as legacy_failed;
\\endif
select set_config('bc.owner',:'owner',true),set_config('bc.other',:'other',true),set_config('bc.path',:'path',true);
do $check$ begin
  begin perform public.create_food_post(current_setting('bc.owner')::uuid,now(),'Foreign photo',27,'{}',jsonb_build_object('path',current_setting('bc.other')||'/00000000-0000-0000-0000-000000000000/0.jpg','width',390,'height',390)); raise exception 'foreign image accepted'; exception when invalid_parameter_value then null; end;
  begin perform public.create_food_post(current_setting('bc.owner')::uuid,now(),'Missing photo',27,'{}',jsonb_build_object('path',current_setting('bc.owner')||'/00000000-0000-0000-0000-000000000000/0.jpg','width',390,'height',390)); raise exception 'missing image accepted'; exception when invalid_parameter_value then null; end;
  begin perform public.create_food_post(current_setting('bc.owner')::uuid,now(),'Invalid photo',27,'{}',jsonb_build_object('path',current_setting('bc.path'),'width',0,'height',390)); raise exception 'zero width accepted'; exception when invalid_parameter_value then null; end;
end $check$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',:'other','role','authenticated')::text,true);
select (select count(*)=0 from posts where id in (:'post',:'legacy'))
 and (select count(*)=0 from post_items where post_id=:'post')
 and (select count(*)=0 from post_media where post_id=:'post')
 and not has_function_privilege('authenticated','public.create_food_post(uuid,timestamptz,text,numeric,jsonb,jsonb)','execute') as access_ok \\gset
\\if :access_ok
\\else
select 1/0 as cross_owner_access;
\\endif
reset role;
rollback;
\\echo barcode_rpc_and_rls_passed`);
  assert.match(result,/barcode_rpc_and_rls_passed/);
});

// Full HTTP route check waits until its migration is ordered and installed. It uses only a local build,
// the designated test accounts, live FDC, and deletes its created post and uploaded objects in finally.
test("the signed-in food route accepts server-resolved GTIN/photo, rejects supplied nutrition, and hides the post from the second user", { skip: !process.env.SUPABASE_DB_URL || !process.env.FDC_API_KEY }, async (t) => {
  const installed = sql("select exists(select 1 from pg_proc where proname='create_food_post' and pronargs=6);").trim() === "t";
  if (!installed) { t.skip("Migration 0020 is not installed; applying it requires the PR's merge order."); return; }
  const origin = "http://127.0.0.1:3104";
  try { await fetch(`${origin}/signin`, { signal: AbortSignal.timeout(3000) }); }
  catch { t.skip("Start the built item 4 app on port 3104 to run the real HTTP route check."); return; }
  const cookie = await signInAsTestUser(1);
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  const owner = await testUser(1);
  const product = await resolveProduct("016000275683", owner.user.id);
  assert.ok(product,"The owner-resolved barcode product must exist.");
  const expectedNutrition = barcodeNutrition(product,27);
  let postId; let paths = [];
  const send = (path, body) => fetch(`${origin}${path}`, { method: "POST", headers: { "Content-Type": "application/json", cookie }, body: JSON.stringify(body) });
  try {
    const forged = await send("/api/posts/food", { gtin: product.gtin, amount: 27, unit: "g", nutrition: { calories: 1 } });
    assert.equal(forged.status,400);
    const signed = await send("/api/media/sign-upload",{ staged:true }); assert.equal(signed.status,200);
    const upload = (await signed.json()).uploads[0]; paths = [upload.originalPath, upload.feedPath];
    const jpeg = readFileSync(new URL("../eval/photos/01.jpg",import.meta.url));
    for (const url of [upload.originalSignedUrl,upload.feedSignedUrl]) assert.equal((await fetch(url,{ method:"PUT",headers:{"Content-Type":"image/jpeg"},body:jpeg })).ok,true);
    const response = await send("/api/posts/food",{ gtin:product.gtin,amount:27,unit:"g",photo:{path:upload.originalPath,width:390,height:390} });
    const result = await response.json(); assert.equal(response.status,201,JSON.stringify(result)); postId=result.post_id;
    const { data:post } = await admin.from("posts").select("status,user_id").eq("id",postId).single(); assert.equal(post.status,"ready"); assert.equal(post.user_id,owner.user.id);
    const { data:media } = await admin.from("post_media").select("storage_path").eq("post_id",postId).eq("kind","photo").single(); assert.equal(media.storage_path,upload.originalPath);
    const { data:item } = await admin.from("current_post_items").select("id,name,portion_grams").eq("post_id",postId).single(); assert.equal(item.name,product.name); assert.equal(item.portion_grams,27);
    const { data:nutrition } = await admin.from("item_nutrition").select("calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,source_ref").eq("post_item_id",item.id).single(); for(const key of ["calories","protein_g","carbs_g","fat_g","fibre_g","sugar_g","sodium_mg"]){
      if(expectedNutrition[key]==null)assert.equal(nutrition[key],null,key);
      else assert.ok(Math.abs(nutrition[key]-expectedNutrition[key])<0.0001,key);
    }
    assert.equal(nutrition.source_ref,expectedNutrition.source_ref);
    const { count:jobs } = await admin.from("jobs").select("id",{count:"exact",head:true}).eq("post_id",postId); assert.equal(jobs,0);
    const second = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
    const { error:signError } = await second.auth.signInWithPassword({email:process.env.TEST_USER2_EMAIL,password:process.env.TEST_USER2_PASSWORD}); assert.ifError(signError);
    const { data:hidden,error:readError } = await second.from("posts").select("id").eq("id",postId); assert.ifError(readError); assert.deepEqual(hidden,[]);
  } finally {
    if(postId) await admin.from("posts").delete().eq("id",postId);
    if(paths.length) await admin.storage.from("media").remove(paths);
    await owner.client.auth.signOut({scope:"local"});
  }
});

// Route refuses a different user's server-held label reading before attaching any media.
test("a label reading belonging to a second user cannot become the signed-in user's post",{skip:!process.env.SUPABASE_DB_URL},async(t)=>{
 const installed=sql("select to_regclass('public.label_readings') is not null;").trim()==='t';
 if(!installed){t.skip('Migration 0025 awaits its merge order.');return;}
 const origin='http://127.0.0.1:3104';try{await fetch(origin+'/api/health');}catch{t.skip('Local built application is not running.');return;}
 const cookie=await signInAsTestUser();
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const other=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:auth,error:authError}=await other.auth.signInWithPassword({email:process.env.TEST_USER2_EMAIL,password:process.env.TEST_USER2_PASSWORD});assert.ifError(authError);
 const {data:reading,error}=await admin.from('label_readings').insert({user_id:auth.user.id,photo_path:auth.user.id+'/fixture/0.jpg',reading:{is_label:true}}).select('id').single();assert.ifError(error);
 try{
  const response=await fetch(origin+'/api/posts/food',{method:'POST',headers:{'Content-Type':'application/json',cookie},body:JSON.stringify({label_reading_id:reading.id,servings:2,name:'Packaged food'})});assert.equal(response.status,404);
 }finally{await admin.from('label_readings').delete().eq('id',reading.id);}
});
