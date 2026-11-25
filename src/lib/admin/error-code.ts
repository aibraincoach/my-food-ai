const callKinds=new Set(['sam','spark_identify','spark_correct','spark_same_meal','spark_search','fdc','transcribe','spark_label','spark_remainder']);
/** Project only the recognised service/kind and stored three-digit HTTP status.
 * Actual writer shapes are shared with the SQL tests in admin-error-codes.json.
 * Class names, paths and all other free text never leave this reader. */
export function adminErrorCode(value:string|null,kind:string|null=null):string|null{
 if(value===null)return null;
 if(kind!==null){
  if(!callKinds.has(kind))return null;
  const status=value.match(/\(status ([0-9]{3})\)$/)?.[1];
  return kind+(status?' '+status:'');
 }
 const service=value.match(/^(fdc|meta):/)?.[1];
 if(!service)return null;
 const status=value.match(/\bfailed with ([0-9]{3})\.?$/)?.[1];
 return service+(status?' '+status:'');
}
