import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs/promises';import React from'react';import{ImageResponse}from'next/og.js';import{createHash}from'node:crypto';import{ResultsCard}from'../src/components/ResultsCard.tsx';
const fixtures=JSON.parse(await fs.readFile(new URL('./fixtures/english-card-png.json',import.meta.url),'utf8'));
const fonts=await Promise.all([300,400,500,600].map(async weight=>({name:'Manrope',data:await fs.readFile(new URL('../src/assets/fonts/Manrope-'+weight+'.ttf',import.meta.url)),weight,style:'normal'})));
for(const row of fixtures.cases)test('stored en PNG remains byte-identical: '+row.name,async()=>{
 const image=new ImageResponse(React.createElement(ResultsCard,{locale:'en',data:row.data,size:1080,fontFamily:'Manrope'}),{width:1080,height:1080,fonts});
 const bytes=Buffer.from(await image.arrayBuffer());assert.equal(bytes.length,row.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256);
});
