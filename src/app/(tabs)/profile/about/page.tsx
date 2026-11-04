import {connection} from 'next/server';
import {redirect} from 'next/navigation';
import Link from 'next/link';
import {createClient} from '@/lib/supabase/server';
import {verifiedUserId} from '@/lib/auth/verified-user';
// A judge's page: what the app does, which models run, and where the judge's
// own meals are. It names no other account's data; every read in the app runs
// under row-level security, so an account sees its own meals only.
const MODELS=[
 {name:'SAM 3.1',id:'sam-3.1',job:'Outlines each food in a meal photo.'},
 {name:'Muse Spark 1.3',id:'muse-spark-1.3',job:'Names the foods and their portions, reads nutrition labels, interprets corrections and picks the matching USDA reference.'},
 {name:'Muse Voice Transcribe 1.0',id:'muse-voice-transcribe-1.0',job:'Turns a spoken correction into text for you to confirm.'},
 {name:'Muse Spark Open (Meta open weights on Baseten)',id:'meta-models/muse-spark-open-1026',job:'An optional path for naming foods and portions, switched on under Profile. SAM and transcription stay on the Meta API.'},
];
export default async function AboutPage(){
 await connection();const db=await createClient();const verified=await verifiedUserId();const user=verified?{id:verified}:(await db.auth.getUser()).data.user;if(!user)redirect('/sign-in');
 return <main className="mx-auto w-full max-w-phone px-inset py-6 text-text">
  <Link href="/profile" className="inline-flex min-h-tap items-center text-detail">‹ Profile</Link>
  <h1 className="text-title">How My Food AI works</h1>
  <p className="mt-3 text-detail text-muted">Photograph a meal, write a caption, or say what changed, and see what was consumed. The app records what was eaten. It gives no advice, sets no targets and makes no health claims.</p>
  <h2 className="mt-6 text-sheet-title">What happens to a photo</h2>
  <ol className="mt-2 list-decimal space-y-2 pl-5 text-detail">
   <li>The photo is uploaded and the meal appears in your feed at once, marked as being analysed.</li>
   <li>SAM 3.1 outlines each food in the photo.</li>
   <li>Muse Spark 1.3 names each food and estimates its portion.</li>
   <li>USDA FoodData Central supplies the nutrition for each named food. When no exact record exists, the closest generic USDA record is used and named, and when none is close, Muse Spark estimates typical nutrition and the meal says so.</li>
   <li>The meal shows every food, its portion and the nutrition consumed. Tap a food to correct it, or write or say a correction such as “I ate half the rice”; the earlier version is kept.</li>
   <li>A photo of the leftovers, marked as not eaten, takes the uneaten part out of the record.</li>
  </ol>
  <h2 className="mt-6 text-sheet-title">Models in use</h2>
  <ul className="mt-2 space-y-3 text-detail">{MODELS.map(model=><li key={model.id}><span className="font-semibold">{model.name}</span> <span className="text-muted">({model.id})</span><br/>{model.job}</li>)}</ul>
  <p className="mt-3 text-detail text-muted">Every model call is recorded with the model that answered. USDA FoodData Central and Open Food Facts are databases, not models.</p>
  <h2 className="mt-6 text-sheet-title">Your data</h2>
  <p className="mt-2 text-detail">Your meals, photos, comments and drinks are visible to your account only. Nobody else’s meals appear anywhere in the app.</p>
  <div className="mt-6 flex flex-col gap-2"><Link href="/profile" className="flex min-h-tap items-center text-body font-semibold">Your meals ›</Link><Link href="/" className="flex min-h-tap items-center text-body font-semibold">Photograph a meal ›</Link></div>
 </main>;
}
