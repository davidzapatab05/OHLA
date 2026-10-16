import { NextRequest, NextResponse } from 'next/server';
import { deleteFile } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, url } = body;

    const target = url || path;
    if (!target) {
      return NextResponse.json({ error: 'Ruta o URL no especificada' }, { status: 400 });
    }

    const success = await deleteFile(target);
    if (!success) {
      return NextResponse.json({ error: 'No se pudo eliminar el archivo' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Archivo eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Error al eliminar el archivo' }, { status: 500 });
  }
}
