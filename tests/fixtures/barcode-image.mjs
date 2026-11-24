// Synthetic EAN-13 image used to exercise the real decoder locally.
import sharp from'sharp';
export async function writeEan13(code,file){
 if(!/^\d{13}$/.test(code))throw Error('EAN-13 fixture needs 13 digits');
 const checksum=(10-[...code.slice(0,12)].reduce((n,d,i)=>n+Number(d)*(i%2?3:1),0)%10)%10;
 if(checksum!==Number(code[12]))throw Error('Invalid EAN-13 fixture check digit');
 const L=['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'],P=['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'],not=s=>s.replace(/[01]/g,x=>x==='1'?'0':'1');
 let bits='101';for(let i=1;i<=6;i++){const x=L[Number(code[i])];bits+=P[Number(code[0])][i-1]==='L'?x:not(x).split('').reverse().join('');}bits+='01010';for(let i=7;i<13;i++)bits+=not(L[Number(code[i])]);bits+='101';
 const bars=[...bits].map((b,i)=>b==='1'?'<rect x="'+(45+i*4)+'" y="30" width="4" height="180" fill="black"/>':'').join('');
 await sharp(Buffer.from('<svg width="470" height="240" xmlns="http://www.w3.org/2000/svg"><rect width="470" height="240" fill="white"/>'+bars+'</svg>')).png().toFile(file);
 return file;
}
