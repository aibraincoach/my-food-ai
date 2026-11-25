import {restoreUploadDraft} from '../../src/lib/posts/upload-store.ts';
// A current reference whose record was lost: no older shape is read or converted.
export function missingPhotoUpload(row) {
 return restoreUploadDraft({...row,photoRevision:'current-fixture',snapshot:null,files:[{key:row.operationId+':0:selected',name:'meal.jpg',type:'image/jpeg',lastModified:1,size:5}]},new Map());
}
