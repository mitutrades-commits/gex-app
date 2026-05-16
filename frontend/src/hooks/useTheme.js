import { useEffect, useState, useSyncExternalStore } from "react"

const STORAGE_KEY = "gex.theme"
const DEFAULT_THEME = "dark"

export const THEMES = [
  { id: "dark",      label: "Dark",      description: "Default" },
  { id: "light",     label: "Light",     description: "Daytime" },
  { id: "bloomberg", label: "Bloomberg", description: "Terminal amber" },
]

const VALID = new Set(THEMES.map(t => t.id))

function currentTheme() {
  if (typeof document === "undefined") return DEFAULT_THEME
  const t = document.documentElement.dataset.theme
  return VALID.has(t) ? t : DEFAULT_THEME
}

const listeners = new Set()
function notify() { listeners.forEach(l => l()) }

function load() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && VALID.has(v)) return v
  } catch {}
  return currentTheme()
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => load())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem(STORAGE_KEY, theme) } catch {}
    notify()
  }, [theme])

  function setTheme(next) {
    if (!VALID.has(next)) return
    setThemeState(next)
  }

  return { theme, setTheme, themes: THEMES }
}

function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

let cachedColors = null
let cachedTheme = null

function readColors() {
  const theme = currentTheme()
  if (cachedColors && cachedTheme === theme) return cachedColors
  if (typeof window === "undefined") {
    cachedColors = { grid: "#1e2736", axis: "#7a8aa8", pos: "#2dc88a", neg: "#e05252", flip: "#4d8fea" }
  } else {
    const cs = getComputedStyle(document.documentElement)
    const v = name => cs.getPropertyValue(name).trim()
    cachedColors = {
      grid: v("--chart-grid") || "#1e2736",
      axis: v("--chart-axis") || "#7a8aa8",
      pos:  v("--chart-pos")  || "#2dc88a",
      neg:  v("--chart-neg")  || "#e05252",
      flip: v("--chart-flip") || "#4d8fea",
    }
  }
  cachedTheme = theme
  return cachedColors
}

// Invalidate cache when theme changes so next snapshot returns fresh values.
listeners.add(() => { cachedColors = null; cachedTheme = null })

export function useThemeColors() {
  return useSyncExternalStore(subscribe, readColors, readColors)
}
