import * as vscode from "vscode";
import { SETTING_TEAM_NAME } from "./constants.js";

export function getTeamName(): string {
  return vscode.workspace.getConfiguration().get<string>(SETTING_TEAM_NAME, "");
}

export async function setTeamName(teamName: string): Promise<void> {
  await vscode.workspace
    .getConfiguration()
    .update(SETTING_TEAM_NAME, teamName, vscode.ConfigurationTarget.Global);
}
