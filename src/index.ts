import { ExtensionContext, LanguageClient, ServerOptions, workspace, services, TransportKind, LanguageClientOptions } from 'coc.nvim'

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
  };

  const client = new LanguageClient('stylelint', 'stylelint langserver', serverOptions, clientOptions);

  subscriptions.push(
    services.registLanguageClient(client)
  );
}
