import type {TokenRingPlugin} from "@tokenring-ai/app";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import {z} from "zod";
import JavascriptFileValidator from "./JavascriptFileValidator.ts";
import packageJSON from "./package.json" with {type: "json"};

const packageConfigSchema = z.object({});

const JS_EXTENSIONS = [".js", ".mjs", ".cjs", ".jsx"];

export default {
  name: packageJSON.name,
  displayName: "JavaScript Tooling",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, _config) {
    app.waitForService(FileSystemService, (fileSystemService) => {
      const validator = new JavascriptFileValidator();
      for (const ext of JS_EXTENSIONS) {
        fileSystemService.registerFileValidator(ext, validator);
      }
    });
  },
  config: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
