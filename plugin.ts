import {TokenRingPlugin} from "@tokenring-ai/app";
import FileSystemService from "@tokenring-ai/filesystem/FileSystemService";
import {z} from "zod";
import JavascriptFileValidator from "./JavascriptFileValidator.ts";
import packageJSON from './package.json' with {type: 'json'};

const packageConfigSchema = z.object({});

const JS_EXTENSIONS = [".js", ".mjs", ".cjs", ".jsx"];

export default {
  name: packageJSON.name,
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.waitForService(FileSystemService, fileSystemService => {
      for (const ext of JS_EXTENSIONS) {
        fileSystemService.registerFileValidator(ext, JavascriptFileValidator);
      }
    });
  },
  config: packageConfigSchema
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
