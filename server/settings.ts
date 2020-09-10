import { IConnection } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument'

import { TextDocumentSettings } from '../types';

const  documentSettingsRequests = new Map<
  string,
  Thenable<TextDocumentSettings>
>()

async function buildDocumentSettingsRequest(
  connection: IConnection,
  document: TextDocument
) {
  const uri = document.uri;

  const settings: TextDocumentSettings = await connection.workspace
    .getConfiguration({ scopeUri: uri, section: '' });

  return settings;
}

export function clear() {
  documentSettingsRequests.clear()
}

export function deleteDocument(document: TextDocument) {
  documentSettingsRequests.delete(document.uri);
}

export async function get(
  connection: IConnection,
  document: TextDocument
) {
  const uri = document.uri;
  const request = documentSettingsRequests.get(uri);

  if (request) {
    return request;
  }

  const newRequest = buildDocumentSettingsRequest(connection, document);

  documentSettingsRequests.set(uri, newRequest);

  return newRequest;
}

