'use client';
import {useEffect,useState} from 'react';
import {uploadManager,type UploadState} from '@/lib/posts/upload-manager';
export function useUploads(){const [uploads,setUploads]=useState<UploadState[]>([]);useEffect(()=>{const update=()=>setUploads(uploadManager.list());update();return uploadManager.subscribe(update);},[]);return uploads;}
