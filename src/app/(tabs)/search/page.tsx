import SearchBox from "@/components/SearchBox";
import DesktopWorkspace from "@/components/DesktopWorkspace";
import PostDetail from "@/components/PostDetail";
export default async function SearchPage({searchParams}:{searchParams:Promise<{post?:string}>}){const {post}=await searchParams;return <DesktopWorkspace width={640} detail={post?<PostDetail id={post}/>:undefined}><main><h1 className="sr-only">Search</h1><SearchBox/></main></DesktopWorkspace>;}
