import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { HashRouter, Routes, Route, Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Line } from 'react-chartjs-2'
import * as math from 'mathjs'
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
  { title: 'Unit Converters', slug: 'unit', icon: '📏', desc: 'Comprehensive unit library' },
  { title: 'Number System', slug: 'number-system', icon: '🔢', desc: 'Binary, hex, base converter' },
  { title: 'Developer Tools', slug: 'developer', icon: '⚙️', desc: 'JSON, Base64, JWT...' },
  { title: 'Student Tools', slug: 'student', icon: '🎓', desc: 'GPA, BMI, scientific' },
  { title: 'Calculator', slug: 'calculator', icon: '🧮', desc: 'Normal & Scientific calc' }
]

export const allTools = [
  { name: 'Currency Converter', slug: 'currency', category: 'common' },
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
  { name: 'Scientific Calculator', slug: 'student', category: 'student' },
  // Common
  { name: 'Volume - Dry Converter', slug: 'unit/volume-dry', category: 'unit' },
  // General
  { name: 'Case Converter', slug: 'unit/case', category: 'unit' },
  { name: 'Power Converter', slug: 'unit/power', category: 'unit' },
  { name: 'Force Converter', slug: 'unit/force', category: 'unit' },
  { name: 'Angle Converter', slug: 'unit/angle', category: 'unit' },
  { name: 'Fuel Consumption Converter', slug: 'unit/fuel-consumption', category: 'unit' },
  { name: 'Numbers Converter', slug: 'unit/numbers', category: 'unit' },
  // Engineering
  { name: 'Angular Velocity Converter', slug: 'unit/velocity-angular', category: 'unit' },
  { name: 'Acceleration Converter', slug: 'unit/acceleration', category: 'unit' },
  { name: 'Density Converter', slug: 'unit/density', category: 'unit' },
  { name: 'Torque Converter', slug: 'unit/torque', category: 'unit' },
  // Fluids/Heat
  { name: 'Flow Converter', slug: 'unit/flow', category: 'unit' },
  // Electricity
  { name: 'Current Converter', slug: 'unit/current', category: 'unit' },
  { name: 'Resistance Converter', slug: 'unit/resistance', category: 'unit' },
  { name: 'Voltage Converter', slug: 'unit/voltage', category: 'unit' },
  { name: 'Calculator', slug: 'calculator', category: 'calculator' }
]

// ===================== UNIT DATA =====================
const linearConv = (factors: Record<string, number>) => (val: number, from: string, to: string) => val * factors[from] / factors[to];

const unitData: Record<string, { units: string[]; conversion: (val: number, from: string, to: string) => number }> = {
  length: {
    units: ['Meter', 'Kilometer', 'Mile', 'Foot', 'Inch', 'Centimeter', 'Millimeter', 'Yard'],
    conversion: linearConv({ Meter: 1, Kilometer: 1000, Mile: 1609.34, Foot: 0.3048, Inch: 0.0254, Centimeter: 0.01, Millimeter: 0.001, Yard: 0.9144 })
  },
  weight: {
    units: ['Kilogram', 'Gram', 'Pound', 'Ounce', 'Milligram', 'Ton'],
    conversion: linearConv({ Kilogram: 1, Gram: 0.001, Pound: 0.453592, Ounce: 0.0283495, Milligram: 0.000001, Ton: 1000 })
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
    conversion: linearConv({ 'Square Meter': 1, 'Square Kilometer': 1000000, 'Square Mile': 2589988.11, 'Square Foot': 0.092903, 'Acre': 4046.86, 'Hectare': 10000 })
  },
  volume: {
    units: ['Liter', 'Milliliter', 'Cubic Meter', 'Gallon', 'Quart', 'Pint', 'Cup'],
    conversion: linearConv({ 'Liter': 1, 'Milliliter': 0.001, 'Cubic Meter': 1000, 'Gallon': 3.78541, 'Quart': 0.946353, 'Pint': 0.473176, 'Cup': 0.236588 })
  },
  'volume-dry': {
    units: ['Bushel (US)', 'Peck (US)', 'Dry Gallon (US)', 'Liter'],
    conversion: linearConv({ 'Bushel (US)': 35.2391, 'Peck (US)': 8.8098, 'Dry Gallon (US)': 4.4049, 'Liter': 1 })
  },
  time: {
    units: ['Second', 'Minute', 'Hour', 'Day', 'Week', 'Month', 'Year'],
    conversion: linearConv({ 'Second': 1, 'Minute': 60, 'Hour': 3600, 'Day': 86400, 'Week': 604800, 'Month': 2592000, 'Year': 31536000 })
  },
  speed: {
    units: ['Meter per Second', 'Kilometer per Hour', 'Mile per Hour', 'Knot', 'Foot per Second'],
    conversion: linearConv({ 'Meter per Second': 1, 'Kilometer per Hour': 0.277778, 'Mile per Hour': 0.44704, 'Knot': 0.514444, 'Foot per Second': 0.3048 })
  },
  pressure: {
    units: ['Pascal', 'Kilopascal', 'Bar', 'PSI', 'Atmosphere'],
    conversion: linearConv({ 'Pascal': 1, 'Kilopascal': 1000, 'Bar': 100000, 'PSI': 6894.76, 'Atmosphere': 101325 })
  },
  energy: {
    units: ['Joule', 'Kilojoule', 'Calorie', 'Kilocalorie', 'Watt-hour', 'Kilowatt-hour'],
    conversion: linearConv({ 'Joule': 1, 'Kilojoule': 1000, 'Calorie': 4.184, 'Kilocalorie': 4184, 'Watt-hour': 3600, 'Kilowatt-hour': 3600000 })
  },
  data: {
    units: ['Byte', 'Kilobyte', 'Megabyte', 'Gigabyte', 'Terabyte', 'Petabyte'],
    conversion: linearConv({ 'Byte': 1, 'Kilobyte': 1024, 'Megabyte': 1048576, 'Gigabyte': 1073741824, 'Terabyte': 1099511627776, 'Petabyte': 1125899906842624 })
  },
  power: {
    units: ['Watt', 'Kilowatt', 'Horsepower', 'BTU/hr'],
    conversion: linearConv({ Watt: 1, Kilowatt: 1000, Horsepower: 745.7, 'BTU/hr': 0.293071 })
  },
  force: {
    units: ['Newton', 'Kilonewton', 'Pound-force', 'Dyne'],
    conversion: linearConv({ Newton: 1, Kilonewton: 1000, 'Pound-force': 4.44822, Dyne: 0.00001 })
  },
  angle: {
    units: ['Degree', 'Radian', 'Gradian', 'Arcminute', 'Arcsecond'],
    conversion: linearConv({ Degree: 1, Radian: 57.2958, Gradian: 0.9, Arcminute: 1/60, Arcsecond: 1/3600 })
  },
  'fuel-consumption': {
    units: ['L/100km', 'km/L', 'MPG (US)', 'MPG (UK)'],
    conversion: (val, from, to) => {
      if (from === to) return val
      let l100 = 0
      if (from === 'L/100km') l100 = val
      else if (from === 'km/L') l100 = 100 / val
      else if (from === 'MPG (US)') l100 = 235.215 / val
      else if (from === 'MPG (UK)') l100 = 282.481 / val

      if (to === 'L/100km') return l100
      if (to === 'km/L') return 100 / l100
      if (to === 'MPG (US)') return 235.215 / l100
      if (to === 'MPG (UK)') return 282.481 / l100
      return val
    }
  },
  numbers: {
    units: ['Decimal', 'Binary', 'Hexadecimal', 'Octal'],
    conversion: (val, from, to) => val
  },
  'velocity-angular': {
    units: ['rad/s', 'deg/s', 'rpm'],
    conversion: linearConv({ 'rad/s': 1, 'deg/s': 0.0174533, 'rpm': 0.10472 })
  },
  acceleration: {
    units: ['m/s²', 'g', 'km/h²'],
    conversion: linearConv({ 'm/s²': 1, 'g': 9.80665, 'km/h²': 7.716e-8 })
  },
  density: {
    units: ['kg/m³', 'g/cm³', 'lb/ft³', 'lb/in³'],
    conversion: linearConv({ 'kg/m³': 1, 'g/cm³': 1000, 'lb/ft³': 16.0185, 'lb/in³': 27679.9 })
  },
  torque: {
    units: ['N·m', 'lb·ft', 'lb·in'],
    conversion: linearConv({ 'N·m': 1, 'lb·ft': 1.35582, 'lb·in': 0.112985 })
  },
  flow: {
    units: ['m³/s', 'L/s', 'L/min', 'm³/h'],
    conversion: linearConv({ 'm³/s': 1, 'L/s': 0.001, 'L/min': 0.001 / 60, 'm³/h': 1 / 3600 })
  },
  current: {
    units: ['Ampere', 'milliAmpere', 'microAmpere'],
    conversion: linearConv({ Ampere: 1, milliAmpere: 0.001, microAmpere: 0.000001 })
  },
  resistance: {
    units: ['Ohm', 'kiloOhm', 'megaOhm', 'milliOhm'],
    conversion: linearConv({ Ohm: 1, kiloOhm: 1000, megaOhm: 1000000, milliOhm: 0.001 })
  },
  voltage: {
    units: ['Volt', 'milliVolt', 'kiloVolt'],
    conversion: linearConv({ Volt: 1, milliVolt: 0.001, kiloVolt: 1000 })
  }
}

// ===================== CONTEXTS =====================
interface ThemeContextType {
  theme: string
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

// ===================== AD BANNER (468x60) =====================
function AdsBanner() {
  const adContainerRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const container = adContainerRef.current
    if (container && !container.innerHTML.trim()) {
      const optionsScript = document.createElement('script')
      optionsScript.textContent = `
        atOptions = {
          'key' : '80f541a56a93d9670e591d571fa7c1f3',
          'format' : 'iframe',
          'height' : 60,
          'width' : 468,
          'params' : {}
        };
      `
      const invokeScript = document.createElement('script')
      invokeScript.src = 'https://www.highperformanceformat.com/80f541a56a93d9670e591d571fa7c1f3/invoke.js'
      invokeScript.async = true
      
      container.appendChild(optionsScript)
      container.appendChild(invokeScript)
    }
  }, [])
  
  return (
    <div className="w-full max-w-lg mx-auto my-4 px-4">
      <div className="glass rounded-2xl p-3">
        <div className="text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Advertisement</p>
          <div ref={adContainerRef} className="flex items-center justify-center min-h-[60px] min-w-[468px] overflow-hidden">
            {/* Ad loads dynamically */}
          </div>
        </div>
      </div>
    </div>
  )
}

// ===================== WELCOME POPUP =====================
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
    <motion.div whileHover={{ y: -4 }} className="glass p-4 rounded-2xl shadow-glass transition-all hover:shadow-xl">
      <div className="flex justify-between items-start mb-2">
        <span className="text-2xl">{icon}</span>
        <button
          onClick={(e) => { e.preventDefault(); isFav ? removeFavorite(slug) : addFavorite(slug) }}
          className={`p-1 rounded-full ${isFav ? 'text-red-500' : 'text-gray-400'} hover:bg-white/50 dark:hover:bg-gray-800/50`}
        >
          {isFav ? '❤️' : '🤍'}
        </button>
      </div>
      <Link to={`/${slug}`} className="block">
        <h3 className="text-base font-semibold mb-1">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
      </Link>
    </motion.div>
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

  const themeIcons: Record<string, string> = {
    'light': '☀️',
    'dark': '🌙',
    'theme-ocean': '🌊',
    'theme-forest': '🌲',
    'theme-sunset': '🌇'
  }

  return (
    <nav className="sticky top-0 z-40 glass border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="text-2xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">EasyunitEX</Link>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl glass hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-300 active:scale-90"
            title="Toggle Theme"
          >
            <span className="text-xl transition-all duration-500 transform hover:rotate-12">
              {themeIcons[theme] || '☀️'}
            </span>
          </button>
        </div>
      </div>
    </nav>
  )
}

function DonationBox() {
  const [copied, setCopied] = useState(false)
  const walletAddress = 'bc1qjnh5ffwp64yklvf76jfem0takn5ulfsdrsn0me'

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="glass p-4 rounded-2xl flex flex-col items-center gap-3 max-w-md mx-auto w-full border border-primary/20">
      <div className="flex items-center gap-2">
        <span className="text-xl">₿</span>
        <h4 className="font-semibold">Support EasyunitEX</h4>
      </div>
      <div className="flex items-center gap-2 w-full bg-black/5 dark:bg-white/5 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
        <code className="flex-1 text-xs truncate font-mono">{walletAddress}</code>
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-gray-800/40 transition-colors"
          title="Copy Wallet Address"
        >
          {copied ? '✅' : '📋'}
        </button>
      </div>
      <p className="text-[10px] text-gray-500">Your donations help keep this tool free !</p>
    </div>
  )
}

function Footer() {
  return (
    <footer className="glass border-t border-gray-200 dark:border-gray-800 mt-8 py-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
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
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">© 2026 EasyunitEX</p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Developed by <span className="font-semibold text-primary">Ghost Network</span></p>
          </div>
        </div>
      </div>
    </footer>
  )
}

function Layout() {
  const location = useLocation()
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onSearchOpen={() => {}} />
      <Breadcrumb />

      {/* Banner Ad - Shows on every page */}
      <AdsBanner />

      <main className="flex-1 container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}

function CommonToolsPage() {
  const { addRecent } = useUserData()
  useEffect(() => { addRecent('common') }, [])
  const commonTools = allTools.filter(t => t.category === 'common')

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-extrabold mb-2">Common Tools</h1>
        <p className="text-gray-600 dark:text-gray-400">Quick access to our most popular and frequently used converters</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {commonTools.map(tool => (
          <Link key={tool.slug} to={`/${tool.slug}`} className="glass p-6 rounded-2xl hover:shadow-xl transition-all group border-2 border-transparent hover:border-primary/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors text-2xl">🌟</div>
              <div>
                <h3 className="text-lg font-bold">{tool.name}</h3>
                <p className="text-sm text-gray-500">Click to open converter</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function HomePage() {
  const { recents } = useUserData()
  const recentTools = recents.map(slug => allTools.find(t => t.slug === slug)).filter(Boolean)
  return (
    <div className="space-y-16">
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Main Converter</h2>
          <p className="text-gray-500">Quickly switch categories and convert units instantly</p>
        </div>
        <MainConverter />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map(cat => <ToolCard key={cat.slug} title={cat.title} desc={cat.desc} icon={cat.icon} slug={cat.slug} />)}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">Popular Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allTools.filter(tool => tool.category === 'unit' || tool.name.toLowerCase().includes('converter')).map(tool => (
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

      <section className="flex justify-center">
        <DonationBox />
      </section>

    </div>
  )
}

function CurrencyPage() {
  const { data, isLoading } = useCurrencyRates()
  const [amount, setAmount] = useState('1')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('LKR')
  const [swapToast, setSwapToast] = useState(false)
  const { addRecent } = useUserData()
  useEffect(() => { addRecent('currency') }, [])

  if (isLoading) return <div className="text-center py-10">Loading live rates...</div>
  if (!data) return <div className="text-center py-10">Failed to load rates</div>

  const rates = data.rates
  const currencies = Object.keys(rates)
  const converted = Number(amount) * (rates[to] / rates[from])

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Currency Converter</h1>
      <div className="glass p-6 rounded-2xl space-y-4">
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-transparent text-2xl outline-none p-2 border-b border-gray-300 dark:border-gray-700" />
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
      <Toast message="Currencies swapped!" show={swapToast} />
    </div>
  )
}

// ===================== UNIT CATEGORY PAGE =====================
const CONVERTER_GROUPS = [
  { title: 'Common Converters', tools: [
    { name: 'Length', slug: 'length', icon: '📏' },
    { name: 'Weight', slug: 'weight', icon: '⚖️' },
    { name: 'Temperature', slug: 'temperature', icon: '🌡️' },
    { name: 'Area', slug: 'area', icon: '📐' },
    { name: 'Volume', slug: 'volume', icon: '🧪' },
    { name: 'Time', slug: 'time', icon: '⏰' },
    { name: 'Speed', slug: 'speed', icon: '🚀' },
    { name: 'Pressure', slug: 'pressure', icon: '💨' },
    { name: 'Energy', slug: 'energy', icon: '⚡' },
    { name: 'Volume (Dry)', slug: 'volume-dry', icon: '🌾' },
  ]},
  { title: 'General & Engineering', tools: [
    { name: 'Power', slug: 'power', icon: '🔌' },
    { name: 'Force', slug: 'force', icon: '🔨' },
    { name: 'Angle', slug: 'angle', icon: '📐' },
    { name: 'Fuel Consumption', slug: 'fuel-consumption', icon: '⛽' },
    { name: 'Numbers', slug: 'numbers', icon: '🔢' },
    { name: 'Data Storage', slug: 'data', icon: '💾' },
    { name: 'Angular Velocity', slug: 'velocity-angular', icon: '🌀' },
    { name: 'Acceleration', slug: 'acceleration', icon: '📈' },
    { name: 'Density', slug: 'density', icon: '🧱' },
    { name: 'Torque', slug: 'torque', icon: '⚙️' },
  ]},
  { title: 'Specialized Converters', tools: [
    { name: 'Flow', slug: 'flow', icon: '💧' },
    { name: 'Current', slug: 'current', icon: '⚡' },
    { name: 'Resistance', slug: 'resistance', icon: '🔌' },
    { name: 'Voltage', slug: 'voltage', icon: '🔋' },
  ]},
]

const QUICK_CONVERSIONS = [
  { label: 'cm to inches', cat: 'length', from: 'Centimeter', to: 'Inch' },
  { label: 'kg to lbs', cat: 'weight', from: 'Kilogram', to: 'Pound' },
  { label: 'Celsius to Fahrenheit', cat: 'temperature', from: 'Celsius', to: 'Fahrenheit' },
  { label: 'mm to inches', cat: 'length', from: 'Millimeter', to: 'Inch' },
  { label: 'meters to feet', cat: 'length', from: 'Meter', to: 'Foot' },
  { label: 'km to miles', cat: 'length', from: 'Kilometer', to: 'Mile' },
  { label: 'cm to feet', cat: 'length', from: 'Centimeter', to: 'Foot' },
  { label: 'grams to ounces', cat: 'weight', from: 'Gram', to: 'Ounce' },
  { label: 'inches to feet', cat: 'length', from: 'Inch', to: 'Foot' },
  { label: 'liters to gallons', cat: 'volume', from: 'Liter', to: 'Gallon' },
  { label: 'pounds to ounces', cat: 'weight', from: 'Pound', to: 'Ounce' },
  { label: 'mph to kph', cat: 'speed', from: 'Mile per Hour', to: 'Kilometer per Hour' },
  { label: 'acres to sq feet', cat: 'area', from: 'Acre', to: 'Square Foot' },
  { label: 'radians to degrees', cat: 'angle', from: 'Radian', to: 'Degree' },
  { label: 'hp to kw', cat: 'power', from: 'Horsepower', to: 'Kilowatt' },
  { label: 'meters to yards', cat: 'length', from: 'Meter', to: 'Yard' },
  { label: 'mL to cups', cat: 'volume', from: 'Milliliter', to: 'Cup' },
]

function MainConverter() {
  const [selectedCategory, setSelectedCategory] = useState('length')
  const [value, setValue] = useState('1')
  const [fromUnit, setFromUnit] = useState('Meter')
  const [toUnit, setToUnit] = useState('Kilometer')

  const defs = unitData[selectedCategory] || unitData['length']

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug)
    const newDefs = unitData[slug] || unitData.length
    setFromUnit(newDefs.units[0])
    setToUnit(newDefs.units[1])
    setValue('1')
  }

  const result = defs.conversion(Number(value), fromUnit, toUnit)

  return (
    <div className="glass p-6 md:p-10 rounded-3xl border-2 border-primary/20 shadow-2xl space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-2xl text-4xl">
            {CONVERTER_GROUPS.flatMap(g => g.tools).find(t => t.slug === selectedCategory)?.icon || '📏'}
          </div>
          <div>
            <h2 className="text-3xl font-bold">{CONVERTER_GROUPS.flatMap(g => g.tools).find(t => t.slug === selectedCategory)?.name || 'Unit'} Converter</h2>
            <p className="text-gray-500">Instant, precise conversion</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 max-w-md">
          {CONVERTER_GROUPS.flatMap(g => g.tools).map(tool => (
            <button
              key={tool.slug}
              onClick={() => handleCategoryChange(tool.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === tool.slug
                  ? 'bg-primary text-white shadow-md'
                  : 'glass hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              {tool.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-6 items-end">
        <div className="md:col-span-3 space-y-2">
          <label className="block text-sm font-medium text-gray-500">Value to Convert</label>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="w-full bg-transparent text-3xl font-mono outline-none p-4 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-primary transition-colors"
            placeholder="0.00"
          />
        </div>

        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-500">From</label>
            <select
              value={fromUnit}
              onChange={e => setFromUnit(e.target.value)}
              className="w-full bg-transparent p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 outline-none focus:border-primary appearance-none"
            >
              {defs.units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-500">To</label>
            <select
              value={toUnit}
              onChange={e => setToUnit(e.target.value)}
              className="w-full bg-transparent p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 outline-none focus:border-primary appearance-none"
            >
              {defs.units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="md:col-span-1 flex justify-center pb-2">
          <button
            onClick={() => { setFromUnit(toUnit); setToUnit(fromUnit) }}
            className="p-4 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
            title="Swap units"
          >
            ⇄
          </button>
        </div>
      </div>

      <div className="mt-8 p-6 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Result</p>
          <p className="text-4xl font-mono font-bold text-primary">
            {result.toFixed(6).replace(/\.?0+$/, '')} <span className="text-lg font-normal text-gray-600">{toUnit}</span>
          </p>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(`${result.toFixed(6).replace(/\.?0+$/, '')} ${toUnit}`)}
          className="p-4 rounded-2xl bg-primary text-white hover:bg-blue-700 shadow-lg transition-transform active:scale-95"
          title="Copy Result"
        >
          📋
        </button>
      </div>
    </div>
  )
}

function UnitCategoryPage() {
  return <MainConverter />
}

function UnitPage() {
  const { category } = useParams<{ category: string }>()
  const cat = category || 'length'
  const defs = unitData[cat] || unitData['length']
  const [value, setValue] = useState('1')
  const [fromUnit, setFromUnit] = useState(defs.units[0])
  const [toUnit, setToUnit] = useState(defs.units[1])
  const { addRecent } = useUserData()
  useEffect(() => { addRecent(`unit/${cat}`) }, [cat])

  const result = defs.conversion(Number(value), fromUnit, toUnit)

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold capitalize">{cat} Converter</h1>
      <div className="glass p-6 rounded-2xl space-y-4">
        <input type="number" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-transparent text-2xl outline-none p-2 border-b border-gray-300 dark:border-gray-700" />
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
  const [courses, setCourses] = useState([{credit:'3', grade:'A'}])
  const gpa = courses.reduce((a,c) => a + (c.grade==='A'?4:c.grade==='B'?3:2) * Number(c.credit), 0) / courses.reduce((a,c) => a + Number(c.credit), 0) || 0
  return (
    <div>
      {courses.map((c, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input type="number" value={c.credit} onChange={e=>{ const n=[...courses]; n[i].credit=e.target.value; setCourses(n) }} className="w-20 bg-transparent border rounded px-2" />
          <select value={c.grade} onChange={e=>{ const n=[...courses]; n[i].grade=e.target.value; setCourses(n) }} className="bg-transparent border rounded px-2"><option>A</option><option>B</option><option>C</option></select>
        </div>
      ))}
      <button onClick={() => setCourses([...courses, {credit:3, grade:'A'}])} className="text-primary">+ Add course</button>
      <p className="mt-4 text-xl font-bold">GPA: {gpa.toFixed(2)}</p>
    </div>
  )
}
function BmiCalc() {
  const [weight, setWeight] = useState('70')
  const [height, setHeight] = useState('1.75')
  return <div className="space-y-4"><input type="number" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="Weight (kg)" className="w-full bg-transparent border-b p-2" /><input type="number" value={height} onChange={e=>setHeight(e.target.value)} placeholder="Height (m)" className="w-full bg-transparent border-b p-2" /><p className="text-xl font-bold">BMI: {(Number(weight)/(Number(height)*Number(height))).toFixed(1)}</p></div>
}
function PercentageCalc() {
  const [val, setVal] = useState('50')
  const [total, setTotal] = useState('200')
  return <div className="space-y-4"><input type="number" value={val} onChange={e=>setVal(e.target.value)} className="w-full bg-transparent border-b p-2" /><input type="number" value={total} onChange={e=>setTotal(e.target.value)} className="w-full bg-transparent border-b p-2" /><p className="text-xl font-bold">{(Number(val)/Number(total)*100).toFixed(2)}%</p></div>
}
function ScientificCalc() {
  const [expr, setExpr] = useState('')
  const [result, setResult] = useState('')
  return <div><input value={expr} onChange={e=>setExpr(e.target.value)} className="w-full bg-transparent border-b p-2" placeholder="e.g., Math.sin(Math.PI/2)" /><button onClick={()=>{ try { setResult(math.evaluate(expr).toString()) } catch { setResult('Error') }}} className="mt-3 bg-primary text-white px-4 py-2 rounded-xl">Calculate</button><p className="mt-4 text-xl">{result}</p></div>
}

function CalculatorPage() {
  const [mode, setMode] = useState<'normal' | 'scientific'>('normal')
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState('')
  const { addRecent } = useUserData()
  useEffect(() => { addRecent('calculator') }, [])

  const handleButtonClick = (val: string) => {
    if (val === 'AC') {
      setExpression('')
      setResult('')
    } else if (val === 'Del') {
      setExpression(prev => prev.slice(0, -1))
    } else if (val === '=') {
      try {
        // Use mathjs for safe evaluation
        const evalResult = math.evaluate(expression)
        setResult(Number.isInteger(evalResult) ? evalResult.toString() : Number(evalResult).toFixed(8).replace(/\.?0+$/, ''))
      } catch {
        setResult('Error')
      }
    } else {
      setExpression(prev => prev + val)
    }
  }

  const btnClass = (isSpecial = false) =>
    `p-4 rounded-2xl text-lg font-semibold transition-all active:scale-90 ${
      isSpecial
        ? 'bg-primary text-white hover:bg-blue-700 shadow-md'
        : 'glass hover:bg-white/50 dark:hover:bg-gray-800/50'
    }`

  const normalButtons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '=', '+',
    'AC', 'Del'
  ]

  const scientificButtons = [
    'sin(', 'cos(', 'tan(', 'log(',
    'ln(', 'sqrt(', '^', '(', ')',
    'PI', 'e', 'AC', 'Del'
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Calculator</h1>
        <div className="flex justify-center gap-2 p-1 glass rounded-xl w-fit mx-auto">
          <button
            onClick={() => setMode('normal')}
            className={`px-4 py-1 rounded-lg text-sm transition-all ${mode === 'normal' ? 'bg-primary text-white shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-800/50'}`}
          >
            Normal
          </button>
          <button
            onClick={() => setMode('scientific')}
            className={`px-4 py-1 rounded-lg text-sm transition-all ${mode === 'scientific' ? 'bg-primary text-white shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-800/50'}`}
          >
            Scientific
          </button>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl border-2 border-primary/20 shadow-2xl space-y-6">
        {/* Display - Full Width */}
        <div className="text-right space-y-1 p-6 bg-black/5 dark:bg-white/5 rounded-2xl overflow-hidden">
          <p className="text-gray-500 text-sm font-mono min-h-[1.25rem]">{expression || '0'}</p>
          <p className="text-5xl font-mono font-bold text-primary truncate">{result || expression || '0'}</p>
        </div>

        {/* Keypad - Horizontal Layout on MD+ */}
        <div className="flex flex-col md:flex-row gap-6">
          {mode === 'scientific' && (
            <div className="flex-1 grid grid-cols-3 gap-3">
              {scientificButtons.map(btn => (
                <button
                  key={btn}
                  onClick={() => handleButtonClick(btn)}
                  className={btnClass(btn === 'AC' || btn === 'Del')}
                >
                  {btn}
                </button>
              ))}
            </div>
          )}

          <div className={`${mode === 'scientific' ? 'flex-1' : 'w-full'} grid grid-cols-4 gap-3`}>
            {normalButtons.map(btn => (
              <button
                key={btn}
                onClick={() => handleButtonClick(btn)}
                className={btnClass(btn === '=' || btn === 'AC' || btn === 'Del')}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500 dark:text-gray-400">Last updated: February 2026</p>
      </div>
      
      <div className="glass p-6 rounded-2xl space-y-6">
        <section>
          <h2 className="text-xl font-bold mb-3">1. Introduction</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Welcome to EasyunitEX ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-bold mb-3">2. Information We Collect</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
            We collect information that you voluntarily provide to us when using our services:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Usage data (pages visited, tools used, time spent)</li>
            <li>Device information (browser type, operating system)</li>
            <li>IP address and general location data</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-xl font-bold mb-3">3. How We Use Your Information</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
            We use the collected information for:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Providing, maintaining, and improving our services</li>
            <li>Understanding how users interact with our tools</li>
            <li>Displaying relevant advertisements</li>
            <li>Ensuring the security and integrity of our platform</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-xl font-bold mb-3">4. Cookies and Tracking Technologies</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            We use cookies and similar tracking technologies to enhance your experience. You can control cookies through your browser settings. We may use Google Analytics and Google AdSense, which have their own privacy policies.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-bold mb-3">5. Third-Party Services</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
            We may share your information with third-party service providers:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Google Analytics (analytics)</li>
            <li>Google AdSense (advertising)</li>
            <li>Currency exchange rate APIs</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-xl font-bold mb-3">6. Data Security</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-bold mb-3">7. Children's Privacy</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-bold mb-3">8. Your Rights</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
            You have the right to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>Access your personal data</li>
            <li>Request correction or deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-xl font-bold mb-3">9. Changes to This Privacy Policy</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-bold mb-3">10. Contact Us</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            <strong>Ghost Network</strong><br />
            Email: support@easyunitex.com
          </p>
        </section>
      </div>
    </div>
  )
}

function NotFound() {
  return <div className="text-center py-20"><h1 className="text-6xl font-bold text-gray-300">404</h1><p className="text-xl mt-4">Page not found</p><Link to="/" className="mt-6 inline-block bg-primary text-white px-6 py-3 rounded-xl">Go Home</Link></div>
}

// ===================== APP (with providers) =====================
export default function App() {
  const themes = ['light', 'dark', 'theme-ocean', 'theme-forest', 'theme-sunset']
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light'
    }
    return 'light'
  })

  useEffect(() => {
    document.documentElement.classList.remove(...themes, 'dark')
    document.documentElement.classList.add(theme)

    const darkThemes = ['dark', 'theme-ocean', 'theme-forest', 'theme-sunset']
    if (darkThemes.includes(theme)) {
      document.documentElement.classList.add('dark')
    }

    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => {
      const currentIndex = themes.indexOf(prev)
      const nextIndex = (currentIndex + 1) % themes.length
      return themes[nextIndex]
    })
  }

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
              <Route path="common" element={<CommonToolsPage />} />
              <Route path="currency" element={<CurrencyPage />} />
              <Route path="unit" element={<UnitCategoryPage />} />
              <Route path="unit/:category" element={<UnitPage />} />
              <Route path="number-system" element={<NumberSystemPage />} />
              <Route path="developer" element={<DeveloperPage />} />
              <Route path="student" element={<StudentPage />} />
              <Route path="calculator" element={<CalculatorPage />} />
              <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </HashRouter>
      </UserDataContext.Provider>
    </ThemeContext.Provider>
  )
}
