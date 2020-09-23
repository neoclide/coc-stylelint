import { createConnection, ProposedFeatures, TextDocuments, TextDocument, TextDocumentSaveReason, TextDocumentSyncKind } from 'vscode-languageserver';

import * as DocumentSettings from './settings';
import * as Stylelint from './stylelint';

const { join, parse } = require('path')

const findPkgDir = require('find-pkg-dir')
const parseUri = require('vscode-uri').URI.parse
const pathIsInside = require('path-is-inside')
const stylelintVSCode = require('stylelint-vscode')

const connection = createConnection(ProposedFeatures.all)
const documents = new TextDocuments()

async function validateDocument(document: TextDocument) {
  try {
    const diagnostics = await Stylelint.getDiagnostics(connection, document);

    connection.sendDiagnostics({
      uri: document.uri,
      diagnostics: diagnostics,
    })
  } catch (error) {
    connection.window.showErrorMessage(error.stack.replace(/\n/ug, ' '));
  }
}

async function autoFixDocument(document: TextDocument) {
  try {
    const textEdit = await Stylelint.getTextEdit(connection, document);

    if (textEdit) {
      return [textEdit];
    }
  } catch (error) {
    connection.window.showErrorMessage(error.stack.replace(/\n/ug, ' '));
  }

  return [];
}

function validateAll(): void {
  documents.all().forEach(document => {
    validateDocument(document);
  });
}

connection.onInitialize(() => {
  validateAll();

  return {
    capabilities: {
      textDocumentSync: {
        change: TextDocumentSyncKind.Full,
         openClose: true,
        willSaveWaitUntil: true,
        save: {
          includeText: false
        },
      },
    }
  }
})

connection.onDidChangeConfiguration(() => {
  DocumentSettings.clear();

  validateAll();
})

connection.onDidChangeWatchedFiles(validateAll)

documents.onDidChangeContent(({ document }) => {
  validateDocument(document);
});

documents.onDidClose(({ document }) => {
  connection.sendDiagnostics({
    uri: document.uri,
    diagnostics: []
  });

  DocumentSettings.deleteDocument(document);
});

documents.onWillSaveWaitUntil(async ({ reason, document }) => {
  if (reason === TextDocumentSaveReason.AfterDelay) {
    return [];
  }

  const settings = await DocumentSettings.get(connection, document);

  if (!settings.autoFixOnSave) {
    return [];
  }

  return await autoFixDocument(document)
})

documents.listen(connection);

connection.listen();
