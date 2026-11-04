import PostDetail from '@/components/PostDetail';
import PostOpenFrame from '@/components/PostOpenFrame';
import PostPageShell from '@/components/PostPageShell';
import {Suspense} from 'react';
import NavigationControls from '@/components/NavigationControls';
export const instant=false;
export default async function PostPage({params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 return <PostPageShell><Suspense key={id} fallback={<PostOpenFrame id={id}/>}><PostDetail id={id}/></Suspense><NavigationControls/></PostPageShell>;
}
