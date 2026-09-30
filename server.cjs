const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const base = __dirname;
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.png':'image/png'};
http.createServer((request,response)=>{
  let pathname;
  try { pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname); } catch { response.writeHead(400);response.end();return; }
  const relative=pathname==='/'?'index.html':pathname.slice(1);
  const file=path.resolve(base,relative);
  const allowed=['index.html','styles.css','data.js','map.js','app.js','sw.js','manifest.webmanifest','icon.svg','icons/icon-192.png','icons/icon-512.png'];
  if(!allowed.includes(relative)||!file.startsWith(base+path.sep)){response.writeHead(404);response.end('Not found');return;}
  fs.readFile(file,(error,body)=>{if(error){response.writeHead(404);response.end('Not found');return;}response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});response.end(body);});
}).listen(4173,'127.0.0.1',()=>console.log('다낭 일지: http://localhost:4173'));
