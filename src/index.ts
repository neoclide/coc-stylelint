import { ExtensionContext, LanguageClient, ServerOptions, workspace, services, TransportKind, LanguageClientOptions, WorkspaceMiddleware } from 'coc.nvim'

import { TextDocumentSettings } from '../types';

export async function activate(context: ExtensionContext): Promise<void> {
  const { subscriptions } = context;

  const config = workspace.getConfiguration('stylelint');
  if (!config.get<boolean>('enable')) return;

  const file = context.asAbsolutePath('lib/server.js')

  const serverOptions: ServerOptions = {
    module: file,
    args: ['--node-ipc'],
    transport: TransportKind.ipc,
    options: {
      cwd: workspace.root,
      execArgv: config.execArgv
    }
  };

  const selector = config.get<string[]>('filetypes');

  const clientOptions: LanguageClientOptions = {
    documentSelector: selector,
    diagnosticCollectionName: 'stylelint',
    synchronize: {
      configurationSection: 'stylelint',
      fileEvents: [
        workspace.createFileSystemWatcher('**/stylelint.config.js'),
        workspace.createFileSystemWatcher('**/.stylelintrc'),
        workspace.createFileSystemWatcher('**/.stylelintrc.js'),
        workspace.createFileSystemWatcher('**/package.json')
      ]
    },
    initializationFailedHandler: error => {
      workspace.showMessage(`Stylelint server initialization failed: ${error.message}.`, 'error')
      return false
    },
    middleware: {
      workspace: {
        configuration: (params, _token, _next): any => {
          return params.items.map(item => {
            const uri = item.scopeUri;
            const config = workspace.getConfiguration('stylelint', uri);

            const settings: TextDocumentSettings = {
              config: config.get('config', undefined),
              configOverrides: config.get('configOverrides', {}),
            };

            return settings;
          })
        }
      } as WorkspaceMiddleware
    }
  };

  const client = new LanguageClient('stylelint', 'stylelint langserver', serverOptions, clientOptions);

  subscriptions.push(
    services.registLanguageClient(client)
  );
}
