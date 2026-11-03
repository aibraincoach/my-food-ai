import {connection} from 'next/server';
import {redirect} from 'next/navigation';
import Link from 'next/link';
import {createClient} from '@/lib/supabase/server';
import {listDeleted} from '@/lib/posts/deleted';
import DeletedPosts from './DeletedPosts';
export default async function DeletedPage(){
 await connection();const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect('/sign-in');
 const posts=await listDeleted(db,user.id);
 return <main className="mx-auto w-full max-w-phone px-inset py-6"><Link href="/profile" className="inline-flex min-h-tap items-center text-detail">‹ Profile</Link><h1 className="text-title">Recently deleted</h1><p className="mb-5 mt-3 text-detail text-muted">Deleted posts are kept for 30 days, then removed for good.</p><DeletedPosts posts={posts}/></main>;
}
