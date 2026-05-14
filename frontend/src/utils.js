export function fmtGex(v) {
  const a = Math.abs(v)
  const s = v >= 0 ? '+' : '−'
  if (a >= 1e9) return s + (a / 1e9).toFixed(2) + 'B'
  if (a >= 1e6) return s + (a / 1e6).toFixed(0) + 'M'
  return s + a.toFixed(0)
}

export function fmtSpot(symbol, v) {
  return symbol === 'SPX'
    ? v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : v.toFixed(2)
}

export function fmtStrike(symbol, v) {
  return symbol === 'SPX' ? v.toLocaleString() : v.toFixed(0)
}

export function fmtPct(v) {
  return (v >= 0 ? '+' : '') + v.toFixed(2) + '%'
}

export function toB(v) {
  return (Math.abs(v) / 1e9).toFixed(2) + 'B'
}
