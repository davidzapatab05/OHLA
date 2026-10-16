import { NextRequest, NextResponse } from 'next/server';
import { getFilesAndFolders } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || '';
    const data = await getFilesAndFolders(folder);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Error al listar archivos' }, { status: 500 });
  }
}
