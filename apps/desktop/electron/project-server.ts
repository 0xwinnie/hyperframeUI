import { createServer, type Server } from 'node:http';
import { createReadStream, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

// The Hyperframes runtime — auto-injected by @hyperframes/player into
// same-origin iframes. When the player's iframe is cross-origin to the
// renderer (our case: 127.0.0.1:<server> vs localhost:5173) the player
// cannot reach in to inject this script, so we inject it server-side at
// the source. Once loaded, the runtime postMessages the timeline state
// out of the iframe so the player can drive play/pause/seek.
const RUNTIME_SCRIPT_TAG =
  '<script src="https://cdn.jsdelivr.net/npm/@hyperframes/core/dist/hyperframe.runtime.iife.js"></script>';

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

      // For composition HTML files, inject the Hyperframes runtime so the
      // cross-origin player can talk to the iframe via postMessage.
      if (ext === '.html' || ext === '.htm') {
        const raw = readFileSync(absPath, 'utf8');
        const injected = injectHyperframesRuntime(raw);
        const buf = Buffer.from(injected, 'utf8');
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': buf.length,
          'Cache-Control': 'no-cache',
        });
        res.end(buf);
        return;
      }
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

export interface CompositionForEmbed {
  html: string;
  assetBaseUrl: string;
}

/**
 * Read index.html and prepare it for embedding via `<hyperframes-player srcdoc=…>`.
 *
 * Why srcdoc rather than src: @hyperframes/player polls the iframe's
 * contentWindow directly for `__timelines` and friends. That access is
 * silently blocked by the same-origin policy when the iframe loads
 * cross-origin from our renderer (Vite dev on localhost:5173 vs the
 * project server on 127.0.0.1:<port>). srcdoc iframes inherit the parent's
 * origin, so the same poll succeeds.
 *
 * To keep relative asset URLs working inside the srcdoc'd document, we
 * inject a `<base href="${projectServerUrl}/">` in <head>. The runtime
 * script tag is appended before </body> as before.
 *
 * Returns null when the project has no index.html yet (fresh "New project"
 * folder, or one whose composition was deleted). The renderer treats this
 * as a normal onboarding state, not an error.
 */
export function readCompositionForEmbed(): CompositionForEmbed | null {
  if (!active) {
    throw new Error('Project server is not running');
  }
  const indexPath = path.join(active.root, 'index.html');
  let raw: string;
  try {
    raw = readFileSync(indexPath, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
  const withBase = injectBase(raw, `${active.url}/`);
  const withRuntime = injectHyperframesRuntime(withBase);
  return {
    html: withRuntime,
    assetBaseUrl: `${active.url}/`,
  };
}

/** Inject the Hyperframes runtime script just before </body>, or at the end
 *  of the document if no </body> is present. Idempotent — skips injection
 *  if the runtime is already referenced anywhere in the document. */
function injectHyperframesRuntime(html: string): string {
  if (html.includes('hyperframe.runtime')) return html;
  const closingBody = html.lastIndexOf('</body>');
  if (closingBody === -1) return html + '\n' + RUNTIME_SCRIPT_TAG;
  return html.slice(0, closingBody) + RUNTIME_SCRIPT_TAG + html.slice(closingBody);
}

/** Insert a `<base href="${href}">` tag inside <head>, immediately after
 *  the opening tag. Idempotent — skips if a base tag already exists. */
function injectBase(html: string, href: string): string {
  if (/<base\b/i.test(html)) return html;
  return html.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n    <base href="${href}">`);
}
