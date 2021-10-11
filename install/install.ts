import { ensureDir } from 'https://deno.land/std@0.110.0/fs/ensure_dir.ts';
import { cyan, green } from 'https://deno.land/std@0.110.0/fmt/colors.ts';
import ProgressBar from 'https://deno.land/x/progress@v1.1.4/mod.ts';
import { binDir, platform, distro } from './settings.ts';
import { cmd } from './cmd.ts';
import { download } from './download.ts';
import { unzipFile } from './unzip.ts';

const exeSuffix = platform === 'windows' ? '.exe' : '';
const hashicorpArch = platform === 'windows' ? 'windows_amd64' : 'linux_amd64';
const dockerKernel = platform === 'windows' ? 'Windows' : 'Linux';
const dockerArchitecture = 'x86_64';
const kubectlArch = platform === 'windows' ? 'windows' : 'linux';

export async function install(alias: string, file: string) {
  const path = `${binDir}/${alias}${exeSuffix}`
  await ensureDir(binDir);
  await Deno.copyFile(file, path);
  await Deno.remove(file);
  if (platform !== 'windows') {
    await Deno.chmod(path, 0o755);
  }
}

function installStr(name: string, version: string, alias: string) {
  let nameVer = name;
  if (version) {
    nameVer = `${name}@${version}`;
  }
  let str = `Installing ${nameVer}...`;
  if (alias !== name) {
    str = `Installing ${nameVer} as ${alias}...`;
  }
  console.log(`${cyan('[install]')} ${str}`);
  return () => {
    console.log(`${green('[install]')} ${str}done`);
  };
}

async function installRemoteZip(name: string, url: string, path: string) {
  const zipFile = await Deno.makeTempFile();
  const binFile = await Deno.makeTempFile();
  const downloadProgress = new ProgressBar({ display: `Downloading ${name} :time [:bar] :percent` });
  const unzipProgress = new ProgressBar({ display: `Unzipping ${name} :time [:bar] :percent` });
  const writeProgress = new ProgressBar({ display: `Writing ${name} :time [:bar] :percent` });
  await download(url, zipFile, {
    onProgress(bytes, length) {
      downloadProgress.total = length;
      downloadProgress.render(bytes);
    }
  });
  await unzipFile(zipFile, path, binFile, {
    onUnzipProgress(bytes, length) {
      unzipProgress.total = length;
      unzipProgress.render(bytes);
    },
    onWriteProgress(bytes, length) {
      writeProgress.total = length;
      writeProgress.render(bytes);
    },
  });
  await install(name, binFile);
  await Deno.remove(zipFile);
}

export async function installTerraform(opts: { version?: string, alias?: string } = {}) {
  const { version = '1.0.8', alias = 'terraform' } = opts;
  const url = `https://releases.hashicorp.com/terraform/${version}/terraform_${version}_${hashicorpArch}.zip`;
  const done = installStr('terraform', version, alias);
  await installRemoteZip(alias, url, `terraform${exeSuffix}`);
  done();
}

export async function installVault(opts: { version?: string, alias?: string } = {}) {
  const { version = '1.8.4', alias = 'vault' } = opts;
  const url = `https://releases.hashicorp.com/vault/${version}/vault_${version}_${hashicorpArch}.zip`;
  const done = installStr('vault', version, alias);
  await installRemoteZip(alias, url, `vault${exeSuffix}`);
  done();
}

export async function installDocker() {
  if (platform === 'windows') {
    throw new Error('Cannot install docker through command line on Windows.');
  }
  const done = installStr('docker', '', 'docker');
  if (distro === 'debian' || distro === 'ubuntu') {
    throw new Error('NYI: installing docker on debian');
  } else if (distro === 'alpine') {
    await cmd(['apk', 'add', 'docker']);
  }
  done();
}

export async function installDockerCompose(opts: { version?: string, alias?: string } = {}) {
  const { version = '1.29.2', alias = 'docker-compose' } = opts;
  const url = `https://github.com/docker/compose/releases/download/${version}/docker-compose-${dockerKernel}-${dockerArchitecture}${exeSuffix}`;
  const done = installStr('docker-compose', version, alias);
  const file = await Deno.makeTempFile();
  await download(url, file);
  await install(alias, file);
  done();
}

export async function installDockerMachine(opts: { version?: string, alias?: string } = {}) {
  const { version = '0.16.2', alias = 'docker-machine' } = opts;
  const url = `https://github.com/docker/machine/releases/download/v${version}/docker-machine-${dockerKernel}-${dockerArchitecture}${exeSuffix}`;
  const done = installStr('docker-machine', version, alias);
  const file = await Deno.makeTempFile();
  await download(url, file);
  await install(alias, file);
  done();
}

export async function installKubectl(opts: { version?: string, alias?: string } = {}) {
  const { version = '1.22.2', alias = 'kubectl' } = opts;
  const url = `https://dl.k8s.io/release/v${version}/bin/${kubectlArch}/amd64/kubectl${exeSuffix}`;
  const done = installStr('kubectl', version, alias);
  const file = await Deno.makeTempFile();
  await download(url, file);
  await install(alias, file);
  done();
}