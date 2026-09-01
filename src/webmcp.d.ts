import type { SiteTool } from "./gateway";

declare global {
  interface Document {
    modelContext?: {
      registerTool(tool: SiteTool): Promise<void> | void;
      unregisterTool?(name: string): Promise<void> | void;
    };
  }
}

export {};
