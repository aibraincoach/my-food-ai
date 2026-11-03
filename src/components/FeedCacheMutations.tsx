"use client";
import {useLayoutEffect} from 'react';
import {installFeedCacheMutationListener} from '@/lib/posts/feed-cache-mutations';
import {activeMediaUserId} from '@/lib/posts/media-session';
export default function FeedCacheMutations(){
 useLayoutEffect(()=>installFeedCacheMutationListener(window,activeMediaUserId),[]);
 return null;
}
