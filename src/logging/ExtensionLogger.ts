import * as vscode from "vscode";
import { OUTPUT_CHANNEL_NAME } from "../constants.js";

export class ExtensionLogger implements vscode.Disposable {
  private readonly channel: vscode.OutputChannel;

  constructor() {
    this.channel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  }

  info(message: string): void {
    this.log("INFO", message);
  }

  warn(message: string): void {
    this.log("WARN", message);
  }

  error(message: string, err?: unknown): void {
    this.log("ERROR", message);
    if (err instanceof Error) {
      this.channel.appendLine(`  Stack: ${err.stack ?? "(no stack)"}`);
    }
  }

  show(): void {
    this.channel.show();
  }

  dispose(): void {
    this.channel.dispose();
  }

  private log(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    this.channel.appendLine(`[${timestamp}] [${level}] ${message}`);
  }
}
