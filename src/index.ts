import { ExtensionContext, LanguageClient, ServerOptions, workspace, services, TransportKind, LanguageClientOptions } from 'coc.nvim'

export async function activate(context: ExtensionContext): Promise<void> {
  let { subscriptions } = context
  const config = workspace.getConfiguration().get('stylelint') as any
  const enable = config.enable
  if (enable === false) return
  const file = context.asAbsolutePath('lib/server/server.js')
  const selector = config.filetypes || ["css", "wxss", "scss", "less", "markdown", "postcss", "sugarss", "vue"]

  let serverOptions: ServerOptions = {
    module: file,
    args: ['--node-ipc'],
    transport: TransportKind.ipc,
    options: {
      cwd: workspace.root,
      execArgv: config.execArgv
    }
  }

  let clientOptions: LanguageClientOptions = {
    documentSelector: selector,
    diagnosticCollectionName: 'stylelint',
    synchronize: {
      configurationSection: 'stylelint',
      fileEvents: [
        workspace.createFileSystemWatcher('**/stylelint.config.js'),
        workspace.createFileSystemWatcher('**/.stylelintrc'),
        workspace.createFileSystemWatcher('**/package.json')
      ]
    }
  }

  let client = new LanguageClient('stylelint', 'stylelint langserver', serverOptions, clientOptions)

  subscriptions.push(
    services.registLanguageClient(client)
  )
}
