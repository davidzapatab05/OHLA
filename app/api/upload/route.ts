import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    // Also support single 'file' key if used
    const singleFile = formData.get('file') as File | null;
    if (singleFile && files.length === 0) {
      files.push(singleFile);
    }

    const baseFolder = (formData.get('folder') as string) || '';
    const paths = formData.getAll('paths') as string[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    const uploaded = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const customPath = paths[i] || ''; // e.g. "MiCarpeta/sub/archivo.pdf" or empty

      let targetFolder = baseFolder;
      let fileName = file.name;

      if (customPath && customPath.includes('/')) {
        const segments = customPath.split('/');
        fileName = segments.pop() || file.name;
        const relativeFolder = segments.join('/');
        targetFolder = baseFolder ? `${baseFolder}/${relativeFolder}` : relativeFolder;
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const res = await uploadFile(targetFolder, fileName, buffer);
      uploaded.push(res);
    }

    return NextResponse.json({
      message: `${uploaded.length} archivo(s) procesado(s) correctamente`,
      count: uploaded.length,
      uploaded,
    });
  } catch (error) {
    console.error('Error uploading file(s):', error);
    return NextResponse.json({ error: 'Error al subir los archivos' }, { status: 500 });
  }
}
