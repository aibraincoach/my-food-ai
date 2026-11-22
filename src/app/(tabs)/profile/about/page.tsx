import {getTranslations} from 'next-intl/server';
import {connection} from 'next/server';
import {redirect} from 'next/navigation';
import Link from 'next/link';
import {createClient} from '@/lib/supabase/server';
import {verifiedUserId} from '@/lib/auth/verified-user';
import {ProfileGrid} from '@/components/ProfileGrid';
import {getProfileGrid} from '@/lib/posts/grid';
// A judge's page: what the app does, which models run, and where the judge's
// own meals are. It names no other account's data; every read in the app runs
// under row-level security, so an account sees its own meals only.
export default async function AboutPage(){
 const t=await getTranslations('about');
 const MODELS=[
 {name:'SAM 3.1',id:'sam-3.1',job:t('samJob')},
 {name:'Muse Spark 1.3',id:'muse-spark-1.3',job:t('sparkJob')},
 {name:'Muse Voice Transcribe 1.0',id:'muse-voice-transcribe-1.0',job:t('voiceJob')},
 {name:'Muse Spark Open (Meta open weights on Baseten)',id:'meta-models/muse-spark-open-1026',job:t('openJob')},
];

 await connection();const db=await createClient();const verified=await verifiedUserId();const user=verified?{id:verified}:(await db.auth.getUser()).data.user;if(!user)redirect('/welcome');
 const posts=await getProfileGrid(db,user.id);
 return <main className="mx-auto w-full max-w-phone px-inset py-6 text-text">
  <Link href="/profile" className="inline-flex min-h-tap items-center text-detail">{t('back')}</Link>
  <h1 className="text-title">{t('title')}</h1>
  <p className="mt-3 text-detail text-muted">{t('description')}</p>
  <h2 className="mt-6 text-sheet-title">{t('photoTitle')}</h2>
  <ol className="mt-2 list-decimal space-y-2 pl-5 text-detail">
   <li>{t('upload')}</li>
   <li>{t('outline')}</li>
   <li>{t('name')}</li>
   <li>{t('source')}</li>
   <li>{t('correction')}</li>
   <li>{t('leftovers')}</li>
  </ol>
  <h2 className="mt-6 text-sheet-title">{t('modelsTitle')}</h2>
  <ul className="mt-2 space-y-3 text-detail">{MODELS.map(model=><li key={model.id}><span className="font-semibold">{model.name}</span> <span className="text-muted">({model.id})</span><br/>{model.job}</li>)}</ul>
  <p className="mt-3 text-detail text-muted">{t('modelNote')}</p>
  <h2 className="mt-6 text-sheet-title">{t('dataTitle')}</h2>
  <p className="mt-2 text-detail">{t('dataDescription')}</p>
  <h2 className="mt-6 text-sheet-title">{t('mealsTitle')}</h2>
  {posts.length?<ProfileGrid posts={posts}/>:<p className="mt-2 text-detail text-muted">{t('empty')}</p>}
  <div className="mt-6 flex flex-col gap-2"><Link href="/" className="flex min-h-tap items-center text-body font-semibold">{t('photoLink')}</Link></div>
 </main>;
}
