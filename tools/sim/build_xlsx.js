// Build a valid .xlsx (ZIP container) from tools/sim/_xlsxbuild/** using only Node
// built-ins (zlib). Entry names use forward slashes so Excel/OOXML readers accept it.
//   node tools/sim/build_xlsx.js
const fs=require('fs'), path=require('path'), zlib=require('zlib');
const BUILD=path.join(__dirname,'_xlsxbuild');
const OUT=path.join(__dirname,'..','..','design','gdd','xp-pacing-6month-2026-06-08.xlsx');

// CRC32
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(buf){let c=0xFFFFFFFF;for(let i=0;i<buf.length;i++)c=CRC[(c^buf[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}

function walk(dir,base){let out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const fp=path.join(dir,e.name);const rel=(base?base+'/':'')+e.name;if(e.isDirectory())out=out.concat(walk(fp,rel));else out.push({name:rel.replace(/\\/g,'/'),data:fs.readFileSync(fp)});}return out;}
const files=walk(BUILD,'');

const locals=[];const central=[];let offset=0;
for(const f of files){
  const nameBuf=Buffer.from(f.name,'utf8');
  const comp=zlib.deflateRawSync(f.data,{level:9});
  const crc=crc32(f.data);
  const lh=Buffer.alloc(30);
  lh.writeUInt32LE(0x04034b50,0); lh.writeUInt16LE(20,4); lh.writeUInt16LE(0,6);
  lh.writeUInt16LE(8,8); lh.writeUInt16LE(0,10); lh.writeUInt16LE(0x21,12); // method=deflate, time=0, date=1980-01-01
  lh.writeUInt32LE(crc,14); lh.writeUInt32LE(comp.length,18); lh.writeUInt32LE(f.data.length,22);
  lh.writeUInt16LE(nameBuf.length,26); lh.writeUInt16LE(0,28);
  locals.push(lh,nameBuf,comp);
  const cd=Buffer.alloc(46);
  cd.writeUInt32LE(0x02014b50,0); cd.writeUInt16LE(20,4); cd.writeUInt16LE(20,6); cd.writeUInt16LE(0,8);
  cd.writeUInt16LE(8,10); cd.writeUInt16LE(0,12); cd.writeUInt16LE(0x21,14);
  cd.writeUInt32LE(crc,16); cd.writeUInt32LE(comp.length,20); cd.writeUInt32LE(f.data.length,24);
  cd.writeUInt16LE(nameBuf.length,28); cd.writeUInt16LE(0,30); cd.writeUInt16LE(0,32);
  cd.writeUInt16LE(0,34); cd.writeUInt16LE(0,36); cd.writeUInt32LE(0,38); cd.writeUInt32LE(offset,42);
  central.push(cd,nameBuf);
  offset += lh.length+nameBuf.length+comp.length;
}
const localBuf=Buffer.concat(locals);
const centralBuf=Buffer.concat(central);
const eocd=Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50,0); eocd.writeUInt16LE(0,4); eocd.writeUInt16LE(0,6);
eocd.writeUInt16LE(files.length,8); eocd.writeUInt16LE(files.length,10);
eocd.writeUInt32LE(centralBuf.length,12); eocd.writeUInt32LE(localBuf.length,16); eocd.writeUInt16LE(0,20);
fs.writeFileSync(OUT,Buffer.concat([localBuf,centralBuf,eocd]));
console.log('Wrote '+OUT+' ('+fs.statSync(OUT).size+' bytes, '+files.length+' parts)');
