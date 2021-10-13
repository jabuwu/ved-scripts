import { Inflate } from 'https://deno.land/x/pako@v2.0.3/pako.js';
import { Untar } from 'https://deno.land/std@0.110.0/archive/tar.ts';
import { copy } from 'https://deno.land/std@0.110.0/io/util.ts';
import { Buffer } from 'https://deno.land/std@0.111.0/io/mod.ts';

export async function untarFile(tarFile: string, file: string, path: string, { onUntarProgress, compressed }: { onUntarProgress?: (bytes: number, length: number) => void, compressed?: boolean } = {}) {
  let tarArray: Uint8Array | undefined;
  if (compressed) {
    const tgz = await Deno.open(tarFile, { read: true });
    const { size } = await tgz.stat();
    const inflateArray = new Uint8Array(512);
    const inflator = new Inflate();
    let bytesRead = 0;
    while (true) {
      const read = await tgz.read(inflateArray);
      if (read != null) {
        inflator.push(inflateArray.slice(0, read));
        bytesRead += read;
        onUntarProgress?.(bytesRead, size);
      } else {
        break;
      }
    }
    if (inflator.err) {
      throw new Error(inflator.msg);
    }
    tarArray = inflator.result! as Uint8Array;
  } else {
    tarArray = await Deno.readFile(tarFile);
  }
  const untar = new Untar(new Buffer(tarArray));
  for await (const entry of untar) {
    if (entry.fileName === file) {
      const fileHandle = await Deno.open(path, { create: true, write: true });
      await copy(entry, fileHandle);
    }
  }
}