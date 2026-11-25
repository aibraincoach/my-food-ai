import type {FdcFood} from '../fdc/client';
import type {MextRecord} from './record';
import {mextCandidateEligible} from './gate';

const gated:unique symbol=Symbol('MEXT compatibility gate');
export type MextFood=MextRecord & {nameEn:string;readonly [gated]:true;approximation?:{kind:'closest';basis:string}};
export type NutritionReference={source:'usda';food:FdcFood}|{source:'mext';food:MextFood};
export type SourceContext={kind:'usda-only'}|{kind:'localized';locale:'ja';displayName:string};
export type MextDecision={foodNumber:string|null;closest:boolean;reason:string};
export type MextStep={code:'mext_none'|'mext_incompatible'|'mext_unclassified';candidateNumbers:string[]};
export type MextMatch={food:MextFood|null;step:MextStep|null};
export type MextMatchDependencies={
  search:(japaneseName:string,englishName:string)=>Promise<MextRecord[]>;
  choose:(name:string,caption:string,candidates:MextRecord[])=>Promise<MextDecision>;
};

// This is the only constructor of a matchable MEXT reference. Search and model
// I/O are supplied by the server resolver; tests supply local scripted choices.
export async function matchMext(name:string,caption:string,context:SourceContext,dependencies:MextMatchDependencies):Promise<MextMatch> {
  if(context.kind==='usda-only')return {food:null,step:null};
  if(!/[A-Za-z]/.test(name)||/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(name))
    return {food:null,step:{code:'mext_unclassified',candidateNumbers:[]}};
  const found=await dependencies.search(context.displayName,name);
  const candidates=found.filter(food=>mextCandidateEligible(name,caption,food));
  const candidateNumbers=found.map(food=>food.foodNumber);
  if(!candidates.length)return {food:null,step:{code:found.length?'mext_incompatible':'mext_none',candidateNumbers}};
  const choice=await dependencies.choose(name,caption,candidates);
  if(choice.foodNumber===null)return {food:null,step:{code:'mext_incompatible',candidateNumbers}};
  const selected=candidates.find(food=>food.foodNumber===choice.foodNumber);
  if(!selected?.nameEn)throw new Error('MEXT choice selected an ineligible reference.');
  return {food:{...selected,nameEn:selected.nameEn,[gated]:true,...(choice.closest?{approximation:{kind:'closest',basis:selected.nameEn}}:{})},step:null};
}
