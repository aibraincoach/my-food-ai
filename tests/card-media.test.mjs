import test from 'node:test';
import assert from 'node:assert/strict';
import {cardMedia,isSheetDrink} from '../src/lib/posts/card-media.ts';
const photo={slides:[{url:'/photo.webp'}]},sheet={source:'sheet'},item={source:'item'};
test('media branch order preserves upload, sheet drink, slides and no-media cards',()=>{
 assert.equal(cardMedia(photo,sheet,{previewUrl:'/upload.jpg'}),'upload');
 assert.equal(cardMedia(photo,sheet),'drink');
 assert.equal(cardMedia({slides:[]},sheet),'drink');
 assert.equal(cardMedia({...photo,kind:'drink',drinkSource:'item'},item),'photo');
 assert.equal(cardMedia(photo,null),'photo');
 assert.equal(cardMedia({slides:[]},null),'none');
 assert.equal(cardMedia({...photo,kind:'drink'},null),'photo','kind alone never took the drink branch without drink data');
 assert.equal(isSheetDrink({...photo,kind:'drink'},null),true);
});
test('undefined drink hydration agrees with the initial hook render without guessing a drink',()=>{
 assert.equal(cardMedia(photo,undefined),'photo');
 assert.equal(cardMedia(photo,sheet),'drink');
});
