import { FileValidatonAfterFileWrite } from "@tokenring-ai/filesystem/util/runFileValidator";
import type { HookSubscription } from "@tokenring-ai/lifecycle/types";
import { HookCallback } from "@tokenring-ai/lifecycle/util/hooks";
import JavascriptService from "../JavascriptService.ts";

const name = "javascriptFileValidator";
const displayName = "Javascript/Validate files after write";
const description = "Automatically validates written javascript files using eslint";

const JAVASCRIPT_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".jsx"]);

const callbacks = [
  new HookCallback(FileValidatonAfterFileWrite, (data, agent) => {
    if (JAVASCRIPT_EXTENSIONS.has(data.fileExtension)) {
      return agent.requireServiceByType(JavascriptService).validateFile(data.filePath, data.content);
    }
    return null;
  })
];
export default {
  name,
  displayName,
  description,
  callbacks,
} satisfies HookSubscription<any>;
