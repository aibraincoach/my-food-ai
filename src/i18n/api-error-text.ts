"use client";
import {useCallback} from 'react';
import {useTranslations} from 'next-intl';
import {failureFromResponse} from '@/lib/posts/capture-failure';
import {failureNamespace} from './failure-code';
import type {ApiMessageCode} from './api-codes';

export function useApiFailureText(){
 const t=useTranslations('api');
 return useCallback((body:unknown,missingCode:ApiMessageCode)=>{
  const failure=failureFromResponse(body,missingCode);
  if(failureNamespace(failure.code)!=='api')throw new Error('Unexpected local capture message code');
  return t(failure.code as ApiMessageCode,failure.values);
 },[t]);
}
