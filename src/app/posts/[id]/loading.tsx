'use client';
import {useParams} from 'next/navigation';
import PostOpenFrame from '@/components/PostOpenFrame';
import PostPageShell from '@/components/PostPageShell';
// Shown by the router in the tick of the navigation, before the server answers.
export default function Loading() { const {id}=useParams<{id:string}>(); return <PostPageShell><PostOpenFrame id={id}/></PostPageShell>; }
