import { ExtensionContext, commands, LanguageClient, ServerOptions, workspace, services, TransportKind, LanguageClientOptions } from 'coc.nvim'

export async function activate(context: ExtensionContext): Promise<void> {
  const { subscriptions } = context
  const config = workspace.getConfiguration('stylelint')
  if (!config.get<boolean>('enable')) return
  const file = context.asAbsolutePath('./server.js')
  const serverOptions: ServerOptions = {
    module: file,
    args: ['--node-ipc'],
    transport: TransportKind.ipc,
    options: {
      cwd: workspace.root,
      execArgv: config.execArgv
    }
  }

  const selector = config.get<string[]>('filetypes')

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
    }
  }

  const client = new LanguageClient('stylelint', 'stylelint langserver', serverOptions, clientOptions)

  subscriptions.push(
    services.registLanguageClient(client)
  )

  subscriptions.push(
    commands.registerCommand('stylelint.executeAutofix', async () => {
      const doc = await workspace.document
      if (!doc) return

      const textDocument = {
        uri: doc.uri,
        version: doc.version
      }
      const params = {
        command: 'stylelint.applyAutoFix',
        arguments: [textDocument],
      }

      await client.sendRequest('workspace/executeCommand', params).then(undefined, () => {
        workspace.showMessage(
          'Failed to apply stylelint fixes to the document. Please consider opening an issue with steps to reproduce.',
          'error'
        )
      })
    }),
  )
}
