import { spawn } from 'node:child_process';
import { sshArgs } from './config.mjs';

export function runSsh(target, remoteCmd) {
  return new Promise((resolve, reject) => {
    const args = sshArgs(target, remoteCmd);
    const child = spawn('ssh', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('close', (code) => {
      resolve({ code: code ?? 1, stdout: stdout.trim(), stderr: stderr.trim() });
    });
    child.on('error', reject);
  });
}

export function runSshScript(target, localScriptPath) {
  return new Promise((resolve, reject) => {
    const args = sshArgs(target, 'bash -s');
    const child = spawn('ssh', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    import('node:fs/promises').then(({ readFile }) =>
      readFile(localScriptPath, 'utf8').then((script) => {
        child.stdin.write(script);
        child.stdin.end();
      }),
    ).catch(reject);
    child.on('close', (code) => {
      resolve({ code: code ?? 1, stdout: stdout.trim(), stderr: stderr.trim() });
    });
    child.on('error', reject);
  });
}