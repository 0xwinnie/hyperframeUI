import { spawn, type ChildProcess } from 'node:child_process';
import { HYPERFRAMES_VERSION } from './index.js';

export class PreviewSpawnError extends Error {
  override readonly name = 'PreviewSpawnError';
}

export interface PreviewHandle {
  readonly url: string;
  readonly projectPath: string;
  /**
   * Send SIGTERM to the spawned npx process. The underlying Hyperframes
   * preview server may or may not stop — Hyperframes can daemonize and
   * survive its launcher, so this is best-effort.
   */
  kill(): void;
}

export interface StartPreviewOptions {
  projectPath: string;
  /** Hyperframes version to pin via `npx hyperframes@<version>`. */
  version?: string;
  /** Pass `--force-new` to bypass the CLI's reuse-existing-server behaviour. */
  forceNew?: boolean;
  /** Hard timeout for waiting on the URL line. */
  timeoutMs?: number;
  /** Optional logger to receive raw stdout/stderr chunks during boot. */
  onLog?: (line: string) => void;
}

// The CLI prints e.g. `  Studio    http://localhost:3002`.
const URL_PATTERN = /(https?:\/\/(?:localhost|127\.0\.0\.1):\d+)/;

export function startPreview(opts: StartPreviewOptions): Promise<PreviewHandle> {
  const {
    projectPath,
    version = HYPERFRAMES_VERSION,
    forceNew = false,
    timeoutMs = 30_000,
    onLog,
  } = opts;

  const args = ['--yes', `hyperframes@${version}`, 'preview'];
  if (forceNew) args.push('--force-new');

  return new Promise<PreviewHandle>((resolve, reject) => {
    let child: ChildProcess;
    try {
      child = spawn('npx', args, {
        cwd: projectPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '0' },
      });
    } catch (err) {
      reject(new PreviewSpawnError(`spawn failed: ${(err as Error).message}`));
      return;
    }

    let resolved = false;
    let collected = '';

    const timer = setTimeout(() => {
      if (resolved) return;
      child.kill('SIGTERM');
      reject(
        new PreviewSpawnError(
          `Timed out after ${timeoutMs}ms waiting for Hyperframes preview URL.\n` +
            `Output so far:\n${collected.slice(-512)}`,
        ),
      );
    }, timeoutMs);

    const consume = (chunk: string): void => {
      collected += chunk;
      onLog?.(chunk);
      if (resolved) return;
      const match = collected.match(URL_PATTERN);
      if (!match || match[1] === undefined) return;
      resolved = true;
      clearTimeout(timer);
      resolve({
        url: match[1],
        projectPath,
        kill: () => {
          if (!child.killed) child.kill('SIGTERM');
        },
      });
    };

    child.stdout?.on('data', (b: Buffer) => consume(b.toString('utf8')));
    child.stderr?.on('data', (b: Buffer) => consume(b.toString('utf8')));

    child.on('error', (err) => {
      if (resolved) return;
      clearTimeout(timer);
      reject(new PreviewSpawnError(`process error: ${err.message}`));
    });

    child.on('exit', (code, signal) => {
      if (resolved) return;
      clearTimeout(timer);
      reject(
        new PreviewSpawnError(
          `Hyperframes preview exited (code=${code ?? 'null'}, signal=${signal ?? 'null'}) ` +
            `before printing a URL.\nOutput:\n${collected.slice(-512)}`,
        ),
      );
    });
  });
}
