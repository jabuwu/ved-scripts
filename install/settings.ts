import { fatal } from './log.ts';

export const platform = Deno.build.os;
export const binDir = platform === 'linux' ? '/usr/local/bin' : 'bin/';

export type Distro = 'windows' | 'alpine' | 'ubuntu' | 'debian';
export let distro: Distro;

export async function init() {
  // get distro
  if (platform === 'linux') {
    for await (const entry of Deno.readDir('/etc/')) {
      if (entry.name.match(/.*\-release/)) {
        const release = await Deno.readTextFile(`/etc/${entry.name}`);
        const lines = release.split('\n');
        for (const line of lines) {
          if (line.startsWith('ID=')) {
            const id = line.substr(3);
            if (id === 'alpine' || id === 'ubuntu' || id === 'debian') {
              distro = id;
            } else {
              fatal(`Unsupported distro: ${id}`);
            }
          }
        }
      }
    }
    if (!distro) {
      fatal('Failed to detect distro.');
    }
  } else {
    distro = 'windows';
  }
}