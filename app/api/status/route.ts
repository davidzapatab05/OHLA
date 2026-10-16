import { NextResponse } from 'next/server';
import { getBlobToken } from '@/lib/storage';

export async function GET() {
  const blobKeys = Object.keys(process.env).filter((k) =>
    k.toUpperCase().includes('BLOB')
  );

  return NextResponse.json({
    hasToken: Boolean(getBlobToken()),
    blobKeys,
    hasStandardToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
}
