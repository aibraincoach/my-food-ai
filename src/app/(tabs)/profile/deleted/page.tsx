import {getTranslations} from 'next-intl/server';
import {connection} from 'next/server';
import {redirect} from 'next/navigation';
import Link from 'next/link';
import {createClient} from '@/lib/supabase/server';
import {listDeleted} from '@/lib/posts/deleted';
import DeletedPosts from './DeletedPosts';
export default async function DeletedPage(){
 const t=await getTranslations('deleted');
 await connection();const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect('/welcome');
 const posts=await listDeleted(db,user.id);
 return <main className="mx-auto w-full max-w-phone px-inset py-6"><Link href="/profile" className="inline-flex min-h-tap items-center text-detail">{t('back')}</Link><h1 className="text-title">{t('title')}</h1><p className="mb-5 mt-3 text-detail text-muted">{t('description')}</p><DeletedPosts posts={posts}/></main>;
}
