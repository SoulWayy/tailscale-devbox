import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export async function loadConfig(root = ROOT) {
  const path = join(root, 'config.yaml');
  if (!existsSync(path)) {
    throw new Error('config.yaml missing — run: npm run init');
  }
  const raw = await readFile(path, 'utf8');
  const config = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([a-z_]+):\s*"?([^"]*)"?$/);
    if (m) config[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return {
    ...config,
    ssh_port: Number(config.ssh_port || 22222),
    primary_fqdn: `${config.primary_host}.${config.tailnet_suffix}`,
    backup_fqdn: config.backup_host ? `${config.backup_host}.${config.tailnet_suffix}` : null,
  };
}

export function parseHostList(value = '') {
  return String(value).split(',').map((s) => s.trim()).filter(Boolean);
}

export function devboxHosts(config, explicit = '') {
  if (explicit) {
    const short = explicit.includes('.') ? explicit.split('.')[0] : explicit;
    return [short];
  }
  const hosts = [
    config.primary_host,
    config.backup_host,
    ...parseHostList(config.extra_hosts),
  ].filter(Boolean);
  return [...new Set(hosts)];
}

export function sshTarget(config, host) {
  const h = host || config.primary_host;
  const short = h.includes('.') ? h.split('.')[0] : h;
  const fqdn = h.includes('.') ? h : `${h}.${config.tailnet_suffix}`;
  const tsSshHosts = new Set(parseHostList(config.tailscale_ssh_hosts));
  return {
    host: short,
    fqdn,
    user: config.ssh_user,
    port: config.ssh_port,
    identity: config.identity_file?.replace(/^~/, process.env.HOME || process.env.USERPROFILE || ''),
    use_tailscale_ssh: tsSshHosts.has(short),
  };
}

export function sshTransport(target, remoteCmd) {
  if (target.use_tailscale_ssh) {
    return {
      bin: 'tailscale',
      args: ['ssh', `${target.user}@${target.host}`, remoteCmd],
    };
  }
  const args = [
    '-o', 'BatchMode=yes',
    '-o', 'ConnectTimeout=15',
    '-p', String(target.port),
  ];
  if (target.identity) args.push('-i', target.identity);
  args.push(`${target.user}@${target.fqdn}`, remoteCmd);
  return { bin: 'ssh', args };
}

/** @deprecated use sshTransport */
export function sshArgs(target, remoteCmd) {
  return sshTransport(target, remoteCmd).args;
}