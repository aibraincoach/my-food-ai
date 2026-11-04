import {Suspense} from 'react';
import PostOpenFrame from '@/components/PostOpenFrame';
import SearchBox from "@/components/SearchBox";
import DesktopWorkspace from "@/components/DesktopWorkspace";
import PostDetail from "@/components/PostDetail";
export default async function SearchPage({searchParams}:{searchParams:Promise<{post?:string}>}){const {post}=await searchParams;return <DesktopWorkspace width={720} detail={post?<Suspense key={post} fallback={<PostOpenFrame id={post} desktopModal/>}><PostDetail id={post} desktopModal/></Suspense>:undefined}><main><h1 className="sr-only">Search</h1><SearchBox/></main></DesktopWorkspace>;}
