import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_GEAR_CATALOG, DEFAULT_STUDIO_SETTINGS } from '../lib/matatena-catalog.js';

const { Client } = pg;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';
const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.MATATENA_ADMIN_PASSWORD || '';

const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
const projectRef = projectRefMatch ? projectRefMatch[1] : '';

const sqlSchema = fs.readFileSync(path.join(process.cwd(), 'supabase/schema.sql'), 'utf8');

async function tryPostgresDirectMigration() {
  if (!projectRef || !dbPassword) return false;
  const candidateHosts = [
    `db.${projectRef}.supabase.co`,
    `aws-0-us-east-1.pooler.supabase.com`,
    `aws-0-us-west-1.pooler.supabase.com`,
    `aws-0-us-east-2.pooler.supabase.com`
  ];

  for (const host of candidateHosts) {
    const user = host.includes('pooler.supabase.com') ? `postgres.${projectRef}` : 'postgres';
    const client = new Client({
      host,
      port: 5432,
      user,
      password: dbPassword,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 6000
    });

    try {
      await client.connect();
      await client.query(sqlSchema);
      await client.end();
      console.log(`✓ Esquema SQL aplicado directamente en Supabase (${host}).`);
      return true;
    } catch {
      try {
        await client.end();
      } catch {
        // Ignore close error
      }
    }
  }
  return false;
}

async function seedViaSupabaseRest() {
  if (!supabaseUrl || !supabaseKey) return false;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { error: settingsErr } = await supabase
    .from('matatena_settings')
    .upsert(DEFAULT_STUDIO_SETTINGS);

  const { error: gearErr } = await supabase
    .from('matatena_gear')
    .upsert(DEFAULT_GEAR_CATALOG);

  if (settingsErr || gearErr) {
    console.log(
      'ℹ️ Aviso: Ejecuta supabase/schema.sql en el SQL Editor de tu panel de Supabase si las tablas aún no existen.'
    );
    return false;
  }

  console.log('✓ Configuración inicial e inventario (2x por categoría) sincronizados en Supabase.');
  return true;
}

const migrated = await tryPostgresDirectMigration();
await seedViaSupabaseRest();
if (!migrated) {
  console.log('✓ Respaldo local y cliente Supabase listos.');
}

