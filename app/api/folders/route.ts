import { NextRequest, NextResponse } from 'next/server';
import { createFolder, deleteFolder } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, parentFolder = '', folderName, folderPath } = body;

    if (action === 'delete') {
      if (!folderPath) {
        return NextResponse.json({ error: 'Ruta de carpeta no proporcionada' }, { status: 400 });
      }
      const ok = await deleteFolder(folderPath);
      if (!ok) return NextResponse.json({ error: 'No se pudo eliminar la carpeta' }, { status: 500 });
      return NextResponse.json({ message: 'Carpeta eliminada correctamente' });
    }

    // Default action: create folder
    if (!folderName || !folderName.trim()) {
      return NextResponse.json({ error: 'El nombre de la carpeta es requerido' }, { status: 400 });
    }

    const ok = await createFolder(parentFolder, folderName);
    if (!ok) return NextResponse.json({ error: 'No se pudo crear la carpeta' }, { status: 500 });

    return NextResponse.json({ message: 'Carpeta creada correctamente' });
  } catch (error) {
    console.error('Error handling folder request:', error);
    return NextResponse.json({ error: 'Error procesando solicitud de carpeta' }, { status: 500 });
  }
}
