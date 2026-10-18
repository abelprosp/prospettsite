import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');
http.createServer((req,res)=>{let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);return res.end('Bad request')}const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden')}fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);return res.end('Not found')}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain'})[path.extname(file)]||'application/octet-stream');res.end(data)})}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
