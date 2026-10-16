# OHLA - Portal de Documentos

Portal web de gestión documental de OHLA. Permite a los técnicos y trabajadores en obra o laboratorio acceder a todos los documentos (PETS, procedimientos, planos, etc.) mediante código QR sin barreras de inicio de sesión.

## Características

- 📁 **Gestión de Carpetas:** Crear nuevas carpetas, renombrarlas y eliminarlas en la raíz y en cualquier nivel.
- 📄 **CRUD de Documentos:** Subir, descargar, renombrar, reemplazar (sobreescribir) y eliminar documentos en cualquier carpeta.
- 👁️ **Visor de PDF:** Visualización directa integrada en pantalla completa.
- 📱 **Código QR de Acceso:** Generador dinámico de QR para imprimir y colocar en panel de control o taller.
- 🔍 **Búsqueda en tiempo real:** Filtro instantáneo por código o nombre de documento.
- ☁️ **Listo para Vercel:** Soporta almacenamiento local y `@vercel/blob` para despliegue cloud.

## Ejecución Local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Sincronización a Vercel Blob

```bash
npm run sync-blob
```
