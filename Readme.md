# coc-stylelint

Stylelint language server extension for [coc.nvim](https://github.com/neoclide/coc.nvim).

Inspired by [vscode-stylelint](https://github.com/shinnn/vscode-stylelint)

## Install

In your vim/neovim run command:

```sh
:CocInstall coc-stylelint
```

## Usage

stylelint automatically validates documents with these `filetypes`:

- `css`
- `wxss`
- `scss`
- `less`
- `postcss`
- `sugarss`
- `vue`

## Extension settings

Though it's highly recommended to add a [stylelint configuration file](https://stylelint.io/user-guide/example-config/) to the current workspace folder instead, the following extension [settings](https://code.visualstudio.com/docs/getstarted/settings) are also available.

#### stylelint.enable

Type: `boolean`
Default: `true`

Control whether this extension is enabled or not.

#### stylelint.configOverrides

Type: `Object`
Default: `null`

Set stylelint [`configOverrides`](https://github.com/stylelint/stylelint/blob/master/docs/user-guide/node-api.md#configoverrides) option.

#### stylelint.config

Type: `Object`
Default: `null`

Set stylelint [`config`](https://github.com/stylelint/stylelint/blob/master/docs/user-guide/node-api.md#config) option. Note that when this option is enabled, stylelint doesn't load configuration files.

## License

MIT
