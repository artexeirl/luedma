import fs from 'node:fs';
import path from 'node:path';

let cachedFileEnv: Record<string, string> | null = null;

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const equalsIndex = line.indexOf('=');
    if (equalsIndex <= 0) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function readEnvFile(): Record<string, string> {
  if (cachedFileEnv) return cachedFileEnv;

  try {
    const filePath = path.join(process.cwd(), '.env');
    const content = fs.readFileSync(filePath, 'utf8');
    cachedFileEnv = parseEnvFile(content);
  } catch {
    cachedFileEnv = {};
  }

  return cachedFileEnv;
}

export function getServerEnv(name: string): string | undefined {
  const fromProcess = typeof process !== 'undefined' ? process.env?.[name] : undefined;
  if (fromProcess && fromProcess.length > 0) return fromProcess;

  const fromFile = readEnvFile()[name];
  if (fromFile && fromFile.length > 0) return fromFile;

  const fromImportMeta = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.[name];
  if (fromImportMeta && fromImportMeta.length > 0) return fromImportMeta;

  return undefined;
}
