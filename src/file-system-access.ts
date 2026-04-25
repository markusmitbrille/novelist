import { DEFAULT_DOCUMENT_TITLE } from "./constants";

export type WritableFileHandle = FileSystemFileHandle & {
  queryPermission?: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (descriptor?: { mode?: "read" | "readwrite" }) => Promise<PermissionState>;
};

export type OpenedMarkdownFile = {
  handle: WritableFileHandle;
  fileName: string;
  title: string;
  text: string;
};

const MARKDOWN_FILE_TYPES = [{
  description: "Markdown files",
  accept: {
    "text/markdown": [".md", ".markdown"],
    "text/plain": [".txt"],
  },
}];

export function supportsFileSystemAccess() {
  return typeof window.showOpenFilePicker === "function"
    && typeof window.showSaveFilePicker === "function";
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function getTitleFromFileName(fileName: string) {
  return fileName.replace(/\.(md|markdown|txt)$/i, "") || DEFAULT_DOCUMENT_TITLE;
}

export function suggestedMarkdownName(title: string) {
  const slug = String(title || DEFAULT_DOCUMENT_TITLE)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${slug || "untitled"}.md`;
}

export async function pickMarkdownFile(): Promise<OpenedMarkdownFile | null> {
  if (typeof window.showOpenFilePicker !== "function") {
    throw new Error("This browser does not support opening local files directly.");
  }
  const handles = await window.showOpenFilePicker({
    multiple: false,
    types: MARKDOWN_FILE_TYPES,
  }) as WritableFileHandle[];
  const handle = handles[0];
  if (!handle) {
    return null;
  }
  const file = await handle.getFile();
  return {
    handle,
    fileName: file.name,
    title: getTitleFromFileName(file.name),
    text: await file.text(),
  };
}

export async function pickSaveFile(title: string): Promise<WritableFileHandle> {
  if (typeof window.showSaveFilePicker !== "function") {
    throw new Error("This browser does not support saving local files directly.");
  }
  return await window.showSaveFilePicker({
    suggestedName: suggestedMarkdownName(title),
    types: MARKDOWN_FILE_TYPES,
  }) as WritableFileHandle;
}

export async function ensureWritablePermission(handle: WritableFileHandle) {
  if (typeof handle.queryPermission !== "function" || typeof handle.requestPermission !== "function") {
    return true;
  }
  if (await handle.queryPermission({ mode: "readwrite" }) === "granted") {
    return true;
  }
  return await handle.requestPermission({ mode: "readwrite" }) === "granted";
}

export async function writeMarkdownFile(handle: WritableFileHandle, text: string) {
  if (!(await ensureWritablePermission(handle))) {
    throw new Error("Write permission was not granted for this file.");
  }
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
}
