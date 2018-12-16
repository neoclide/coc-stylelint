import arrayToError from 'array-to-error'
import arrayToSentence from 'array-to-sentence'
import { at, intersection, isPlainObject, map, stubString } from 'lodash'
import { TextDocument } from 'vscode-languageserver'
import inspectWithKind from 'inspect-with-kind'
import { lint } from 'stylelint'
import Uri from 'vscode-uri'
import stylelintWarningToVscodeDiagnostic from 'stylelint-warning-to-vscode-diagnostic'

// https://github.com/stylelint/stylelint/blob/9.6.0/lib/getPostcssResult.js#L13-L21
const SUPPORTED_SYNTAXES = new Set([
  'html',
  'less',
  'markdown',
  'sass',
  'sugarss',
  'scss'
])

const LANGUAGE_EXTENSION_EXCEPTION_PAIRS = new Map([
  ['javascript', 'jsx'],
  ['javascriptreact', 'jsx'],
  ['source.css.styled', 'jsx'],
  ['source.markdown.math', 'markdown'],
  ['styled-css', 'jsx'],
  ['svelte', 'html'],
  ['typescript', 'jsx'],
  ['typescriptreact', 'jsx'],
  ['vue-html', 'html'],
  ['xml', 'html'],
  ['xsl', 'html']
])

const UNSUPPORTED_OPTIONS = [
  'code',
  'codeFilename',
  'files',
  'formatter'
]

function quote(str: string): string {
  return `\`${str}\``
}

function processResults({ results }): any {
  // https://github.com/stylelint/stylelint/blob/9.6.0/lib/standalone.js#L137-L144
  if (results.length === 0) {
    return []
  }

  const [{ invalidOptionWarnings, warnings }] = results

  if (invalidOptionWarnings.length !== 0) {
    throw arrayToError(map(invalidOptionWarnings, 'text'), SyntaxError)
  }

  return warnings.map(stylelintWarningToVscodeDiagnostic)
}

export default async function(...args: any[]) {
  const argLen = args.length

  if (argLen !== 1 && argLen !== 2) {
    throw new RangeError(`Expected 1 or 2 arguments (<TextDocument>[, <Object>]), but got ${
      argLen === 0 ? 'no' : argLen
      } arguments.`)
  }

  const [textDocument, options] = args

  if (!TextDocument.is(textDocument)) {
    throw new TypeError(`Expected a TextDocument https://code.visualstudio.com/docs/extensionAPI/vscode-api#TextDocument, but got ${
      inspectWithKind(textDocument)
      }.`)
  }

  if (argLen === 2) {
    if (!isPlainObject(options)) {
      throw new TypeError(`Expected an object containing stylelint API options, but got ${
        inspectWithKind(options)
        }.`)
    }

    const providedUnsupportedOptions = intersection(Object.keys(options), UNSUPPORTED_OPTIONS)

    if (providedUnsupportedOptions.length !== 0) {
      throw new TypeError(`${
        arrayToSentence(map(UNSUPPORTED_OPTIONS, quote))
        } options are not supported because they will be derived from a document and there is no need to set them manually, but ${
        arrayToSentence(map(providedUnsupportedOptions, quote))
        } was provided.`)
    }
  }

  const baseOptions: any = {
    code: textDocument.getText(),
    formatter: stubString
  }
  const codeFilename = Uri.parse(textDocument.uri).fsPath
  let resultContainer: any

  if (codeFilename) {
    baseOptions.codeFilename = codeFilename
  } else {
    if (SUPPORTED_SYNTAXES.has(textDocument.languageId)) {
      baseOptions.syntax = textDocument.languageId
    } else {
      const customSyntax = LANGUAGE_EXTENSION_EXCEPTION_PAIRS.get(textDocument.languageId)

      if (customSyntax) {
        baseOptions.customSyntax = `postcss-${customSyntax}`
      }
    }

    if (!at(options, 'config.rules')[0]) {
      baseOptions.config = { rules: {} }
    }
  }

  try {
    resultContainer = await lint({ ...options, ...baseOptions })
  } catch (err) {
    if (
      err.message.startsWith('No configuration provided for') ||
      err.message.includes('No rules found within configuration')
    ) {
      // Check only CSS syntax errors without applying any stylelint rules
      return processResults(await lint({
        ...options,
        ...baseOptions,
        config: {
          rules: {}
        }
      }))
    }

    throw err
  }

  return processResults(resultContainer)
}
