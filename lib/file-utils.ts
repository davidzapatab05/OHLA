export type FileCategory =
  | 'pdf'
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'image'
  | 'archive'
  | 'cad'
  | 'code'
  | 'audio'
  | 'video'
  | 'generic';

export function getFileCategory(filename: string): FileCategory {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) return 'word';
  if (['xls', 'xlsx', 'csv', 'ods', 'tsv'].includes(ext)) return 'excel';
  if (['ppt', 'pptx', 'odp'].includes(ext)) return 'powerpoint';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff'].includes(ext)) return 'image';
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return 'archive';
  if (['dwg', 'dxf', 'cad', 'step', 'stp'].includes(ext)) return 'cad';
  if (['txt', 'json', 'xml', 'md', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'sql', 'py', 'sh'].includes(ext)) return 'code';
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) return 'audio';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';

  return 'generic';
}

export function getCategoryBadge(category: FileCategory): {
  bg: string;
  text: string;
  label: string;
} {
  switch (category) {
    case 'pdf':
      return { bg: 'bg-red-50 text-red-600 border-red-200', text: 'text-red-700', label: 'PDF' };
    case 'word':
      return { bg: 'bg-blue-50 text-blue-600 border-blue-200', text: 'text-blue-700', label: 'Word' };
    case 'excel':
      return { bg: 'bg-emerald-50 text-emerald-600 border-emerald-200', text: 'text-emerald-700', label: 'Excel' };
    case 'powerpoint':
      return { bg: 'bg-orange-50 text-orange-600 border-orange-200', text: 'text-orange-700', label: 'PowerPoint' };
    case 'image':
      return { bg: 'bg-purple-50 text-purple-600 border-purple-200', text: 'text-purple-700', label: 'Imagen' };
    case 'archive':
      return { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-800', label: 'Comprimido' };
    case 'cad':
      return { bg: 'bg-cyan-50 text-cyan-600 border-cyan-200', text: 'text-cyan-700', label: 'Plano / CAD' };
    case 'code':
      return { bg: 'bg-slate-100 text-slate-700 border-slate-300', text: 'text-slate-800', label: 'Texto / Datos' };
    case 'audio':
      return { bg: 'bg-violet-50 text-violet-600 border-violet-200', text: 'text-violet-700', label: 'Audio' };
    case 'video':
      return { bg: 'bg-rose-50 text-rose-600 border-rose-200', text: 'text-rose-700', label: 'Video' };
    default:
      return { bg: 'bg-slate-100 text-slate-600 border-slate-200', text: 'text-slate-700', label: 'Archivo' };
  }
}
