import os from 'https://deno.land/x/dos@v0.11.0/mod.ts';
import { parse } from 'https://deno.land/std@0.105.0/flags/mod.ts';

const args = parse(Deno.args, { boolean: [ 'help', 'nomount', 'upgrade' ] });

if (args.help) {
  console.log('Options:');
  console.log('  --nomount  do not mount the current volume');
  console.log('  --upgrade  pull the latest devbox image from docker hub');
  Deno.exit(1);
}

if (args.upgrade) {
  const process = Deno.run({
    cmd: [
      'docker',
      'pull',
      'jabuwu/devbox'
    ],
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const status = await process.status();
  Deno.exit(status.code);
}

let dir = Deno.cwd();
if (os.platform() === 'windows') {
  dir = '/' + dir.replace(/\\/g, '/').replace(/\:/, '');
}
let cmd: string[] = [
  'docker',
  'run',
  '-it',
  '--rm',
];
if (!args.nomount) {
  cmd = [
    ...cmd,
    '-v',
    `${dir}:/mount`,
    '-w',
    '/mount',
  ];
} else {
  cmd = [
    ...cmd,
    '-w',
    '/root',
  ];
}
cmd = [
  ...cmd,
  '-v',
  `/var/run/docker.sock:/var/run/docker.sock`,
  'jabuwu/devbox',
  'bash',
];
const process = Deno.run({
  cmd,
  stdin: 'inherit',
  stdout: 'inherit',
  stderr: 'inherit',
});
await process.status();