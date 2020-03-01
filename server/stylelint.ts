import * as Path from 'path';
import findPkgDir from 'find-pkg-dir';
import pathIsInside from 'path-is-inside';

import { URI } from 'vscode-uri';
import { IConnection, Diagnostic, TextEdit } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

import stylelintVSCode from 'stylelint-vscode';

import * as DocumentSettings from './settings';
import { getChange } from './util';

export async function getDiagnostics(connection: IConnection, document: TextDocument): Promise<Diagnostic[]> {
  const documentPath = URI.parse(document.uri).fsPath;

  const settings = await DocumentSettings.get(connection, document);

  const options: any = {
    config: settings.config,
    configOverrides: settings.configOverrides,
  }

  if (documentPath) {
    const workspaceFolders = await connection.workspace.getWorkspaceFolders();

    if (workspaceFolders) {
      for (const { uri } of workspaceFolders) {
        const workspacePath = URI.parse(uri).fsPath;

        if (pathIsInside(documentPath, workspacePath)) {
          options.ignorePath = Path.join(workspacePath, '.stylelintignore')
          break
        }
      }
    }

    if (options.ignorePath === undefined) {
      options.ignorePath = Path.join(findPkgDir(documentPath) || Path.parse(documentPath).root, '.stylelintignore');
    }
  }

  try {
    const { diagnostics } = await stylelintVSCode(document, options);

    return diagnostics;
  } catch (error) {
    if (error.reasons) {
      error.reasons.forEach((reason: any) => {
        connection.window.showErrorMessage(`stylelint: ${reason}`);
      });

      return [];
    }

    // https://github.com/stylelint/stylelint/blob/10.0.1/lib/utils/configurationError.js#L10
    if (error.code === 78) {
      connection.window.showErrorMessage(`stylelint: ${error.message}`);

      return [];
    }

    throw error;
  }
}

export async function getTextEdit(connection: IConnection, document: TextDocument): Promise<TextEdit | undefined> {
  const documentPath = URI.parse(document.uri).fsPath;

  const settings = await DocumentSettings.get(connection, document);

  const options: any = {
    config: settings.config,
    configOverrides: settings.configOverrides,
    fix: true, // forcing true here because would not call the function otherwise
  }

  if (documentPath) {
    const workspaceFolders = await connection.workspace.getWorkspaceFolders();

    if (workspaceFolders) {
      for (const { uri } of workspaceFolders) {
        const workspacePath = URI.parse(uri).fsPath;

        if (pathIsInside(documentPath, workspacePath)) {
          options.ignorePath = Path.join(workspacePath, '.stylelintignore')
          break
        }
      }
    }

    if (options.ignorePath === undefined) {
      options.ignorePath = Path.join(findPkgDir(documentPath) || Path.parse(documentPath).root, '.stylelintignore');
    }
  }

  const currentContent = document.getText()

  try {
    const { output: newContent } = await stylelintVSCode(document, options);

    const change = getChange(currentContent, newContent)

    return {
      range: {
        start: document.positionAt(change.start),
        end: document.positionAt(change.end)
      },
      newText: change.newText
    };
  } catch (error) {
    if (error.reasons) {
      error.reasons.forEach((reason: any) => {
        connection.window.showErrorMessage(`stylelint: ${reason}`);
      });

      return;
    }

    // https://github.com/stylelint/stylelint/blob/10.0.1/lib/utils/configurationError.js#L10
    if (error.code === 78) {
      connection.window.showErrorMessage(`stylelint: ${error.message}`);

      return;
    }

    throw error;
  }
}

