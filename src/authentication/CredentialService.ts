import * as vscode from "vscode";
import { SECRET_STORAGE_KEY } from "../constants.js";
import { getTeamName, setTeamName } from "../configuration.js";
import type { EsaApiClient } from "../api/EsaApiClient.js";
import type { ExtensionLogger } from "../logging/ExtensionLogger.js";

export class CredentialService implements vscode.Disposable {
  private readonly secrets: vscode.SecretStorage;
  private readonly apiClient: EsaApiClient;
  private readonly logger: ExtensionLogger;

  constructor(secrets: vscode.SecretStorage, apiClient: EsaApiClient, logger: ExtensionLogger) {
    this.secrets = secrets;
    this.apiClient = apiClient;
    this.logger = logger;
  }

  async getToken(): Promise<string | undefined> {
    return this.secrets.get(SECRET_STORAGE_KEY);
  }

  async setToken(token: string): Promise<void> {
    await this.secrets.store(SECRET_STORAGE_KEY, token);
  }

  async deleteToken(): Promise<void> {
    await this.secrets.delete(SECRET_STORAGE_KEY);
  }

  async isConfigured(): Promise<boolean> {
    const teamName = getTeamName();
    if (!teamName) return false;
    const token = await this.getToken();
    return !!token;
  }

  async configure(): Promise<boolean> {
    const currentTeam = getTeamName();
    const teamInput = await vscode.window.showInputBox({
      prompt: "esaチーム名を入力してください（例: my-team）",
      value: currentTeam,
      ignoreFocusOut: true,
      validateInput: (v) => {
        const trimmed = v.trim();
        if (trimmed.includes("esa.io") || trimmed.startsWith("http")) {
          return "チーム名部分だけを入力してください（例: my-team）。URL全体は入力しないでください。";
        }
        return null;
      },
    });

    if (teamInput === undefined) return false;
    const teamName = teamInput.trim();
    if (!teamName) {
      vscode.window.showWarningMessage("チーム名が入力されませんでした。");
      return false;
    }

    const tokenInput = await vscode.window.showInputBox({
      prompt: "esa Personal Access Token v2を入力してください",
      password: true,
      ignoreFocusOut: true,
    });

    if (tokenInput === undefined) return false;
    const token = tokenInput.trim();
    if (!token) {
      vscode.window.showWarningMessage("トークンが入力されませんでした。");
      return false;
    }

    // Verify connection before saving
    try {
      await this.apiClient.checkConnection(teamName, token);
    } catch (err: unknown) {
      this.logger.error("接続確認に失敗しました", err);
      const msg = err instanceof Error ? err.message : "不明なエラー";
      vscode.window.showErrorMessage(`接続確認に失敗しました: ${msg}`);
      return false;
    }

    await setTeamName(teamName);
    await this.setToken(token);
    vscode.window.showInformationMessage("esa.ioへの接続を確認しました。");
    return true;
  }

  async clearCredentials(): Promise<void> {
    await this.deleteToken();
    await setTeamName("");
    vscode.window.showInformationMessage("認証情報を削除しました。");
  }

  dispose(): void {
    // Nothing to dispose
  }
}
