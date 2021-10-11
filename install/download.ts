import { writeAll } from 'https://deno.land/std@0.110.0/io/util.ts';

export async function download(url: string, path: string, { onProgress }: { onProgress?: (bytes: number, length: number) => void } = {}) {
  const res = await fetch(url);
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Failed to download ${url}, status: ${res.status}`);
  }
  const file = await Deno.open(path, { create: true, write: true })
  const contentLength = res.headers.get('content-length');
  let bytesWritten = 0;
  if (res.body) {
    for await(const chunk of res.body) {
      await writeAll(file, chunk);
      bytesWritten += chunk.length;
      if (onProgress && contentLength !== null) {
        onProgress(bytesWritten, Number(contentLength));
      }
    }
    file.close();
  }
}