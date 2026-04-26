/**
 * local-pdf.service.ts
 *
 * PDFs never leave the device. When the user picks a file:
 *   1. It is copied into the app's permanent documents directory using the
 *      expo-file-system/next API (Directory / File classes).
 *   2. Metadata (id, name, localPath, pageCount, addedAt) is persisted in AsyncStorage.
 *
 * The reader uses the stored localPath (a file:// URI) directly as the PDF source.
 * The server is never involved in PDF storage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system/next';

const CATALOG_KEY = 'tehreer:pdf_catalog';

export interface LocalPdf {
  id: string;
  name: string;
  localPath: string; // permanent file:// URI inside the app's documents dir
  pageCount: number; // 0 until the reader updates it after the PDF loads
  addedAt: string;   // ISO date string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function readCatalog(): Promise<LocalPdf[]> {
  const raw = await AsyncStorage.getItem(CATALOG_KEY);
  return raw ? (JSON.parse(raw) as LocalPdf[]) : [];
}

async function writeCatalog(catalog: LocalPdf[]): Promise<void> {
  await AsyncStorage.setItem(CATALOG_KEY, JSON.stringify(catalog));
}

/** Returns (creating if necessary) the pdfs/ subdirectory in the app's document storage. */
function getPdfsDirectory(): Directory {
  // Paths.document is the permanent app documents directory (expo-file-system/next)
  const dir = new Directory(Paths.document, 'pdfs');
  if (!dir.exists) {
    dir.create(); // creates the directory (and any intermediates) synchronously
  }
  return dir;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const localPdfService = {
  /** Returns all saved PDFs, newest first. */
  async list(): Promise<LocalPdf[]> {
    const catalog = await readCatalog();
    return catalog.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  },

  /**
   * Copies a picked file (any file:// URI, including the picker cache) into
   * the app's permanent documents directory and registers it in the catalog.
   */
  async add(pickedUri: string, name: string): Promise<LocalPdf> {
    const id = generateId();
    const pdfsDir = getPdfsDirectory();

    // Source file from the document picker (may be in a temp/cache location)
    const src = new File(pickedUri);

    // Destination: a named file inside the permanent pdfs/ directory
    const dest = new File(pdfsDir, `${id}.pdf`);

    src.copy(dest);

    const entry: LocalPdf = {
      id,
      name,
      localPath: dest.uri, // permanent file:// URI
      pageCount: 0,        // updated later by the reader via updatePageCount()
      addedAt: new Date().toISOString(),
    };

    const catalog = await readCatalog();
    catalog.unshift(entry);
    await writeCatalog(catalog);

    return entry;
  },

  /** Looks up a single PDF by its local id. Returns null if not found. */
  async getById(id: string): Promise<LocalPdf | null> {
    const catalog = await readCatalog();
    return catalog.find((p) => p.id === id) ?? null;
  },

  /** Deletes the file from device storage and removes the catalog entry. */
  async remove(id: string): Promise<void> {
    const catalog = await readCatalog();
    const entry = catalog.find((p) => p.id === id);

    if (entry) {
      const file = new File(entry.localPath);
      if (file.exists) {
        file.delete();
      }
    }

    await writeCatalog(catalog.filter((p) => p.id !== id));
  },

  /** Called by the reader once the PDF has loaded and the real page count is known. */
  async updatePageCount(id: string, pageCount: number): Promise<void> {
    const catalog = await readCatalog();
    const idx = catalog.findIndex((p) => p.id === id);
    if (idx !== -1) {
      catalog[idx].pageCount = pageCount;
      await writeCatalog(catalog);
    }
  },
};
