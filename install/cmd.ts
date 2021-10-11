export async function cmd(cmd: string[], opts: Omit<Deno.RunOptions, 'cmd' | 'stdin' | 'stdout' | 'stderr'> = {}) {
  const process = Deno.run({
    cmd,
    stdout: 'piped',
    stderr: 'piped',
    ...opts,
  });
  const status = await process.status();
  const decoder = new TextDecoder();
  if (status.success) {
    return decoder.decode(await process.output());
  } else {
    return decoder.decode(await process.stderrOutput());
  }
}