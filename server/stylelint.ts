import Path from 'path';
import findPkgDir from 'find-pkg-dir';
import pathIsInside from 'path-is-inside';

import { URI } from 'vscode-uri';
import { IConnection, Diagnostic } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

import stylelintVSCode from 'stylelint-vscode';

export async function getDiagnostics(connection: IConnection, document: TextDocument, { config, configOverrides }): Promise<Diagnostic[]> {
  const documentPath = URI.parse(document.uri).fsPath;

  const options: any = {}

  if (config) {
    options.config = config
  }

  if (configOverrides) {
    options.configOverrides = configOverrides
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

