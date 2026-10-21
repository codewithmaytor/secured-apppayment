import http from 'node:http';
import {readFile} from 'node:fs/promises';
const port = Number(process.env.PORT || 4173);
const files = {'/':'index.html','/index.html':'index.html','/app.js':'app.js','/model.js':'model.js','/styles.css':'styles.css'};
const types = {html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8'};
http.createServer(async (req,res)=>{
  const file=files[new URL(req.url,'http://localhost').pathname];
  if(!file){res.writeHead(404);res.end('Not found');return;}
  try {const data=await readFile(new URL(`../dist/${file}`,import.meta.url));res.writeHead(200,{'Content-Type':types[file.split('.').pop()],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);}
  catch {res.writeHead(503);res.end('Run npm run build first.');}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
