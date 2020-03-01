import { createConnection, ProposedFeatures, TextDocuments, TextDocument } from 'vscode-languageserver';

import * as Stylelint from './stylelint';

const { join, parse } = require('path')

const { createConnection, ProposedFeatures, TextDocuments } = require('vscode-languageserver')
const findPkgDir = require('find-pkg-dir')
const parseUri = require('vscode-uri').URI.parse
const pathIsInside = require('path-is-inside')
const stylelintVSCode = require('stylelint-vscode')

const connection = createConnection(ProposedFeatures.all)
const documents = new TextDocuments()

let config
let configOverrides

async function validateDocument(document: TextDocument) {
  try {
    const diagnostics = await Stylelint.getDiagnostics(connection, document, { config, configOverrides });

    connection.sendDiagnostics({
      uri: document.uri,
      diagnostics: diagnostics,
    })
  } catch (error) {
    connection.window.showErrorMessage(error.stack.replace(/\n/ug, ' '));
  }
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
      textDocumentSync: documents.syncKind
    }
  }
})

connection.onDidChangeConfiguration(({ settings }) => {
  config = settings.stylelint.config
  configOverrides = settings.stylelint.configOverrides

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
});

documents.listen(connection);

connection.listen();
