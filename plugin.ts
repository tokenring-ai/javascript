import type { TokenRingPlugin } from "@tokenring-ai/app";
import { AgentLifecycleService } from "@tokenring-ai/lifecycle";
import { z } from "zod";
import javascriptFileValidator from "./hooks/javascriptFileValidator.ts";
import JavascriptService from "./JavascriptService.ts";
import packageJSON from "./package.json" with { type: "json" };

const packageConfigSchema = z.object({});

export default {
  name: packageJSON.name,
  displayName: "JavaScript Tooling",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, _config) {
    app.addServices(new JavascriptService());

    // Register hooks with the lifecycle service
    app.waitForService(AgentLifecycleService, lifecycleService => {
      lifecycleService.addHooks(javascriptFileValidator);
    });
  },
  config: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
