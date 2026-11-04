import PostDetail from '@/components/PostDetail';
import PostOpenFrame from '@/components/PostOpenFrame';
import PostPageShell from '@/components/PostPageShell';
import {Suspense} from 'react';
import NavigationControls from '@/components/NavigationControls';

export default function PostPage({params}:{params:Promise<{id:string}>}) {
 return <Suspense fallback={<PostPageShell><span /></PostPageShell>}><PostPageLoaded params={params}/></Suspense>;
}

async function PostPageLoaded({params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 return <PostPageShell><Suspense fallback={<PostOpenFrame id={id}/>}><PostDetail id={id}/></Suspense><Suspense fallback={null}><NavigationControls/></Suspense></PostPageShell>;
}
