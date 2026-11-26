/** Identity text comes only from the record that supplied the stored numbers. */
export function recordMetadata(sourceRef:unknown,description:unknown,dataType:unknown):{recordDescription:string|null;recordDataType:string|null}{
 if(typeof sourceRef!=='string'||!/^\d+$/.test(sourceRef)||typeof description!=='string'||!description.trim()
  ||description.trim().length>500||typeof dataType!=='string'||!dataType.trim()||dataType.length>80)
  return {recordDescription:null,recordDataType:null};
 return {recordDescription:description,recordDataType:dataType};
}
/** Copies retain their stored pair; no lookup or reconstruction supplies missing text. */
export function storedRecordMetadata(row:{source_ref?:unknown;record_description?:unknown;record_data_type?:unknown}){
 const pair=recordMetadata(row.source_ref,row.record_description,row.record_data_type);
 return {record_description:pair.recordDescription,record_data_type:pair.recordDataType};
}
