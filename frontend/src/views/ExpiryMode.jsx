import { useState, useEffect, useRef } from "react"
import { fetchGEXBySymbol, fetchExpirations } from "@/api"
import InstrumentColumn from "@/components/InstrumentColumn"
import IntradayChart from "@/components/IntradayChart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function ExpiryMode() {
  const [symbol, setSymbol] = useState("SPX")
  const [date, setDate] = useState("")
  const [expirations, setExpirations] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const debounceRef = useRef(null)

  useEffect(() => {
    if (!symbol.trim()) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const exps = await fetchExpirations(symbol.trim())
        setExpirations(Array.isArray(exps) ? exps : [])
      } catch {
        setExpirations([])
      }
    }, 500)
    return () => clearTimeout(debounceRef.current)
  }, [symbol])

  async function handleLoad() {
    if (!symbol.trim() || !date) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const result = await fetchGEXBySymbol(symbol.trim().toUpperCase(), {
        strikes: 50,
        expiry: date,
      })
      setData(result)
    } catch (err) {
      setError(err.message || "Failed to load GEX data")
    } finally {
      setLoading(false)
    }
  }

  const canLoad = symbol.trim().length > 0 && date.length > 0

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top form panel */}
      <div className="flex-none border-b border-[var(--border)] p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Symbol input */}
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="SPX"
            className="bg-transparent border border-[var(--border)] rounded px-2 py-1 font-mono text-[10px] text-[var(--text-1)] w-20 uppercase"
          />

          {/* Date picker */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            list="expiry-dates"
            className="bg-transparent border border-[var(--border)] rounded px-2 py-1 font-mono text-[10px] text-[var(--text-1)]"
          />
          <datalist id="expiry-dates">
            {expirations.map((exp) => (
              <option key={exp} value={exp} />
            ))}
          </datalist>

          {/* Load button */}
          <Button
            onClick={handleLoad}
            disabled={!canLoad || loading}
            variant="default"
            className="font-mono text-[10px] px-3 py-1 h-auto"
          >
            Load
          </Button>
        </div>

        {/* Status row */}
        <div className="mt-2 flex items-center gap-2 min-h-[20px]">
          {loading && (
            <span className="font-mono text-[10px] text-[var(--text-3)]">loading…</span>
          )}
          {error && (
            <span className="font-mono text-[10px] text-[var(--red)]">{error}</span>
          )}
          {!loading && !error && data && (
            <>
              <Badge variant="default" className="font-mono text-[10px]">
                {data.symbol ?? symbol.toUpperCase()}
              </Badge>
              <span className="font-mono text-[10px] text-[var(--text-3)]">{date}</span>
            </>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto">
        {data ? (
          <div>
            {data.source === "seed" && (
              <div className="px-4 pt-3">
                <span className="font-mono text-[10px] text-[var(--amber)]">
                  Expiry filtering requires live data (Flash Alpha adapter)
                </span>
              </div>
            )}
            <InstrumentColumn inst={data} />
            <div className="px-4 pb-4">
              <IntradayChart symbol={data.symbol ?? symbol.toUpperCase()} height={220} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="font-mono text-[10px] text-[var(--text-3)]">
              Select a symbol and expiry date to load GEX
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
