import fastDiff from 'fast-diff';

interface Change {
  start: number,
  end: number,
  newText: string,
}

// taken from https://github.com/neoclide/coc-eslint/blob/2f9de5cf232223f886b5e9711b0e9a5260f65db9/server/util.ts#L117-L144
export function getChange(oldStr: string, newStr: string): Change {
  let result = fastDiff(oldStr, newStr, 1)
  let curr = 0
  let start = -1
  let end = -1
  let newText = ''
  let remain = ''

  for (let item of result) {
    let [t, str] = item
    // equal
    if (t == 0) {
      curr = curr + str.length
      if (start != -1) remain = remain + str
    } else {
      if (start == -1) start = curr
      if (t == 1) {
        newText = newText + remain + str
        end = curr
      } else {
        newText = newText + remain
        end = curr + str.length
      }
      remain = ''
      if (t == -1) curr = curr + str.length
    }
  }

  return { start, end, newText }
}
