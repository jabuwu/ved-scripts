import { Uint8ArrayReader, ZipReader, Writer, Uint8ArrayWriter, configure } from 'https://deno.land/x/zipjs@v2.3.17/index.js';
configure({
  useWebWorkers: false
});

interface Entry {
  filename: string;
  getData: (writer: Writer, options?: {
    onprogress?: (index: number, max: number) => void,
  }) => Promise<Uint8Array>;
}

async function writeFileProgress(path: string, data: Uint8Array, onProgress: (index: number, max: number) => void) {
  const file = await Deno.open(path, { write: true, create: true });
  const length = data.length;
  let bytesWritten = 0;
  while (bytesWritten < length) {
    bytesWritten += await Deno.write(file.rid, data.subarray(bytesWritten));
    onProgress(bytesWritten, length);
  }
  Deno.close(file.rid);
}

export async function unzipFile(zipFile: string, file: string, path: string, { onUnzipProgress, onWriteProgress }: { onUnzipProgress?: (bytes: number, length: number) => void, onWriteProgress?: (bytes: number, length: number) => void } = {}) {
  const fileContents = await Deno.readFile(zipFile);
  const reader = new Uint8ArrayReader(fileContents);
  const zip = new ZipReader(reader);
  const entries = await zip.getEntries();
  let found = false;
  onWriteProgress ??= () => {};
  for (const e of entries) {
    const entry = e as Entry;
    if (entry.filename === file) {
      found = true;
      const data = await entry.getData(new Uint8ArrayWriter(), {
        onprogress: onUnzipProgress,
      });
      await writeFileProgress(path, data, onWriteProgress);
    }
  }
  zip.close();
  if (!found) {
    throw new Error(`The file ${file} does not exist in ${zipFile}`);
  }
}