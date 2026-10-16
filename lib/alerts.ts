import Swal from 'sweetalert2';

// Custom SweetAlert2 theme matching OHLA corporate design
const customSwal = Swal.mixin({
  customClass: {
    popup: 'rounded-2xl shadow-2xl border border-slate-200 font-sans p-6',
    title: 'text-lg font-bold text-slate-900',
    htmlContainer: 'text-sm text-slate-600',
    confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm mx-1.5 transition-colors text-sm',
    cancelButton: 'px-5 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 mx-1.5 transition-colors text-sm',
    input: 'rounded-xl border-slate-300 text-sm font-sans px-3.5 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  },
  buttonsStyling: false,
});

// Toast notification for top-end feedback
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  customClass: {
    popup: 'rounded-xl shadow-lg border border-slate-200 font-sans text-xs',
  },
});

export const Alerts = {
  // 1. New Folder Prompt
  async promptNewFolder(currentLocation: string): Promise<string | null> {
    const { value: folderName } = await customSwal.fire({
      title: 'Nueva Carpeta',
      text: `Se creará en: /${currentLocation || 'Raíz'}`,
      input: 'text',
      inputPlaceholder: 'Ej: PLANOS, INFORMES_2026...',
      showCancelButton: true,
      confirmButtonText: 'Crear Carpeta',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Debes escribir un nombre para la carpeta';
        }
        return null;
      },
    });

    return folderName ? folderName.trim() : null;
  },

  // 2. Rename Prompt
  async promptRename(currentName: string, isFolder: boolean): Promise<string | null> {
    const { value: newName } = await customSwal.fire({
      title: `Renombrar ${isFolder ? 'Carpeta' : 'Archivo'}`,
      input: 'text',
      inputValue: currentName,
      showCancelButton: true,
      confirmButtonText: 'Guardar Nombre',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'El nombre no puede estar vacío';
        }
        return null;
      },
    });

    return newName ? newName.trim() : null;
  },

  // 3. Confirm Delete File
  async confirmDeleteFile(fileName: string): Promise<boolean> {
    const res = await customSwal.fire({
      title: '¿Eliminar archivo?',
      html: `Vas a eliminar permanentemente <br/><strong class="font-mono text-slate-800 text-xs">${fileName}</strong>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'rounded-2xl shadow-2xl border border-slate-200 font-sans p-6',
        title: 'text-lg font-bold text-slate-900',
        htmlContainer: 'text-sm text-slate-600',
        confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm mx-1.5 transition-colors text-sm',
        cancelButton: 'px-5 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 mx-1.5 transition-colors text-sm',
      },
    });

    return res.isConfirmed;
  },

  // 4. Confirm Delete Folder
  async confirmDeleteFolder(folderName: string, fileCount: number): Promise<boolean> {
    const res = await customSwal.fire({
      title: `¿Eliminar carpeta "${folderName}"?`,
      html: `Esta carpeta contiene <strong>${fileCount} documento(s)</strong> que también serán eliminados permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'rounded-2xl shadow-2xl border border-slate-200 font-sans p-6',
        title: 'text-lg font-bold text-slate-900',
        htmlContainer: 'text-sm text-slate-600',
        confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm mx-1.5 transition-colors text-sm',
        cancelButton: 'px-5 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 mx-1.5 transition-colors text-sm',
      },
    });

    return res.isConfirmed;
  },

  // 5. Toast alerts
  toastSuccess(message: string) {
    Toast.fire({
      icon: 'success',
      title: message,
    });
  },

  toastError(message: string) {
    Toast.fire({
      icon: 'error',
      title: message,
    });
  },

  toastInfo(message: string) {
    Toast.fire({
      icon: 'info',
      title: message,
    });
  },
};
