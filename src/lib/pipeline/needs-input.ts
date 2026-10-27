export type NeedsInput = {question:string;short:"Clarification needed"|"No food found";options:string[]};
export function readNeedsInput(value:unknown):NeedsInput|null {
  if(value===null||value===undefined)return null;
  if(typeof value!=="object")throw new Error("Invalid clarification.");
  const v=value as NeedsInput;
  if(typeof v.question!=="string"||!v.question.trim()||v.question.length>1000||!["Clarification needed","No food found"].includes(v.short)||!Array.isArray(v.options)||v.options.length>3||!v.options.every(option=>typeof option==="string"&&option.length>0&&option.length<=200))throw new Error("Invalid clarification.");
  return {question:v.question,short:v.short,options:v.options};
}
