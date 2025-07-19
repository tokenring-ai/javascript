import FileSystemService from "@token-ring/filesystem/FileSystemService";
import runShellCommand from "@token-ring/filesystem/tools/runShellCommand";
import { z } from "zod";

export default execute;
export async function execute({ packageName }, registry) {
 const filesystem = registry.requireFirstServiceByType(FileSystemService);

 if (filesystem.existsSync('pnpm-lock.yaml')) {
  return runShellCommand({
   command: `pnpm remove ${packageName}`,
  }, registry);
 }

 if (filesystem.existsSync('yarn.lock')) {
  return runShellCommand({
   command: `yarn remove ${packageName}`,
  }, registry);
 }

 if (filesystem.existsSync('package-lock.json')) {
  return runShellCommand({
   command: `npm uninstall ${packageName}`,
  }, registry);
 }
}

export const description = "Removes a package using the detected package manager (pnpm, npm, yarn)";
export const parameters = z.object({
 packageName: z.string().describe('One or more package names to remove, separated by spaces.')
});
