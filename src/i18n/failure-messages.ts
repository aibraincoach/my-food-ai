"use client";
import {useCallback} from 'react';
import {useTranslations} from 'next-intl';
import type {CaptureMessageCode} from '@/lib/posts/capture-failure';
import {renderFailureMessage} from './failure-code';

export function useFailureMessages(){
 const api=useTranslations('api'),capture=useTranslations('capture');
 return useCallback((code:CaptureMessageCode,values?:Record<string,string|number>)=>renderFailureMessage(code,values,{
  api:(key,vars)=>api(key as Parameters<typeof api>[0],vars),
  capture:(key,vars)=>capture(key as Parameters<typeof capture>[0],vars),
 }),[api,capture]);
}
