import fs from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';

const STORAGE_DIR = path.join(process.cwd(), 'public', 'storage');

async function syncDirectory(dir, prefix = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      await syncDirectory(fullPath, relativePath);
    } else if (entry.isFile()) {
      const buffer = await fs.readFile(fullPath);
      console.log(`Subiendo a Vercel Blob: ${relativePath}...`);
      const blob = await put(relativePath, buffer, {
        access: 'public',
        addRandomSuffix: false,
      });
      console.log(`✓ Subido: ${blob.url}`);
    }
  }
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('ERROR: No se encontró la variable BLOB_READ_WRITE_TOKEN.');
    console.error('Debes definirla en .env.local o pasarla en la terminal.');
    process.exit(1);
  }

  console.log('Iniciando sincronización de archivos hacia Vercel Blob...');
  await syncDirectory(STORAGE_DIR);
  console.log('¡Sincronización completada con éxito!');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
