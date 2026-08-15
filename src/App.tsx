import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { HashRouter, Routes, Route, Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

// ===================== UTILITIES =====================
export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export function convertBase(value: string, fromBase: number, toBase: number): string {
  const decimal = parseInt(value, fromBase)
  if (isNaN(decimal)) return 'Invalid input'
  return decimal.toString(toBase).toUpperCase()
}

export function conversionSteps(value: string, fromBase: number, toBase: number): string[] {
  const decimal = parseInt(value, fromBase)
  if (isNaN(decimal)) return ['Invalid input']
  const steps = [`1. Convert "${value}" from base ${fromBase} to decimal: ${decimal}`]
  if (toBase === 10) return steps
  let num = decimal
  let result = ''
  while (num > 0) {
    const remainder = num % toBase
    result = remainder.toString(toBase).toUpperCase() + result
    steps.push(`   ${num} / ${toBase} = ${Math.floor(num / toBase)} remainder ${remainder}`)
    num = Math.floor(num / toBase)
  }
  steps.push(`2. Result in base ${toBase}: ${result || '0'}`)
  return steps
}

// ===================== TOOL DEFINITIONS =====================
export const categories = [
  { title: 'Currency', slug: 'currency', icon: '💱', desc: 'Live rates, historical' },
  { title: 'Unit Converters', slug: 'unit', icon: '📏', desc: 'Length, weight, temp...' },
  { title: 'Number System', slug: 'number-system', icon: '🔢', desc: 'Binary, hex, base converter' },
  { title: 'Developer Tools', slug: 'developer', icon: '⚙️', desc: 'JSON, Base64, JWT...' },
  { title: 'Student Tools', slug: 'student', icon: '🎓', desc: 'GPA, BMI, scientific' }
]

export const allTools = [
  { name: 'Currency Converter', slug: 'currency', category: 'currency' },
  { name: 'Length Converter', slug: 'unit/length', category: 'unit' },
  { name: 'Weight Converter', slug: 'unit/weight', category: 'unit' },
  { name: 'Temperature Converter', slug: 'unit/temperature', category: 'unit' },
  { name: 'Area Converter', slug: 'unit/area', category: 'unit' },
  { name: 'Volume Converter', slug: 'unit/volume', category: 'unit' },
  { name: 'Time Converter', slug: 'unit/time', category: 'unit' },
  { name: 'Speed Converter', slug: 'unit/speed', category: 'unit' },
  { name: 'Pressure Converter', slug: 'unit/pressure', category: 'unit' },
  { name: 'Energy Converter', slug: 'unit/energy', category: 'unit' },
  { name: 'Data Storage Converter', slug: 'unit/data', category: 'unit' },
  { name: 'Binary ↔ Decimal', slug: 'number-system', category: 'number-system' },
  { name: 'Any Base Converter', slug: 'number-system', category: 'number-system' },
  { name: 'JSON Formatter', slug: 'developer', category: 'developer' },
  { name: 'Base64 Encode/Decode', slug: 'developer', category: 'developer' },
  { name: 'JWT Decoder', slug: 'developer', category: 'developer' },
  { name: 'UUID Generator', slug: 'developer', category: 'developer' },
  { name: 'Color Converter', slug: 'developer', category: 'developer' },
  { name: 'GPA Calculator', slug: 'student', category: 'student' },
  { name: 'BMI Calculator', slug: 'student', category: 'student' },
  { name: 'Percentage Calculator', slug: 'student', category: 'student' },
  { name: 'Scientific Calculator', slug: 'student', category: 'student' }
]

// ===================== UNIT DATA =====================
const unitData: Record<string, { units: string[]; conversion: (val: number, from: string, to: string) => number }> = {
  length: {
    units: ['Meter', 'Kilometer', 'Mile', 'Foot', 'Inch', 'Centimeter', 'Millimeter', 'Yard'],
    conversion: (val, from, to) => {
      const toMeter: Record<string, number> = { 
        Meter: 1, Kilometer: 1000, Mile: 1609.34, Foot: 0.3048, Inch: 0.0254,
        Centimeter: 0.01, Millimeter: 0.001, Yard: 0.9144
      }
      return val * toMeter[from] / toMeter[to]
    }
  },
  weight: {
    units: ['Kilogram', 'Gram', 'Pound', 'Ounce', 'Milligram', 'Ton'],
    conversion: (val, from, to) => {
      const toKg: Record<string, number> = { 
        Kilogram: 1, Gram: 0.001, Pound: 0.453592, Ounce: 0.0283495,
        Milligram: 0.000001, Ton: 1000
      }
      return val * toKg[from] / toKg[to]
    }
  },
  temperature: {
    units: ['Celsius', 'Fahrenheit', 'Kelvin'],
    conversion: (val, from, to) => {
      if (from === to) return val
      if (from === 'Celsius' && to === 'Fahrenheit') return val * 9/5 + 32
      if (from === 'Celsius' && to === 'Kelvin') return val + 273.15
      if (from === 'Fahrenheit' && to === 'Celsius') return (val - 32) * 5/9
      if (from === 'Fahrenheit' && to === 'Kelvin') return (val - 32) * 5/9 + 273.15
      if (from === 'Kelvin' && to === 'Celsius') return val - 273.15
      if (from === 'Kelvin' && to === 'Fahrenheit') return (val - 273.15) * 9/5 + 32
      return val
    }
  },
  area: {
    units: ['Square Meter', 'Square Kilometer', 'Square Mile', 'Square Foot', 'Acre', 'Hectare'],
    conversion: (val, from, to) => {
      const toSqMeter: Record<string, number> = {
        'Square Meter': 1,
        'Square Kilometer': 1000000,
        'Square Mile': 2589988.11,
        'Square Foot': 0.092903,
        'Acre': 4046.86,
        'Hectare': 10000
      }
      return val * toSqMeter[from] / toSqMeter[to]
    }
  },
  volume: {
    units: ['Liter', 'Milliliter', 'Cubic Meter', 'Gallon', 'Quart', 'Pint', 'Cup'],
    conversion: (val, from, to) => {
      const toLiter: Record<string, number> = {
        'Liter': 1,
        'Milliliter': 0.001,
        'Cubic Meter': 1000,
        'Gallon': 3.78541,
        'Quart': 0.946353,
        'Pint': 0.473176,
        'Cup': 0.236588
      }
      return val * toLiter[from] / toLiter[to]
    }
  },
  time: {
    units: ['Second', 'Minute', 'Hour', 'Day', 'Week', 'Month', 'Year'],
    conversion: (val, from, to) => {
      const toSecond: Record<string, number> = {
        'Second': 1,
        'Minute': 60,
        'Hour': 3600,
        'Day': 86400,
        'Week': 604800,
        'Month': 2592000,
        'Year': 31536000
      }
      return val * toSecond[from] / toSecond[to]
    }
  },
  speed: {
    units: ['Meter per Second', 'Kilometer per Hour', 'Mile per Hour', 'Knot', 'Foot per Second'],
    conversion: (val, from, to) => {
      const toMps: Record<string, number> = {
        'Meter per Second': 1,
        'Kilometer per Hour': 0.277778,
        'Mile per Hour': 0.44704,
        'Knot': 0.514444,
        'Foot per Second': 0.3048
      }
      return val * toMps[from] / toMps[to]
    }
  },
  pressure: {
    units: ['Pascal', 'Kilopascal', 'Bar', 'PSI', 'Atmosphere'],
    conversion: (val, from, to) => {
      const toPascal: Record<string, number> = {
        'Pascal': 1,
        'Kilopascal': 1000,
        'Bar': 100000,
        'PSI': 6894.76,
        'Atmosphere': 101325
      }
      return val * toPascal[from] / toPascal[to]
    }
  },
  energy: {
    units: ['Joule', 'Kilojoule', 'Calorie', 'Kilocalorie', 'Watt-hour', 'Kilowatt-hour'],
    conversion: (val, from, to) => {
      const toJoule: Record<string, number> = {
        'Joule': 1,
        'Kilojoule': 1000,
        'Calorie': 4.184,
        'Kilocalorie': 4184,
        'Watt-hour': 3600,
        'Kilowatt-hour': 3600000
      }
      return val * toJoule[from] / toJoule[to]
    }
  },
  data: {
    units: ['Byte', 'Kilobyte', 'Megabyte', 'Gigabyte', 'Terabyte', 'Petabyte'],
    conversion: (val, from, to) => {
      const toByte: Record<string, number> = {
        'Byte': 1,
        'Kilobyte': 1024,
        'Megabyte': 1048576,
        'Gigabyte': 1073741824,
        'Terabyte': 1099511627776,
        'Petabyte': 1125899906842624
      }
      return val * toByte[from] / toByte[to]
    }
  }
}

// ===================== CONTEXTS =====================
interface ThemeContextType {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}
const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggleTheme: () => {} })
export const useTheme = () => useContext(ThemeContext)

interface UserData {
  favorites: string[]
  recents: string[]
  addFavorite: (slug: string) => void
  removeFavorite: (slug: string) => void
  addRecent: (slug: string) => void
}
const UserDataContext = createContext<UserData>({
  favorites: [], recents: [],
  addFavorite: () => {}, removeFavorite: () => {}, addRecent: () => {}
})
export const useUserData = () => useContext(UserDataContext)

// ===================== HOOKS =====================
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debounced
}

function useCurrencyRates() {
  return useQuery({
    queryKey: ['rates'],
    queryFn: () => fetch('https://api.exchangerate-api.com/v4/latest/USD').then(r => r.json()),
    staleTime: 30 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000
  })
}

// ===================== REUSABLE COMPONENTS =====================
function AdsBanner() {
  return (
    <div className="my-6 p-4 glass rounded-2xl text-center text-gray-500 text-sm">
      <ins className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot="1234567890"
        data-ad-format="auto"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      <p className="mt-1">Advertisement</p>
    </div>
  )
}

function Toast({ message, show }: { message: string; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 glass px-6 py-3 rounded-xl z-50 shadow-lg text-sm font-medium"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ConversionResult({ label, value, copyable = true }: { label: string; value: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    if (copyable) {
      navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  return (
    <div className="glass p-4 rounded-xl flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-xl font-mono font-semibold">{value}</p>
      </div>
      {copyable && (
        <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-gray-800/40">
          {copied ? '✓' : '📋'}
        </button>
      )}
    </div>
  )
}

function ToolCard({ title, desc, icon, slug }: { title: string; desc: string; icon: string; slug: string }) {
  const { favorites, addFavorite, removeFavorite } = useUserData()
  const isFav = favorites.includes(slug)
  return (
    <motion.div whileHover={{ y: -4 }} className="glass p-6 rounded-2xl shadow-glass transition-all hover:shadow-xl">
      <div className="flex justify-between items-start mb-3">
        <span className="text-3xl">{icon}</span>
        <button
          onClick={(e) => { e.preventDefault(); isFav ? removeFavorite(slug) : addFavorite(slug) }}
          className={`p-1 rounded-full ${isFav ? 'text-red-500' : 'text-gray-400'} hover:bg-white/50 dark:hover:bg-gray-800/50`}
        >
          {isFav ? '❤️' : '🤍'}
        </button>
      </div>
      <Link to={`/${slug}`} className="block">
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
      </Link>
    </motion.div>
  )
}

function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 200)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  useEffect(() => { if (open) inputRef.current?.focus() }, [open])
  const results = debouncedQuery ? allTools.filter(t => t.name.toLowerCase().includes(debouncedQuery.toLowerCase())) : []
  const handleSelect = (slug: string) => { navigate(`/${slug}`); onClose(); setQuery('') }
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        >
          <motion.div
            className="glass w-full max-w-xl rounded-2xl p-6 shadow-2xl" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            onClick={e => e.stopPropagation()}
          >
            <input ref={inputRef} type="text" placeholder="Search tools... (Ctrl+K)" className="w-full bg-transparent text-lg outline-none" value={query} onChange={e => setQuery(e.target.value)} />
            {results.length > 0 && (
              <ul className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                {results.map(tool => (
                  <li key={tool.slug + tool.name} className="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-gray-800/40 cursor-pointer" onClick={() => handleSelect(tool.slug)}>{tool.name}</li>
                ))}
              </ul>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Breadcrumb() {
  const location = useLocation()
  const paths = location.pathname.split('/').filter(Boolean)
  if (paths.length === 0) return null
  return (
    <div className="container mx-auto px-4 py-3 text-sm text-gray-500">
      <Link to="/" className="hover:text-primary">Home</Link>
      {paths.map((p, i) => (
        <span key={i}> / <Link to={`/${paths.slice(0, i+1).join('/')}`} className="capitalize hover:text-primary">{p}</Link></span>
      ))}
    </div>
  )
}

// ===================== LAYOUT =====================
function Navbar({ onSearchOpen }: { onSearchOpen: () => void }) {
  const { theme, toggleTheme } = useTheme()
  return (
    <nav className="sticky top-0 z-40 glass border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="text-2xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">EasyunitEX</Link>
        <div className="flex items-center gap-4">
          <button onClick={onSearchOpen} className="p-2 rounded-xl glass hover:bg-white/50 dark:hover:bg-gray-800/50">🔍</button>
          <button onClick={toggleTheme} className="p-2 rounded-xl glass">{theme === 'light' ? '🌙' : '☀️'}</button>
        </div>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="glass border-t border-gray-200 dark:border-gray-800 mt-12 py-8">
      <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <h4 className="font-semibold mb-2">EasyunitEX</h4>
          <ul className="space-y-1">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/currency">Currency</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Tools</h4>
          <ul className="space-y-1">
            <li><Link to="/developer">Developer</Link></li>
            <li><Link to="/student">Student</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Legal</h4>
          <ul className="space-y-1">
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Terms</a></li>
          </ul>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">© 2026 EasyunitEX</p>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Developed by <span className="font-semibold text-primary">Ghost Network</span></p>
        </div>
      </div>
    </footer>
  )
}

function Layout() {
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(p => !p) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onSearchOpen={() => setSearchOpen(true)} />
      <Breadcrumb />
      <main className="flex-1 container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

// ===================== PAGES =====================
function HomePage() {
  const { recents } = useUserData()
  const recentTools = recents.map(slug => allTools.find(t => t.slug === slug)).filter(Boolean)
  return (
    <div className="space-y-16">
      <section className="text-center py-16">
        <motion.h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          All Your Converters & Developer Tools in One Place
        </motion.h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">Convert anything, format code, generate data – all from a beautiful, blazing-fast interface.</p>
        <Link to="/currency" className="inline-block bg-primary hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition">Start Converting</Link>
      </section>
      <AdsBanner />
      <section>
        <h2 className="text-2xl font-bold mb-6">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map(cat => <ToolCard key={cat.slug} title={cat.title} desc={cat.desc} icon={cat.icon} slug={cat.slug} />)}
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-bold mb-6">Popular Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allTools.slice(0, 8).map(tool => (
            <Link key={tool.slug + tool.name} to={`/${tool.slug}`} className="glass p-4 rounded-xl hover:shadow-lg transition flex items-center gap-2">
              <span className="text-sm font-medium">{tool.name}</span>
            </Link>
          ))}
        </div>
      </section>
      {recentTools.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Recently Used</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {recentTools.map(tool => tool && (
              <Link key={tool.slug} to={`/${tool.slug}`} className="glass min-w-[150px] p-4 rounded-xl text-center hover:shadow-lg transition">
                <p className="font-medium">{tool.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="text-center py-12 glass rounded-2xl">
        <h2 className="text-2xl font-bold mb-4">Ready to simplify your workflow?</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Developed by Ghost Network</p>
        <button className="bg-secondary hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-xl">Add to Home Screen</button>
      </section>
    </div>
  )
}

function CurrencyPage() {
  const { data, isLoading } = useCurrencyRates()
  const [amount, setAmount] = useState(1)
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('LKR')
  const [swapToast, setSwapToast] = useState(false)
  const { addRecent } = useUserData()
  useEffect(() => { addRecent('currency') }, [])

  if (isLoading) return <div className="text-center py-10">Loading live rates...</div>
  if (!data) return <div className="text-center py-10">Failed to load rates</div>

  const rates = data.rates
  const currencies = Object.keys(rates)
  const converted = amount * (rates[to] / rates[from])

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Currency Converter</h1>
      <div className="glass p-6 rounded-2xl space-y-4">
        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full bg-transparent text-2xl outline-none p-2 border-b border-gray-300 dark:border-gray-700" />
        <div className="flex gap-4 items-center">
          <select value={from} onChange={e => setFrom(e.target.value)} className="bg-transparent p-2 rounded-xl border">
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => { setFrom(to); setTo(from); setSwapToast(true); setTimeout(() => setSwapToast(false), 2000) }} className="text-2xl">⇄</button>
          <select value={to} onChange={e => setTo(e.target.value)} className="bg-transparent p-2 rounded-xl border">
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      
      {/* New display format */}
      <div className="glass p-4 rounded-xl flex items-center justify-between">
        <div>
          <p className="text-2xl font-mono font-semibold">{amount} {from}</p>
        </div>
        <div className="text-2xl">→</div>
        <div>
          <p className="text-2xl font-mono font-semibold text-primary">{converted.toFixed(4)} {to}</p>
        </div>
        <button 
          onClick={() => navigator.clipboard.writeText(`${converted.toFixed(4)} ${to}`)} 
          className="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-gray-800/40"
        >
          📋
        </button>
      </div>
      
      <div className="glass p-6 rounded-2xl">
        <h2 className="text-lg font-semibold mb-4">Exchange Rate Trend</h2>
        <Line data={{ labels: ['Jan','Feb','Mar','Apr','May'], datasets: [{ label: `${from}/${to}`, data: [converted*0.9, converted*1.1, converted, converted*0.95, converted*1.05], borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.2)' }] }} />
      </div>
      <AdsBanner />
      <Toast message="Currencies swapped!" show={swapToast} />
    </div>
  )
}

// ===================== UNIT CATEGORY PAGE (ALL CONVERTERS IN ONE PLACE) =====================
function UnitCategoryPage() {
  const { addRecent } = useUserData()
  const [selectedCategory, setSelectedCategory] = useState('length')
  const [value, setValue] = useState(1)
  const [fromUnit, setFromUnit] = useState('Meter')
  const [toUnit, setToUnit] = useState('Kilometer')
  
  useEffect(() => { addRecent('unit') }, [])
  
  const unitCategories = [
    { name: 'Length', slug: 'length', icon: '📏', desc: 'Meter, Kilometer, Mile, Foot, Inch...' },
    { name: 'Weight', slug: 'weight', icon: '⚖️', desc: 'Kilogram, Gram, Pound, Ounce...' },
    { name: 'Temperature', slug: 'temperature', icon: '🌡️', desc: 'Celsius, Fahrenheit, Kelvin...' },
    { name: 'Area', slug: 'area', icon: '📐', desc: 'Square Meter, Acre, Hectare...' },
    { name: 'Volume', slug: 'volume', icon: '🧪', desc: 'Liter, Gallon, Cubic Meter...' },
    { name: 'Time', slug: 'time', icon: '⏰', desc: 'Second, Minute, Hour, Day...' },
    { name: 'Speed', slug: 'speed', icon: '🚀', desc: 'MPS, KPH, MPH, Knot...' },
    { name: 'Pressure', slug: 'pressure', icon: '💨', desc: 'Pascal, Bar, PSI...' },
    { name: 'Energy', slug: 'energy', icon: '⚡', desc: 'Joule, Calorie, Watt-hour...' },
    { name: 'Data Storage', slug: 'data', icon: '💾', desc: 'Byte, KB, MB, GB, TB...' }
  ]
  
  const currentCategory = unitCategories.find(cat => cat.slug === selectedCategory) || unitCategories[0]
  const defs = unitData[selectedCategory] || unitData.length
  
  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug)
    const newDefs = unitData[slug] || unitData.length
    setFromUnit(newDefs.units[0])
    setToUnit(newDefs.units[1])
    setValue(1)
  }
  
  const result = defs.conversion(value, fromUnit, toUnit)
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Unit Converters</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Select a converter type below</p>
      </div>
      
      {/* Converter Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {unitCategories.map(unit => (
          <button
            key={unit.slug}
            onClick={() => handleCategoryChange(unit.slug)}
            className={`p-4 rounded-xl transition-all ${
              selectedCategory === unit.slug
                ? 'bg-primary text-white shadow-lg'
                : 'glass hover:shadow-md'
            }`}
          >
            <div className="text-2xl mb-2">{unit.icon}</div>
            <div className="text-sm font-semibold">{unit.name}</div>
          </button>
        ))}
      </div>
      
      {/* Active Converter */}
      <div className="glass p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{currentCategory.icon}</span>
          <div>
            <h2 className="text-2xl font-bold">{currentCategory.name} Converter</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{currentCategory.desc}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <input 
            type="number" 
            value={value} 
            onChange={e => setValue(Number(e.target.value))} 
            className="w-full bg-transparent text-2xl outline-none p-2 border-b border-gray-300 dark:border-gray-700" 
            placeholder="Enter value"
          />
          
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <label className="block text-sm mb-2 text-gray-500">From</label>
              <select 
                value={fromUnit} 
                onChange={e => setFromUnit(e.target.value)} 
                className="w-full bg-transparent p-3 rounded-xl border dark:border-gray-700"
              >
                {defs.units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            
            <button 
              onClick={() => { setFromUnit(toUnit); setToUnit(fromUnit) }}
              className="mt-6 md:mt-6 text-2xl hover:scale-125 transition"
              title="Swap units"
            >
              ⇄
            </button>
            
            <div className="flex-1 w-full">
              <label className="block text-sm mb-2 text-gray-500">To</label>
              <select 
                value={toUnit} 
                onChange={e => setToUnit(e.target.value)} 
                className="w-full bg-transparent p-3 rounded-xl border dark:border-gray-700"
              >
                {defs.units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          
          {/* New display format: 1 Inch → 2.5400 Centimeter */}
          <div className="mt-6 glass p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-2xl font-mono font-semibold">{value} {fromUnit}</p>
            </div>
            <div className="text-2xl">→</div>
            <div>
              <p className="text-2xl font-mono font-semibold text-primary">{result.toFixed(4)} {toUnit}</p>
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(`${result.toFixed(4)} ${toUnit}`)} 
              className="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-gray-800/40"
            >
              📋
            </button>
          </div>
        </div>
      </div>
      
      {/* All Converters Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">All Available Converters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {unitCategories.map(unit => (
            <button
              key={unit.slug}
              onClick={() => handleCategoryChange(unit.slug)}
              className={`p-4 rounded-xl text-left transition-all hover:-translate-y-1 ${
                selectedCategory === unit.slug
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'glass hover:shadow-lg'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{unit.icon}</span>
                <div>
                  <h3 className="font-semibold mb-1">{unit.name} Converter</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{unit.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Individual Unit Page (for direct URL access)
function UnitPage() {
  const { category } = useParams<{ category: string }>()
  const cat = category || 'length'
  const defs = unitData[cat] || unitData.length
  const [value, setValue] = useState(1)
  const [fromUnit, setFromUnit] = useState(defs.units[0])
  const [toUnit, setToUnit] = useState(defs.units[1])
  const { addRecent } = useUserData()
  useEffect(() => { addRecent(`unit/${cat}`) }, [cat])

  const result = defs.conversion(value, fromUnit, toUnit)

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold capitalize">{cat} Converter</h1>
      <div className="glass p-6 rounded-2xl space-y-4">
        <input type="number" value={value} onChange={e => setValue(Number(e.target.value))} className="w-full bg-transparent text-2xl outline-none p-2 border-b border-gray-300 dark:border-gray-700" />
        <div className="flex gap-4 items-center">
          <select value={fromUnit} onChange={e => setFromUnit(e.target.value)} className="bg-transparent p-2 rounded-xl border">
            {defs.units.map(u => <option key={u}>{u}</option>)}
          </select>
          <span>→</span>
          <select value={toUnit} onChange={e => setToUnit(e.target.value)} className="bg-transparent p-2 rounded-xl border">
            {defs.units.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>
      
      {/* New display format */}
      <div className="glass p-4 rounded-xl flex items-center justify-between">
        <div>
          <p className="text-2xl font-mono font-semibold">{value} {fromUnit}</p>
        </div>
        <div className="text-2xl">→</div>
        <div>
          <p className="text-2xl font-mono font-semibold text-primary">{result.toFixed(4)} {toUnit}</p>
        </div>
        <button 
          onClick={() => navigator.clipboard.writeText(`${result.toFixed(4)} ${toUnit}`)} 
          className="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-gray-800/40"
        >
          📋
        </button>
      </div>
    </div>
  )
}

function NumberSystemPage() {
  const [input, setInput] = useState('42')
  const [fromBase, setFromBase] = useState(10)
  const [toBase, setToBase] = useState(2)
  const { addRecent } = useUserData()
  useEffect(() => { addRecent('number-system') }, [])

  const result = convertBase(input, fromBase, toBase)
  const steps = conversionSteps(input, fromBase, toBase)

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Number System Converter</h1>
      <div className="glass p-6 rounded-2xl space-y-4">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Enter number" className="w-full bg-transparent text-2xl outline-none p-2 border-b font-mono" />
        <div className="flex gap-4 items-center">
          <div><label>From Base</label><select value={fromBase} onChange={e => setFromBase(+e.target.value)} className="w-full bg-transparent p-2 rounded-xl border">{Array.from({length:35},(_,i)=>i+2).map(b=><option key={b}>{b}</option>)}</select></div>
          <span>→</span>
          <div><label>To Base</label><select value={toBase} onChange={e => setToBase(+e.target.value)} className="w-full bg-transparent p-2 rounded-xl border">{Array.from({length:35},(_,i)=>i+2).map(b=><option key={b}>{b}</option>)}</select></div>
        </div>
      </div>
      <ConversionResult label={`Base ${fromBase}`} value={input} />
      <ConversionResult label={`Base ${toBase}`} value={result} />
      {steps.length > 0 && (
        <div className="glass p-6 rounded-2xl">
          <h3 className="font-semibold mb-2">Conversion Steps</h3>
          <pre className="text-sm whitespace-pre-wrap">{steps.join('\n')}</pre>
        </div>
      )}
    </div>
  )
}

function DeveloperPage() {
  const [tab, setTab] = useState('json')
  const { addRecent } = useUserData()
  useEffect(() => { addRecent('developer') }, [])
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Developer Tools</h1>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {['json','base64','jwt','uuid','color'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl capitalize ${tab===t ? 'bg-primary text-white' : 'glass'}`}>{t}</button>
        ))}
      </div>
      <div className="glass p-6 rounded-2xl">
        {tab==='json' && <JsonTool />}
        {tab==='base64' && <Base64Tool />}
        {tab==='jwt' && <JwtTool />}
        {tab==='uuid' && <UuidTool />}
        {tab==='color' && <ColorTool />}
      </div>
    </div>
  )
}

function JsonTool() {
  const [input, setInput] = useState('{"hello":"world"}')
  const [output, setOutput] = useState('')
  return (
    <div>
      <textarea className="w-full h-32 bg-transparent border rounded-xl p-3 font-mono" value={input} onChange={e=>setInput(e.target.value)} />
      <button onClick={() => { try { setOutput(JSON.stringify(JSON.parse(input), null, 2)) } catch { setOutput('Invalid JSON') }}} className="mt-3 bg-primary text-white px-4 py-2 rounded-xl">Format</button>
      {output && <pre className="mt-4 p-3 glass rounded-xl">{output}</pre>}
    </div>
  )
}

function Base64Tool() {
  const [text, setText] = useState('Hello')
  const [decodedText, setDecodedText] = useState('')
  const encoded = btoa(text)
  
  const handleDecode = () => {
    try {
      setDecodedText(atob(text))
    } catch {
      setDecodedText('Invalid Base64 input')
    }
  }
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm mb-2 font-medium">Input Text (Encode or Decode)</label>
        <input 
          className="w-full bg-transparent border rounded-xl p-3 font-mono" 
          value={text} 
          onChange={e => setText(e.target.value)} 
          placeholder="Enter text to encode or Base64 to decode"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2 font-medium">Encoded (Base64)</label>
          <ConversionResult label="Encoded" value={encoded} />
        </div>
        <div className="space-y-2">
          <label className="block text-sm mb-2 font-medium">Decode Base64</label>
          <button 
            onClick={handleDecode} 
            className="bg-primary text-white px-4 py-2 rounded-xl"
          >
            Decode
          </button>
          {decodedText && <ConversionResult label="Decoded" value={decodedText} />}
        </div>
      </div>
    </div>
  )
}

function JwtTool() {
  const [jwt, setJwt] = useState('')
  const [header, setHeader] = useState('')
  const [payload, setPayload] = useState('')
  const decode = () => { try { const parts = jwt.split('.'); setHeader(JSON.stringify(JSON.parse(atob(parts[0])), null, 2)); setPayload(JSON.stringify(JSON.parse(atob(parts[1])), null, 2)) } catch { setPayload('Invalid') } }
  return <div><input className="w-full bg-transparent border-b p-2" value={jwt} onChange={e=>setJwt(e.target.value)} placeholder="Paste JWT" /><button onClick={decode} className="mt-3 bg-primary text-white px-4 py-2 rounded-xl">Decode</button>{payload && <pre className="mt-4 p-3 glass rounded-xl">{header}{'\n'}{payload}</pre>}</div>
}

function UuidTool() {
  const [uuid, setUuid] = useState('')
  return <div className="text-center"><button onClick={()=>setUuid(crypto.randomUUID())} className="bg-primary text-white px-6 py-3 rounded-xl">Generate UUID</button>{uuid && <ConversionResult label="UUID" value={uuid} />}</div>
}

function ColorTool() {
  const [hex, setHex] = useState('#2563EB')
  const [rgb, setRgb] = useState('')
  const convert = () => { const r = parseInt(hex.slice(1,3),16); const g = parseInt(hex.slice(3,5),16); const b = parseInt(hex.slice(5,7),16); setRgb(`rgb(${r}, ${g}, ${b})`) }
  return <div><input className="w-full bg-transparent border-b p-2" value={hex} onChange={e=>setHex(e.target.value)} /><button onClick={convert} className="mt-3 bg-primary text-white px-4 py-2 rounded-xl">Convert</button>{rgb && <ConversionResult label="RGB" value={rgb} />}</div>
}

function StudentPage() {
  const [tab, setTab] = useState('gpa')
  const { addRecent } = useUserData()
  useEffect(() => { addRecent('student') }, [])
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Student Tools</h1>
      <div className="flex gap-4 overflow-x-auto">
        {['gpa','bmi','percentage','scientific'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl capitalize ${tab===t?'bg-primary text-white':'glass'}`}>{t}</button>
        ))}
      </div>
      <div className="glass p-6 rounded-2xl">
        {tab==='gpa' && <GpaCalc />}
        {tab==='bmi' && <BmiCalc />}
        {tab==='percentage' && <PercentageCalc />}
        {tab==='scientific' && <ScientificCalc />}
      </div>
    </div>
  )
}

function GpaCalc() {
  const [courses, setCourses] = useState([{credit:3, grade:'A'}])
  const gpa = courses.reduce((a,c) => a + (c.grade==='A'?4:c.grade==='B'?3:2) * c.credit, 0) / courses.reduce((a,c) => a + c.credit, 0) || 0
  return (
    <div>
      {courses.map((c, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input type="number" value={c.credit} onChange={e=>{ const n=[...courses]; n[i].credit=+e.target.value; setCourses(n) }} className="w-20 bg-transparent border rounded px-2" />
          <select value={c.grade} onChange={e=>{ const n=[...courses]; n[i].grade=e.target.value; setCourses(n) }} className="bg-transparent border rounded px-2"><option>A</option><option>B</option><option>C</option></select>
        </div>
      ))}
      <button onClick={() => setCourses([...courses, {credit:3, grade:'A'}])} className="text-primary">+ Add course</button>
      <p className="mt-4 text-xl font-bold">GPA: {gpa.toFixed(2)}</p>
    </div>
  )
}
function BmiCalc() {
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(1.75)
  return <div className="space-y-4"><input type="number" value={weight} onChange={e=>setWeight(+e.target.value)} placeholder="Weight (kg)" className="w-full bg-transparent border-b p-2" /><input type="number" value={height} onChange={e=>setHeight(+e.target.value)} placeholder="Height (m)" className="w-full bg-transparent border-b p-2" /><p className="text-xl font-bold">BMI: {(weight/(height*height)).toFixed(1)}</p></div>
}
function PercentageCalc() {
  const [val, setVal] = useState(50)
  const [total, setTotal] = useState(200)
  return <div className="space-y-4"><input type="number" value={val} onChange={e=>setVal(+e.target.value)} className="w-full bg-transparent border-b p-2" /><input type="number" value={total} onChange={e=>setTotal(+e.target.value)} className="w-full bg-transparent border-b p-2" /><p className="text-xl font-bold">{(val/total*100).toFixed(2)}%</p></div>
}
function ScientificCalc() {
  const [expr, setExpr] = useState('')
  const [result, setResult] = useState('')
  return <div><input value={expr} onChange={e=>setExpr(e.target.value)} className="w-full bg-transparent border-b p-2" placeholder="e.g., Math.sin(Math.PI/2)" /><button onClick={()=>{ try { setResult(eval(expr).toString()) } catch { setResult('Error') }}} className="mt-3 bg-primary text-white px-4 py-2 rounded-xl">Calculate</button><p className="mt-4 text-xl">{result}</p></div>
}

function NotFound() {
  return <div className="text-center py-20"><h1 className="text-6xl font-bold text-gray-300">404</h1><p className="text-xl mt-4">Page not found</p><Link to="/" className="mt-6 inline-block bg-primary text-white px-6 py-3 rounded-xl">Go Home</Link></div>
}

// ===================== APP (with providers) =====================
export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (saved) setTheme(saved)
  }, [])
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')

  const [favorites, setFavorites] = useState<string[]>(() => JSON.parse(localStorage.getItem('favorites') || '[]'))
  const [recents, setRecents] = useState<string[]>(() => JSON.parse(localStorage.getItem('recents') || '[]'))
  useEffect(() => { localStorage.setItem('favorites', JSON.stringify(favorites)) }, [favorites])
  useEffect(() => { localStorage.setItem('recents', JSON.stringify(recents)) }, [recents])
  const addFavorite = (slug: string) => setFavorites(prev => [...new Set([...prev, slug])])
  const removeFavorite = (slug: string) => setFavorites(prev => prev.filter(s => s !== slug))
  const addRecent = (slug: string) => setRecents(prev => [slug, ...prev.filter(s => s !== slug)].slice(0, 10))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <UserDataContext.Provider value={{ favorites, recents, addFavorite, removeFavorite, addRecent }}>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="currency" element={<CurrencyPage />} />
              <Route path="unit" element={<UnitCategoryPage />} />
              <Route path="unit/:category" element={<UnitPage />} />
              <Route path="number-system" element={<NumberSystemPage />} />
              <Route path="developer" element={<DeveloperPage />} />
              <Route path="student" element={<StudentPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </HashRouter>
      </UserDataContext.Provider>
    </ThemeContext.Provider>
  )
}
