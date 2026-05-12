import { createServer, type Server } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import path from 'node:path';

// Lightweight static file server scoped to a single project root. Replaces
// the previous "iframe the entire hyperframes preview Studio" shortcut —
// @hyperframes/player needs a plain HTTP URL serving the composition + its
// assets. We listen on 127.0.0.1 only, on an OS-chosen port.

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.srt': 'text/plain; charset=utf-8',
};

export interface ProjectServer {
  readonly url: string;
  readonly port: number;
  readonly root: string;
  close(): Promise<void>;
}

let active: { server: Server; root: string; url: string; port: number } | null = null;

export async function startProjectServer(projectRoot: string): Promise<ProjectServer> {
  if (active) await stopActive();

  const server = createServer((req, res) => {
    try {
      const rawPath = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
      const relative = rawPath === '/' ? 'index.html' : rawPath.replace(/^\/+/, '');
      const absPath = path.resolve(projectRoot, relative);

      // Prevent escape via .. — only serve files under the project root.
      const safeRoot = path.resolve(projectRoot);
      if (!absPath.startsWith(safeRoot + path.sep) && absPath !== safeRoot) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
      }

      const stat = statSync(absPath, { throwIfNoEntry: false });
      if (!stat || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }

      const ext = path.extname(absPath).toLowerCase();
      const contentType = MIME[ext] ?? 'application/octet-stream';
      // Range requests matter for <video>/<audio>; Hyperframes media tags
      // resume gracefully when the server supports them.
      const range = req.headers['range'];
      if (range && /^bytes=/.test(range)) {
        const [startStr, endStr] = range.replace('bytes=', '').split('-');
        const start = Number.parseInt(startStr ?? '0', 10);
        const end = endStr ? Number.parseInt(endStr, 10) : stat.size - 1;
        if (start >= stat.size || end >= stat.size) {
          res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
          res.end();
          return;
        }
        res.writeHead(206, {
          'Content-Type': contentType,
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
        });
        createReadStream(absPath, { start, end }).pipe(res);
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      });
      createReadStream(absPath).pipe(res);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Internal error: ${(err as Error).message}`);
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Project server failed to bind to a port');
  }

  const url = `http://127.0.0.1:${address.port}`;
  active = { server, root: projectRoot, url, port: address.port };
  console.log(`[hfui] project server listening at ${url} (root=${projectRoot})`);

  return {
    url,
    port: address.port,
    root: projectRoot,
    close: stopActive,
  };
}

export async function stopActive(): Promise<void> {
  if (!active) return;
  const { server, url } = active;
  active = null;
  await new Promise<void>((resolve) => {
    server.close(() => {
      console.log(`[hfui] project server stopped (${url})`);
      resolve();
    });
  });
}
