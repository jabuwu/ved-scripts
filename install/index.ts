import { parse } from 'https://deno.land/std@0.110.0/flags/mod.ts';
import { fatal } from './log.ts';
import { init, platform } from './settings.ts';
import { installTerraform, installVault, installDocker, installDockerCompose, installDockerMachine, installKubectl, installDoctl, installHelm } from './install.ts';

await init();

const args = parse(Deno.args, { string: [ 'version', 'alias' ] });
if (args._.length == 0) {
  console.log('Args: <program> [version]');
  console.log('');
  console.log('Programs: docker, docker-compose, docker-machine, doctl, kubectl, terraform, vault');
  console.log('');
  console.log('Options:');
  console.log('  --version 0.0.0');
  console.log('  --alias program0.0.0');
  Deno.exit(1);
}

async function checkPermissions(): Promise<boolean> {
  if (platform === 'linux') {
    const process = Deno.run({
      cmd: [ 'whoami' ],
      stdin: 'null',
      stderr: 'null',
      stdout: 'piped',
    });
    if ((await process.status()).success) {
      const decoder = new TextDecoder();
      return decoder.decode(await process.output()).trim() === 'root';
    }
    return false;
  }
  return true;
}
if (!await checkPermissions()) {
  console.log('Must run this as root.');
  Deno.exit(1);
}

const program = args._[0] as string | undefined;
const version = args.version as string | undefined;
const alias = args.alias as string | undefined;
if (program === 'terraform') {
  installTerraform({ version, alias });
} else if (program === 'vault') {
  installVault({ version, alias });
} else if (program === 'docker') {
  installDocker();
} else if (program === 'docker-compose') {
  installDockerCompose({ version, alias });
} else if (program === 'docker-machine') {
  installDockerMachine({ version, alias });
} else if (program === 'kubectl') {
  installKubectl({ version, alias });
} else if (program === 'doctl') {
  installDoctl({ version, alias });
} else if (program === 'helm') {
  installHelm({ version, alias });
} else {
  fatal(`Unknown program: ${program}`);
}