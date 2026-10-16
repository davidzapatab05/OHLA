import { NextRequest, NextResponse } from 'next/server';
import { renameItem } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { oldPath, newName, isFolder = false } = body;

    if (!oldPath || !newName || !newName.trim()) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos para renombrar' }, { status: 400 });
    }

    const ok = await renameItem(oldPath, newName.trim(), isFolder);
    if (!ok) {
      return NextResponse.json({ error: 'No se pudo renombrar el elemento' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Elemento renombrado exitosamente' });
  } catch (error) {
    console.error('Error renaming item:', error);
    return NextResponse.json({ error: 'Error procesando solicitud de renombrado' }, { status: 500 });
  }
}
