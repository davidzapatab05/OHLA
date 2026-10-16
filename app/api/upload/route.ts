import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadFile(folder, file.name, buffer);

    return NextResponse.json({
      message: 'Archivo subido correctamente',
      ...result
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 });
  }
}
