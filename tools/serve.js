// Tiny static server for local testing: correct MIME types, byte ranges for video, SPA fallback for unknown paths.
const http = require('http'), fs = require('fs'), path = require('path');
const root = process.argv[2], port = Number(process.argv[3] || 4330);
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webm': 'video/webm', '.mov': 'video/mp4', '.mp4': 'video/mp4', '.ttf': 'font/ttf', '.txt': 'text/plain' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  let f = path.join(root, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, 'index.html');
  const size = fs.statSync(f).size, type = T[path.extname(f)] || 'application/octet-stream', range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range), start = m[1] ? Number(m[1]) : 0, end = m[2] ? Number(m[2]) : size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': 'bytes ' + start + '-' + end + '/' + size, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    fs.createReadStream(f, { start, end }).pipe(res);
  } else { res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' }); fs.createReadStream(f).pipe(res); }
}).listen(port, () => console.log('serving ' + root + ' on ' + port));
