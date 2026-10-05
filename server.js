const http = require('http');
const fs = require('fs');
const path = require('path');

const host = '0.0.0.0';
const port = Number(process.env.PORT || 8000);
const root = __dirname;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const requestUrl = req.url || '/';
  const cleanUrl = requestUrl.split('?')[0];
  const targetPath = cleanUrl === '/' ? '/index.html' : cleanUrl;
  const safePath = path.normalize(targetPath).replace(/^([.][.][\\/])+/, '');
  const absolutePath = path.join(root, safePath);

  if (!absolutePath.startsWith(root)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.readFile(absolutePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const extension = path.extname(absolutePath).toLowerCase();
    const contentType = mimeTypes[extension] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    });
    res.end(content);
  });
});

server.listen(port, host, () => {
  console.log(`Expense Tracker is running at http://localhost:${port}`);
  console.log(`LAN access: http://<your-computer-ip>:${port}`);
});
