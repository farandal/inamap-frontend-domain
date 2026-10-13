#!/usr/bin/env node
// INAMAP — frontends públicos por Cloudflare Tunnel.
//
//   node scripts/inamap-tunnel.mjs init     crea los env de modo túnel (desde los .local)
//   node scripts/inamap-tunnel.mjs routes   agrega app/web/system-dev.inamap.space al túnel
//
// Reutiliza el túnel "inamap-dev" del backend (../inamap-backend-docker): ese conector
// (`./inamap.sh tunnel`) es el único que corre cloudflared; aquí solo se agregan rutas
// de ingress y CNAME vía API, y el conector las toma en vivo. Credenciales: el
// .env.tunnel del backend (INAMAP_TUNNEL_ENV lo reemplaza).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const credsFile = path.resolve(root, process.env.INAMAP_TUNNEL_ENV || '../inamap-backend-docker/.env.tunnel');

const API_HOST = 'api-dev.inamap.space';
const WS_HOST = 'ws-dev.inamap.space';
const APPS = {
  app: { host: 'app-dev.inamap.space', port: 5180 },
  web: { host: 'web-dev.inamap.space', port: 5181 },
  system: { host: 'system-dev.inamap.space', port: 5182 },
};

const readEnv = (file) => {
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
};

// Reemplaza claves existentes (conservando el resto del archivo) y agrega las que falten.
const withOverrides = (text, overrides) => {
  const seen = new Set();
  const lines = text.split('\n').map((line) => {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
    if (m && m[1] in overrides) { seen.add(m[1]); return `${m[1]}=${overrides[m[1]]}`; }
    return line;
  });
  const missing = Object.keys(overrides).filter((k) => !seen.has(k)).map((k) => `${k}=${overrides[k]}`);
  return [...lines.filter((l, i) => !(i === lines.length - 1 && l === '')), ...missing, ''].join('\n');
};

const init = () => {
  const shared = {
    VITE_APP_BACKEND_URL: `https://${API_HOST}`,
    VITE_APP_ADMIN_API_URL: `https://${API_HOST}/api`,
    VITE_APP_INAMAP_APP_URL: `https://${APPS.app.host}`,
    VITE_APP_SOCKETS_HOST: WS_HOST,
    VITE_APP_SOCKETS_PORT: '443',
    VITE_APP_SOCKETS_SCHEME: 'https',
  };
  const jobs = [
    ...['web', 'system'].map((k) => ({
      from: `apps/inamap-${k}/.env.inamap-${k}.local`,
      to: `apps/inamap-${k}/.env.inamap-${k}.tunnel`,
      overrides: { ...shared, VITE_APP_FRONTEND_URL: `https://${APPS[k].host}`, VITE_HMR_HOST: APPS[k].host },
    })),
    {
      from: 'apps/inamap-app/.env.local',
      to: 'apps/inamap-app/.env.tunnel',
      overrides: { VITE_API_URL: `https://${API_HOST}/api`, VITE_PUBLIC_HOST: APPS.app.host },
    },
  ];
  for (const { from, to, overrides } of jobs) {
    const src = path.join(root, from);
    const dst = path.join(root, to);
    if (fs.existsSync(dst)) { console.log(`= ${to} ya existe; no se modifica.`); continue; }
    if (!fs.existsSync(src)) { console.error(`✗ Falta ${from} (cree la env local primero; ver README).`); process.exitCode = 1; continue; }
    fs.writeFileSync(dst, withOverrides(fs.readFileSync(src, 'utf8'), overrides), { mode: 0o640 });
    console.log(`+ ${to}`);
  }
};

const cf = async (creds, pathname, init = {}) => {
  const res = await fetch(`https://api.cloudflare.com/client/v4${pathname}`, {
    ...init,
    headers: { Authorization: `Bearer ${creds.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
  });
  const body = await res.json();
  if (!body.success) throw new Error(`${init.method || 'GET'} ${pathname}: ${JSON.stringify(body.errors)}`);
  return body.result;
};

const routes = async () => {
  if (!fs.existsSync(credsFile)) throw new Error(`Falta ${credsFile} (./inamap.sh tunnel:init en inamap-backend-docker).`);
  const creds = readEnv(credsFile);
  for (const k of ['CF_API_TOKEN', 'CF_ACCOUNT_ID', 'CF_ZONE_NAME', 'CF_TUNNEL_NAME']) {
    if (!creds[k]) throw new Error(`${k} vacío en ${credsFile}`);
  }
  const acct = `/accounts/${creds.CF_ACCOUNT_ID}/cfd_tunnel`;

  const tunnels = await cf(creds, `${acct}?name=${encodeURIComponent(creds.CF_TUNNEL_NAME)}&is_deleted=false`);
  if (!tunnels.length) throw new Error(`No existe el túnel "${creds.CF_TUNNEL_NAME}": ejecute ./inamap.sh up --tunnel en el backend.`);
  const tunnelId = tunnels[0].id;

  // Mezcla en el ingress existente (API/WS del backend incluidos); el catch-all queda al final.
  const current = (await cf(creds, `${acct}/${tunnelId}/configurations`)).config || {};
  const wanted = Object.values(APPS).map((a) => ({ hostname: a.host, service: `http://localhost:${a.port}` }));
  const wantedHosts = new Set(wanted.map((w) => w.hostname));
  const ingress = (current.ingress || []).filter((r) => r.hostname && !wantedHosts.has(r.hostname));
  await cf(creds, `${acct}/${tunnelId}/configurations`, {
    method: 'PUT',
    body: JSON.stringify({ config: { ...current, ingress: [...ingress, ...wanted, { service: 'http_status:404' }] } }),
  });
  wanted.forEach((w) => console.log(`ingress  ${w.hostname} → ${w.service}`));

  const zoneId = creds.CF_ZONE_ID || (await cf(creds, `/zones?name=${creds.CF_ZONE_NAME}`))[0]?.id;
  if (!zoneId) throw new Error(`No se encontró la zona ${creds.CF_ZONE_NAME}`);
  const target = `${tunnelId}.cfargotunnel.com`;
  for (const { hostname } of wanted) {
    const existing = (await cf(creds, `/zones/${zoneId}/dns_records?name=${hostname}`))[0];
    const record = { type: 'CNAME', name: hostname, content: target, proxied: true };
    if (!existing) await cf(creds, `/zones/${zoneId}/dns_records`, { method: 'POST', body: JSON.stringify(record) });
    else if (existing.content !== target || !existing.proxied) await cf(creds, `/zones/${zoneId}/dns_records/${existing.id}`, { method: 'PUT', body: JSON.stringify(record) });
    console.log(`dns      ${hostname} → ${target}`);
  }
};

const command = process.argv[2];
try {
  if (command === 'init') init();
  else if (command === 'routes') await routes();
  else { console.log('Uso: node scripts/inamap-tunnel.mjs <init|routes>'); process.exit(command ? 1 : 0); }
} catch (e) {
  console.error(`✗ ${e.message}`);
  process.exit(1);
}
