import { red } from 'https://deno.land/std@0.110.0/fmt/colors.ts';

export function fatal(message: string): never {
  console.log(red(`FATAL: ${message}`));
  Deno.exit(1);
}