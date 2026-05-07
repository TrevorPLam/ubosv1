import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line
} from "recharts";
import {
  Package, Plus, Search, Filter, RefreshCw, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, ChevronRight, ChevronDown,
  LayoutGrid, List, Tag, Wrench, BarChart2, AlertTriangle, CheckCircle2,
  Clock, MapPin, Hash, DollarSign, Layers, Zap, Shield, Star,
  Cpu, HardDrive, Smartphone, Wifi, Bitcoin, ImageIcon, Music2,
  ShoppingBag, Beef, Wheat, Apple, Milk, Fish, Boxes, Truck,
  Home, Factory, Car, Camera, Monitor, Server, Database, X,
  ChevronUp, ChevronsUpDown, SlidersHorizontal, Download, Upload,
  CalendarDays, AlertCircle, Flame, Snowflake, Gauge
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const fmt = (v: number, compact = false) =>
  compact && Math.abs(v) >= 1000
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(v)
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const fmtNum = (v: number) => new Intl.NumberFormat("en-US").format(v);

// ─── Industry Presets ──────────────────────────────────────────────────────
type Industry = "all" | "digital" | "food" | "product" | "equipment" | "real_estate" | "fleet";

const INDUSTRY_PRESETS: { id: Industry; label: string; icon: React.ElementType; description: string }[] = [
  { id: "all", label: "All Assets", icon: Layers, description: "Multi-industry overview" },
  { id: "digital", label: "Digital Assets", icon: Cpu, description: "Crypto, NFTs, software licenses" },
  { id: "food", label: "Food Inventory", icon: Beef, description: "Perishables, ingredients, stock" },
  { id: "product", label: "Product Inventory", icon: Boxes, description: "Retail, warehouse, SKUs" },
  { id: "equipment", label: "Equipment", icon: Wrench, description: "Machinery, tools, hardware" },
  { id: "real_estate", label: "Real Estate", icon: Home, description: "Properties, land, facilities" },
  { id: "fleet", label: "Fleet", icon: Truck, description: "Vehicles, transport assets" },
];

// ─── Asset Data ────────────────────────────────────────────────────────────
type AssetStatus = "active" | "low_stock" | "expiring" | "maintenance" | "inactive" | "critical";
type AssetCondition = "excellent" | "good" | "fair" | "poor";

interface Asset {
  id: string;
  name: string;
  category: string;
  industry: Industry;
  sku?: string;
  quantity: number;
  unit: string;
  value: number;
  purchaseCost: number;
  location: string;
  status: AssetStatus;
  condition: AssetCondition;
  lastUpdated: string;
  expiryDate?: string;
  tags: string[];
  depreciation?: number;
  icon: React.ElementType;
  serialNumber?: string;
  supplier?: string;
  reorderPoint?: number;
  notes?: string;
}

const ALL_ASSETS: Asset[] = [
  // Digital
  { id: "d1", name: "Bitcoin Holdings", category: "Cryptocurrency", industry: "digital", quantity: 2.45, unit: "BTC", value: 245000, purchaseCost: 98000, location: "Ledger Wallet", status: "active", condition: "excellent", lastUpdated: "2m ago", tags: ["crypto", "high-value"], icon: Bitcoin, notes: "Cold storage" },
  { id: "d2", name: "Ethereum", category: "Cryptocurrency", industry: "digital", quantity: 18.3, unit: "ETH", value: 54900, purchaseCost: 29000, location: "MetaMask", status: "active", condition: "excellent", lastUpdated: "2m ago", tags: ["crypto", "defi"], icon: Zap },
  { id: "d3", name: "Adobe CC License", category: "Software License", industry: "digital", quantity: 5, unit: "seats", value: 3600, purchaseCost: 3600, location: "Cloud", status: "expiring", condition: "good", lastUpdated: "1d ago", expiryDate: "Jun 15, 2026", tags: ["license", "design"], icon: Monitor, supplier: "Adobe", depreciation: 0 },
  { id: "d4", name: "CryptoPunk #7842", category: "NFT", industry: "digital", quantity: 1, unit: "token", value: 32000, purchaseCost: 8500, location: "OpenSea", status: "active", condition: "excellent", lastUpdated: "3d ago", tags: ["nft", "collectible"], icon: ImageIcon },
  { id: "d5", name: "Domain Portfolio", category: "Domain Names", industry: "digital", quantity: 14, unit: "domains", value: 8400, purchaseCost: 2100, location: "GoDaddy", status: "active", condition: "good", lastUpdated: "1w ago", tags: ["domains", "ip"], icon: Wifi, expiryDate: "Various" },
  { id: "d6", name: "AWS Reserved Instances", category: "Cloud Compute", industry: "digital", quantity: 8, unit: "instances", value: 12000, purchaseCost: 14400, location: "AWS us-east-1", status: "active", condition: "good", lastUpdated: "1h ago", tags: ["cloud", "infrastructure"], icon: Server, supplier: "Amazon", expiryDate: "Dec 31, 2026", depreciation: 15 },
  // Food
  { id: "f1", name: "Wagyu Beef (A5)", category: "Protein", industry: "food", sku: "PRO-001", quantity: 48, unit: "kg", value: 9600, purchaseCost: 7200, location: "Freezer A", status: "active", condition: "excellent", lastUpdated: "4h ago", expiryDate: "Aug 12, 2026", tags: ["premium", "frozen"], icon: Beef, supplier: "Premium Meats Co.", reorderPoint: 10 },
  { id: "f2", name: "Organic Flour (00)", category: "Dry Goods", industry: "food", sku: "DRY-012", quantity: 4.5, unit: "bags", value: 135, purchaseCost: 135, location: "Dry Storage", status: "low_stock", condition: "good", lastUpdated: "1d ago", expiryDate: "Nov 30, 2026", tags: ["organic", "baking"], icon: Wheat, supplier: "Mill Direct", reorderPoint: 10, notes: "Running low" },
  { id: "f3", name: "Wild Salmon Fillet", category: "Seafood", industry: "food", sku: "SEA-003", quantity: 22, unit: "kg", value: 3080, purchaseCost: 2640, location: "Freezer B", status: "active", condition: "excellent", lastUpdated: "6h ago", expiryDate: "Jun 30, 2026", tags: ["seafood", "premium"], icon: Fish, supplier: "Ocean Fresh", reorderPoint: 5 },
  { id: "f4", name: "Seasonal Produce Mix", category: "Produce", industry: "food", sku: "PRD-022", quantity: 80, unit: "kg", value: 560, purchaseCost: 560, location: "Walk-in Cooler", status: "expiring", condition: "fair", lastUpdated: "2h ago", expiryDate: "May 10, 2026", tags: ["fresh", "perishable"], icon: Apple, supplier: "Local Farm Co.", reorderPoint: 20 },
  { id: "f5", name: "Artisan Cheese Selection", category: "Dairy", industry: "food", sku: "DAI-007", quantity: 15, unit: "wheels", value: 2250, purchaseCost: 1875, location: "Cheese Cave", status: "active", condition: "excellent", lastUpdated: "1d ago", expiryDate: "Jul 15, 2026", tags: ["dairy", "premium"], icon: Milk, supplier: "French Dairy Imports" },
  { id: "f6", name: "Extra Virgin Olive Oil", category: "Oils & Condiments", industry: "food", sku: "OIL-004", quantity: 3, unit: "cases", value: 420, purchaseCost: 360, location: "Dry Storage", status: "critical", condition: "good", lastUpdated: "2d ago", expiryDate: "Oct 20, 2026", tags: ["oils", "staple"], icon: Beef, supplier: "Mediterranean Imports", reorderPoint: 5, notes: "Below critical threshold" },
  // Product
  { id: "p1", name: "Wireless Earbuds Pro", category: "Consumer Electronics", industry: "product", sku: "CE-4421", quantity: 240, unit: "units", value: 33600, purchaseCost: 24000, location: "Warehouse A, Shelf 12", status: "active", condition: "excellent", lastUpdated: "3h ago", tags: ["electronics", "audio"], icon: Smartphone, supplier: "TechSource Ltd.", reorderPoint: 50 },
  { id: "p2", name: "Premium Coffee Maker", category: "Kitchen Appliances", industry: "product", sku: "KA-0892", quantity: 18, unit: "units", value: 5400, purchaseCost: 3960, location: "Warehouse B, Shelf 4", status: "low_stock", condition: "excellent", lastUpdated: "1d ago", tags: ["appliances", "kitchen"], icon: ShoppingBag, supplier: "Home Essentials Inc.", reorderPoint: 25 },
  { id: "p3", name: "Yoga Mat Bundle", category: "Sports & Fitness", industry: "product", sku: "SF-1143", quantity: 150, unit: "units", value: 6750, purchaseCost: 4500, location: "Warehouse A, Shelf 7", status: "active", condition: "good", lastUpdated: "2d ago", tags: ["fitness", "wellness"], icon: Package, supplier: "FitGear Co.", reorderPoint: 30 },
  { id: "p4", name: "Smart Home Hub", category: "IoT Devices", industry: "product", sku: "IOT-2201", quantity: 85, unit: "units", value: 16150, purchaseCost: 12750, location: "Warehouse C, Shelf 1", status: "active", condition: "excellent", lastUpdated: "5h ago", tags: ["smart-home", "iot"], icon: Wifi, supplier: "SmartTech Imports" },
  { id: "p5", name: "Vintage Denim Jacket", category: "Apparel", industry: "product", sku: "APP-3389", quantity: 0, unit: "units", value: 0, purchaseCost: 2400, location: "Warehouse A, Shelf 9", status: "inactive", condition: "good", lastUpdated: "1w ago", tags: ["clothing", "vintage"], icon: ShoppingBag, supplier: "Fashion Forward Co.", reorderPoint: 10 },
  // Equipment
  { id: "e1", name: "Industrial 3D Printer", category: "Manufacturing", industry: "equipment", serialNumber: "3DP-00421", quantity: 2, unit: "units", value: 48000, purchaseCost: 60000, location: "Production Floor A", status: "active", condition: "good", lastUpdated: "1d ago", tags: ["manufacturing", "3d-print"], icon: Factory, supplier: "PrintTech Pro", depreciation: 20, notes: "Annual maintenance due Q3" },
  { id: "e2", name: "CNC Milling Machine", category: "Machining", industry: "equipment", serialNumber: "CNC-0081", quantity: 1, unit: "unit", value: 85000, purchaseCost: 120000, location: "Machine Shop", status: "maintenance", condition: "fair", lastUpdated: "6h ago", tags: ["cnc", "precision"], icon: Wrench, supplier: "MachineWorks Inc.", depreciation: 29, notes: "Currently in scheduled maintenance" },
  { id: "e3", name: "Forklift (Electric)", category: "Material Handling", industry: "equipment", serialNumber: "FLT-0033", quantity: 3, unit: "units", value: 54000, purchaseCost: 75000, location: "Warehouse", status: "active", condition: "excellent", lastUpdated: "2h ago", tags: ["warehouse", "electric"], icon: Truck, supplier: "LiftPro Solutions", depreciation: 28 },
  { id: "e4", name: "Server Rack (48U)", category: "IT Infrastructure", industry: "equipment", serialNumber: "SRV-0201", quantity: 4, unit: "racks", value: 36000, purchaseCost: 40000, location: "Data Center, Row 3", status: "active", condition: "good", lastUpdated: "5m ago", tags: ["it", "datacenter"], icon: Server, supplier: "RackSpace Pro", depreciation: 10 },
  { id: "e5", name: "Security Camera System", category: "Security", industry: "equipment", serialNumber: "SEC-0099", quantity: 24, unit: "cameras", value: 14400, purchaseCost: 18000, location: "All Facilities", status: "active", condition: "excellent", lastUpdated: "1d ago", tags: ["security", "surveillance"], icon: Camera, supplier: "SafeGuard Systems", depreciation: 20 },
  // Real Estate
  { id: "r1", name: "Downtown Office Suite", category: "Commercial", industry: "real_estate", quantity: 1, unit: "property", value: 1850000, purchaseCost: 1200000, location: "123 Main St, Floor 4", status: "active", condition: "excellent", lastUpdated: "1w ago", tags: ["commercial", "office"], icon: Home, supplier: "Eastside Realty", depreciation: 2.5, notes: "Leased at $18k/mo" },
  { id: "r2", name: "Warehouse Complex", category: "Industrial", industry: "real_estate", quantity: 1, unit: "property", value: 2400000, purchaseCost: 1900000, location: "45 Industrial Blvd", status: "active", condition: "good", lastUpdated: "2w ago", tags: ["industrial", "warehouse"], icon: Factory, supplier: "Commercial Properties Inc.", depreciation: 2.5 },
  { id: "r3", name: "Retail Storefront", category: "Retail", industry: "real_estate", quantity: 1, unit: "property", value: 680000, purchaseCost: 540000, location: "88 Shopping Ave", status: "active", condition: "excellent", lastUpdated: "1w ago", tags: ["retail", "commercial"], icon: ShoppingBag, depreciation: 2.5, notes: "Fully leased, 3-year term" },
  // Fleet
  { id: "v1", name: "Tesla Model 3 (x4)", category: "Passenger Vehicle", industry: "fleet", quantity: 4, unit: "vehicles", value: 112000, purchaseCost: 140000, location: "HQ Parking", status: "active", condition: "excellent", lastUpdated: "3h ago", tags: ["electric", "passenger"], icon: Car, supplier: "Tesla Motors", depreciation: 20, serialNumber: "TES-2024-001-004" },
  { id: "v2", name: "Sprinter Cargo Van", category: "Commercial Vehicle", industry: "fleet", quantity: 6, unit: "vehicles", value: 144000, purchaseCost: 192000, location: "Warehouse Depot", status: "active", condition: "good", lastUpdated: "1d ago", tags: ["cargo", "delivery"], icon: Truck, supplier: "Mercedes-Benz Commercial", depreciation: 25, notes: "2 due for oil change" },
  { id: "v3", name: "Box Truck (26ft)", category: "Heavy Vehicle", industry: "fleet", quantity: 2, unit: "vehicles", value: 54000, purchaseCost: 80000, location: "Depot B", status: "maintenance", condition: "fair", lastUpdated: "2d ago", tags: ["freight", "heavy"], icon: Truck, supplier: "Fleet Direct", depreciation: 32, notes: "Engine check in progress" },
];

// ─── Chart Data ────────────────────────────────────────────────────────────
const valueTrendData = [
  { month: "Nov", value: 4820000, prev: 4600000 },
  { month: "Dec", value: 4950000, prev: 4820000 },
  { month: "Jan", value: 5110000, prev: 4950000 },
  { month: "Feb", value: 5080000, prev: 5110000 },
  { month: "Mar", value: 5340000, prev: 5080000 },
  { month: "Apr", value: 5290000, prev: 5340000 },
  { month: "May", value: 5520000, prev: 5290000 },
];

const depreciationData = [
  { month: "Nov", value: 42000 },
  { month: "Dec", value: 39000 },
  { month: "Jan", value: 44000 },
  { month: "Feb", value: 41000 },
  { month: "Mar", value: 38000 },
  { month: "Apr", value: 45000 },
  { month: "May", value: 37000 },
];

const CATEGORY_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(220 60% 60%)",
  "hsl(160 60% 45%)", "hsl(40 90% 55%)"
];

const STATUS_CONFIG: Record<AssetStatus, { label: string; color: string; dot: string }> = {
  active:      { label: "Active",      color: "bg-green-500/10 text-green-400 border-green-500/20",   dot: "bg-green-400" },
  low_stock:   { label: "Low Stock",   color: "bg-amber-500/10 text-amber-400 border-amber-500/20",   dot: "bg-amber-400" },
  expiring:    { label: "Expiring",    color: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-400" },
  maintenance: { label: "Maintenance", color: "bg-blue-500/10 text-blue-400 border-blue-500/20",       dot: "bg-blue-400" },
  inactive:    { label: "Inactive",    color: "bg-muted/60 text-muted-foreground border-border",        dot: "bg-muted-foreground" },
  critical:    { label: "Critical",    color: "bg-red-500/10 text-red-400 border-red-500/20",          dot: "bg-red-400" },
};

const CONDITION_CONFIG: Record<AssetCondition, { label: string; color: string; pct: number }> = {
  excellent: { label: "Excellent", color: "text-green-400",  pct: 95 },
  good:      { label: "Good",      color: "text-blue-400",   pct: 75 },
  fair:      { label: "Fair",      color: "text-amber-400",  pct: 50 },
  poor:      { label: "Poor",      color: "text-red-400",    pct: 25 },
};

type TabId = "overview" | "catalog" | "categories" | "valuation" | "maintenance";
const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview",    label: "Overview",    icon: BarChart2 },
  { id: "catalog",     label: "Catalog",     icon: List },
  { id: "categories",  label: "Categories",  icon: Tag },
  { id: "valuation",   label: "Valuation",   icon: TrendingUp },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
];

type SortKey = "name" | "value" | "quantity" | "status" | "lastUpdated";
type SortDir = "asc" | "desc";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border rounded-lg p-3 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{fmt(entry.value, true)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Add Asset Modal ───────────────────────────────────────────────────────
function AddAssetModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", category: "", quantity: "", unit: "units", value: "", location: "", status: "active" as AssetStatus, industry: "product" as Industry });
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-base font-semibold">Add New Asset</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Track a new item in your asset registry</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Asset Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. MacBook Pro M3" className="w-full px-3 py-2 rounded-lg bg-muted/40 border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Industry</label>
              <select value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value as Industry }))} className="w-full px-3 py-2 rounded-lg bg-muted/40 border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                {INDUSTRY_PRESETS.filter(i => i.id !== "all").map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
              <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Electronics" className="w-full px-3 py-2 rounded-lg bg-muted/40 border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Quantity</label>
              <input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} placeholder="0" className="w-full px-3 py-2 rounded-lg bg-muted/40 border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Unit</label>
              <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="units, kg, seats…" className="w-full px-3 py-2 rounded-lg bg-muted/40 border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Current Value ($)</label>
              <input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder="0.00" className="w-full px-3 py-2 rounded-lg bg-muted/40 border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as AssetStatus }))} className="w-full px-3 py-2 rounded-lg bg-muted/40 border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Location</label>
              <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Warehouse A, Shelf 3" className="w-full px-3 py-2 rounded-lg bg-muted/40 border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="gap-1.5" onClick={onClose}>
            <Plus className="w-3.5 h-3.5" /> Add Asset
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export function AssetsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filteredAssets = useMemo(() => {
    let list = ALL_ASSETS;
    if (selectedIndustry !== "all") list = list.filter(a => a.industry === selectedIndustry);
    if (statusFilter !== "all") list = list.filter(a => a.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || a.location.toLowerCase().includes(q) || a.tags.some(t => t.includes(q)));
    }
    list = [...list].sort((a, b) => {
      let va: any = a[sortKey], vb: any = b[sortKey];
      if (typeof va === "string") va = va.toLowerCase(), vb = vb.toLowerCase();
      return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return list;
  }, [selectedIndustry, statusFilter, searchQuery, sortKey, sortDir]);

  const totalValue = filteredAssets.reduce((s, a) => s + a.value, 0);
  const totalAssets = filteredAssets.length;
  const totalItems = filteredAssets.reduce((s, a) => s + a.quantity, 0);
  const alertCount = filteredAssets.filter(a => ["low_stock","expiring","critical","maintenance"].includes(a.status)).length;
  const gainLoss = filteredAssets.reduce((s, a) => s + (a.value - a.purchaseCost), 0);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filteredAssets.forEach(a => map.set(a.category, (map.get(a.category) || 0) + a.value));
    return Array.from(map.entries()).map(([name, value], i) => ({ name, value, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] })).sort((a, b) => b.value - a.value);
  }, [filteredAssets]);

  const industryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    ALL_ASSETS.forEach(a => {
      const preset = INDUSTRY_PRESETS.find(p => p.id === a.industry);
      map.set(preset?.label || a.industry, (map.get(preset?.label || a.industry) || 0) + a.value);
    });
    return Array.from(map.entries()).map(([name, value], i) => ({ name, value, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] })).sort((a, b) => b.value - a.value);
  }, []);

  const maintenanceAssets = filteredAssets.filter(a => a.status === "maintenance" || a.condition === "fair" || a.condition === "poor" || a.notes?.toLowerCase().includes("maintenance") || a.notes?.toLowerCase().includes("due"));

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 text-muted-foreground/40" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track, manage and analyze every asset across your organization.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 h-8">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button variant="outline" size="sm" className="gap-2 h-8">
            <Upload className="w-3.5 h-3.5" /> Import
          </Button>
          <Button size="sm" className="gap-2 h-8" onClick={() => setShowAddModal(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Asset
          </Button>
        </div>
      </div>

      {/* ── Industry Preset Selector ── */}
      <div className="flex items-center gap-2 px-6 py-3 border-b shrink-0 overflow-x-auto scrollbar-thin">
        {INDUSTRY_PRESETS.map(preset => {
          const Icon = preset.icon;
          const isSelected = selectedIndustry === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => setSelectedIndustry(preset.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground border-transparent hover:border-border"
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Nav ── */}
      <div className="flex items-center gap-1 px-6 py-2 border-b shrink-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === "maintenance" && maintenanceAssets.length > 0 && (
                <span className="flex items-center justify-center w-4 h-4 bg-amber-500 text-amber-950 text-[9px] font-bold rounded-full">{maintenanceAssets.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ══════════ OVERVIEW ══════════ */}
        {activeTab === "overview" && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: "Total Value", value: fmt(totalValue, true), sub: `${totalAssets} asset types`, icon: DollarSign, color: "bg-primary/10 text-primary", trend: gainLoss > 0 },
                { label: "Total Items", value: fmtNum(totalItems), sub: "across all locations", icon: Package, color: "bg-blue-500/10 text-blue-400", trend: null },
                { label: "Unrealised Gain", value: fmt(Math.abs(gainLoss), true), sub: gainLoss >= 0 ? "above cost basis" : "below cost basis", icon: gainLoss >= 0 ? TrendingUp : TrendingDown, color: gainLoss >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400", trend: gainLoss >= 0 },
                { label: "Alerts", value: String(alertCount), sub: "need attention", icon: AlertTriangle, color: alertCount > 0 ? "bg-amber-500/10 text-amber-400" : "bg-green-500/10 text-green-400", trend: null },
                { label: "Categories", value: String(categoryBreakdown.length), sub: "asset categories", icon: Tag, color: "bg-purple-500/10 text-purple-400", trend: null },
              ].map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <Card key={i} className="bg-card/60 border-0">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-muted-foreground">{kpi.label}</p>
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", kpi.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-xl font-bold">{kpi.value}</p>
                      <div className={cn("flex items-center gap-1 mt-1 text-xs", kpi.trend === true ? "text-green-400" : kpi.trend === false ? "text-red-400" : "text-muted-foreground")}>
                        {kpi.trend === true && <ArrowUpRight className="w-3 h-3" />}
                        {kpi.trend === false && <ArrowDownRight className="w-3 h-3" />}
                        {kpi.sub}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Value Trend */}
              <Card className="lg:col-span-2 border-0 bg-card/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Portfolio Value Trend</CardTitle>
                  <CardDescription>Total asset value over 7 months</CardDescription>
                </CardHeader>
                <CardContent className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={valueTrendData}>
                      <defs>
                        <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => fmt(v, true)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="value" name="Total Value" stroke="hsl(var(--primary))" fill="url(#valueGrad)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Donut */}
              <Card className="border-0 bg-card/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Value by Category</CardTitle>
                  <CardDescription>Top categories by value</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryBreakdown.slice(0, 8)} cx="50%" cy="50%" innerRadius={40} outerRadius={64} paddingAngle={2} dataKey="value">
                          {categoryBreakdown.slice(0, 8).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(val: number) => fmt(val, true)} contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-2">
                    {categoryBreakdown.slice(0, 4).map(item => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-muted-foreground truncate max-w-[100px]">{item.name}</span>
                        </div>
                        <span className="font-medium">{fmt(item.value, true)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Industry Breakdown Bar */}
            <Card className="border-0 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Value by Industry</CardTitle>
                <CardDescription>Distribution across asset classes</CardDescription>
              </CardHeader>
              <CardContent className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={industryBreakdown} layout="vertical" barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={v => fmt(v, true)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    {industryBreakdown.map((entry, i) => (
                      <Bar key={entry.name} dataKey="value" name="Value" fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} radius={[0, 4, 4, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Alerts */}
            {alertCount > 0 && (
              <Card className="border-0 bg-amber-500/5 border border-amber-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Alerts & Attention Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredAssets.filter(a => ["low_stock","expiring","critical","maintenance"].includes(a.status)).map((asset, i, arr) => {
                    const Icon = asset.icon;
                    const sc = STATUS_CONFIG[asset.status];
                    return (
                      <div key={asset.id} className={cn("flex items-center justify-between px-6 py-3 hover:bg-muted/20 transition-colors", i < arr.length - 1 && "border-b border-border/50")}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{asset.name}</p>
                            <p className="text-xs text-muted-foreground">{asset.category} · {asset.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {asset.expiryDate && <span className="text-xs text-muted-foreground">Expires {asset.expiryDate}</span>}
                          {asset.notes && <span className="text-xs text-muted-foreground italic truncate max-w-[140px]">{asset.notes}</span>}
                          <Badge className={cn("text-[10px] border", sc.color)}>{sc.label}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ══════════ CATALOG ══════════ */}
        {activeTab === "catalog" && (
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search assets, categories, locations…"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-muted/40 border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="flex items-center gap-2">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="px-3 py-2 rounded-lg bg-muted/40 border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <option value="all">All Statuses</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <div className="flex items-center bg-muted/40 border rounded-lg overflow-hidden">
                  <button onClick={() => setViewMode("table")} className={cn("px-2.5 py-2 transition-colors", viewMode === "table" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground")}>
                    <List className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode("grid")} className={cn("px-2.5 py-2 transition-colors", viewMode === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground")}>
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => setShowAddModal(true)}>
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredAssets.length}</span> assets
              {selectedIndustry !== "all" && <> in <span className="font-medium text-foreground">{INDUSTRY_PRESETS.find(p => p.id === selectedIndustry)?.label}</span></>}
            </div>

            {/* Table View */}
            {viewMode === "table" && (
              <div className="border rounded-xl bg-card overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_120px_100px_110px_100px_90px_40px] gap-3 items-center px-4 py-2.5 bg-muted/30 text-xs font-medium text-muted-foreground border-b">
                  <span className="w-8" />
                  <button className="flex items-center gap-1 text-left hover:text-foreground transition-colors" onClick={() => handleSort("name")}>Name <SortIcon col="name" /></button>
                  <span>Category</span>
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort("quantity")}>Qty <SortIcon col="quantity" /></button>
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors justify-end" onClick={() => handleSort("value")}>Value <SortIcon col="value" /></button>
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort("status")}>Status <SortIcon col="status" /></button>
                  <span>Updated</span>
                  <span />
                </div>
                <div className="divide-y">
                  {filteredAssets.map(asset => {
                    const Icon = asset.icon;
                    const sc = STATUS_CONFIG[asset.status];
                    const roi = ((asset.value - asset.purchaseCost) / asset.purchaseCost * 100);
                    return (
                      <div key={asset.id} className="grid grid-cols-[auto_1fr_120px_100px_110px_100px_90px_40px] gap-3 items-center px-4 py-3 hover:bg-muted/20 transition-colors group">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{asset.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                            <span className="text-xs text-muted-foreground truncate">{asset.location}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs bg-muted/60 px-2 py-0.5 rounded-full">{asset.category}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{fmtNum(asset.quantity)}</p>
                          <p className="text-xs text-muted-foreground">{asset.unit}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{fmt(asset.value, true)}</p>
                          <p className={cn("text-xs", roi >= 0 ? "text-green-400" : "text-red-400")}>
                            {roi >= 0 ? "+" : ""}{roi.toFixed(1)}% ROI
                          </p>
                        </div>
                        <div>
                          <Badge className={cn("text-[10px] border", sc.color)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full mr-1 inline-block", sc.dot)} />
                            {sc.label}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{asset.lastUpdated}</div>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted/60 transition-all">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAssets.map(asset => {
                  const Icon = asset.icon;
                  const sc = STATUS_CONFIG[asset.status];
                  const cc = CONDITION_CONFIG[asset.condition];
                  const roi = ((asset.value - asset.purchaseCost) / asset.purchaseCost * 100);
                  return (
                    <Card key={asset.id} className="border-0 bg-card/70 hover:bg-card/90 transition-colors cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                            <Icon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <Badge className={cn("text-[10px] border", sc.color)}>{sc.label}</Badge>
                        </div>
                        <p className="text-sm font-semibold truncate mb-0.5">{asset.name}</p>
                        <p className="text-xs text-muted-foreground mb-3">{asset.category}</p>
                        <p className="text-lg font-bold">{fmt(asset.value, true)}</p>
                        <div className={cn("text-xs mt-0.5 mb-3", roi >= 0 ? "text-green-400" : "text-red-400")}>
                          {roi >= 0 ? "▲" : "▼"} {Math.abs(roi).toFixed(1)}% from cost
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{fmtNum(asset.quantity)} {asset.unit}</span>
                          <span className={cc.color}>{cc.label}</span>
                        </div>
                        <Progress value={cc.pct} className="mt-2 h-1" />
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{asset.location}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════ CATEGORIES ══════════ */}
        {activeTab === "categories" && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 bg-card/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Category Distribution</CardTitle>
                  <CardDescription>Value split by category</CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryBreakdown.slice(0, 8)} cx="50%" cy="50%" outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {categoryBreakdown.slice(0, 8).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(val: number) => fmt(val, true)} contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {categoryBreakdown.map((cat, i) => {
                  const pct = (cat.value / totalValue) * 100;
                  const assetsInCat = filteredAssets.filter(a => a.category === cat.name);
                  return (
                    <Card key={cat.name} className="border-0 bg-card/60 hover:bg-card/80 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="text-sm font-medium">{cat.name}</span>
                            <Badge variant="outline" className="text-[10px] h-4">{assetsInCat.length} assets</Badge>
                          </div>
                          <span className="text-sm font-bold">{fmt(cat.value, true)}</span>
                        </div>
                        <Progress value={pct} className="h-1.5" style={{ "--progress-color": cat.color } as any} />
                        <p className="text-xs text-muted-foreground mt-1">{pct.toFixed(1)}% of total portfolio</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ VALUATION ══════════ */}
        {activeTab === "valuation" && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Book Value", value: fmt(filteredAssets.reduce((s, a) => s + a.purchaseCost, 0), true), icon: DollarSign, color: "bg-muted/60 text-muted-foreground" },
                { label: "Current Market Value", value: fmt(totalValue, true), icon: TrendingUp, color: "bg-primary/10 text-primary" },
                { label: "Total Gain / Loss", value: fmt(Math.abs(gainLoss), true), icon: gainLoss >= 0 ? ArrowUpRight : ArrowDownRight, color: gainLoss >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400" },
                { label: "Monthly Depreciation", value: fmt(37000, true), icon: TrendingDown, color: "bg-orange-500/10 text-orange-400" },
              ].map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <Card key={i} className="border-0 bg-card/60">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-muted-foreground">{kpi.label}</p>
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", kpi.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-xl font-bold">{kpi.value}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 bg-card/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Monthly Depreciation</CardTitle>
                  <CardDescription>Cost of asset wear & aging</CardDescription>
                </CardHeader>
                <CardContent className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={depreciationData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => fmt(v, true)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Depreciation" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 bg-card/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Asset ROI Breakdown</CardTitle>
                  <CardDescription>Gain/loss vs. purchase cost</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-2 overflow-y-auto max-h-56">
                  {filteredAssets.slice(0, 10).map(asset => {
                    const Icon = asset.icon;
                    const roi = ((asset.value - asset.purchaseCost) / (asset.purchaseCost || 1) * 100);
                    const isGain = roi >= 0;
                    return (
                      <div key={asset.id} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium truncate">{asset.name}</span>
                            <span className={cn("text-xs font-semibold ml-2 shrink-0", isGain ? "text-green-400" : "text-red-400")}>
                              {isGain ? "+" : ""}{roi.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={Math.min(Math.abs(roi), 100)} className="h-1" />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Depreciation schedule table */}
            <Card className="border-0 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Depreciation Schedule</CardTitle>
                <CardDescription>Annual depreciation rates for tracked assets</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-[auto_1fr_120px_100px_100px_100px] gap-3 items-center px-5 py-2.5 bg-muted/30 border-b text-xs font-medium text-muted-foreground">
                  <span className="w-7" />
                  <span>Asset</span>
                  <span>Category</span>
                  <span className="text-right">Cost Basis</span>
                  <span className="text-right">Current Value</span>
                  <span className="text-center">Depr. Rate</span>
                </div>
                <div className="divide-y">
                  {filteredAssets.filter(a => a.depreciation !== undefined).map(asset => {
                    const Icon = asset.icon;
                    return (
                      <div key={asset.id} className="grid grid-cols-[auto_1fr_120px_100px_100px_100px] gap-3 items-center px-5 py-3 hover:bg-muted/20 transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{asset.name}</p>
                          <p className="text-xs text-muted-foreground">{asset.location}</p>
                        </div>
                        <span className="text-xs bg-muted/60 px-2 py-0.5 rounded-full w-fit">{asset.category}</span>
                        <span className="text-sm text-right">{fmt(asset.purchaseCost, true)}</span>
                        <span className="text-sm text-right font-semibold">{fmt(asset.value, true)}</span>
                        <div className="flex justify-center">
                          <Badge className={cn("text-[10px]", asset.depreciation! > 25 ? "bg-red-500/10 text-red-400 border-red-500/20" : asset.depreciation! > 15 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-green-500/10 text-green-400 border-green-500/20")}>
                            {asset.depreciation}%/yr
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ══════════ MAINTENANCE ══════════ */}
        {activeTab === "maintenance" && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "In Maintenance", value: filteredAssets.filter(a => a.status === "maintenance").length, icon: Wrench, color: "bg-blue-500/10 text-blue-400" },
                { label: "Critical Alerts", value: filteredAssets.filter(a => a.status === "critical").length, icon: AlertCircle, color: "bg-red-500/10 text-red-400" },
                { label: "Expiring Soon", value: filteredAssets.filter(a => a.status === "expiring").length, icon: Clock, color: "bg-orange-500/10 text-orange-400" },
                { label: "Good Condition", value: filteredAssets.filter(a => a.condition === "excellent" || a.condition === "good").length, icon: CheckCircle2, color: "bg-green-500/10 text-green-400" },
              ].map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <Card key={i} className="border-0 bg-card/60">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-muted-foreground">{kpi.label}</p>
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", kpi.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-2xl font-bold">{kpi.value}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Condition Overview */}
            <Card className="border-0 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Asset Health Overview</CardTitle>
                <CardDescription>Condition ratings across all tracked assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {(["excellent", "good", "fair", "poor"] as AssetCondition[]).map(cond => {
                    const cc = CONDITION_CONFIG[cond];
                    const count = filteredAssets.filter(a => a.condition === cond).length;
                    const pct = filteredAssets.length > 0 ? (count / filteredAssets.length) * 100 : 0;
                    return (
                      <div key={cond} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={cn("text-sm font-medium", cc.color)}>{cc.label}</span>
                          <span className="text-sm font-bold">{count}</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                        <p className="text-xs text-muted-foreground">{pct.toFixed(0)}% of assets</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Tasks */}
            <Card className="border-0 bg-card/60">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Maintenance Queue</CardTitle>
                  <CardDescription>Assets requiring attention or currently being serviced</CardDescription>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5 h-8">
                  <Plus className="w-3.5 h-3.5" /> Schedule Task
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {maintenanceAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 mb-3 text-green-400/60" />
                    <p className="text-sm font-medium">All clear!</p>
                    <p className="text-xs">No assets require immediate attention.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {maintenanceAssets.map((asset, i, arr) => {
                      const Icon = asset.icon;
                      const sc = STATUS_CONFIG[asset.status];
                      const cc = CONDITION_CONFIG[asset.condition];
                      return (
                        <div key={asset.id} className="flex items-start gap-4 px-6 py-4 hover:bg-muted/20 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="text-sm font-semibold">{asset.name}</p>
                              <Badge className={cn("text-[10px] border", sc.color)}>{sc.label}</Badge>
                              <Badge variant="outline" className="text-[10px]">
                                <span className={cn("mr-1", cc.color)}>●</span>{cc.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{asset.category} · <span className="font-medium">{asset.location}</span></p>
                            {asset.notes && <p className="text-xs italic text-muted-foreground/80">{asset.notes}</p>}
                            {asset.expiryDate && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-orange-400">
                                <Clock className="w-3 h-3" /> Expires {asset.expiryDate}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <p className="text-sm font-semibold">{fmt(asset.value, true)}</p>
                            <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                              <Gauge className="w-3 h-3 mr-1" /> Inspect
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All assets condition list */}
            <Card className="border-0 bg-card/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Full Asset Condition Register</CardTitle>
                <CardDescription>Condition and health score for every asset</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-[auto_1fr_120px_100px_80px] gap-3 items-center px-5 py-2.5 bg-muted/30 border-b text-xs font-medium text-muted-foreground">
                  <span className="w-7" />
                  <span>Asset</span>
                  <span>Location</span>
                  <span>Condition</span>
                  <span className="text-center">Health</span>
                </div>
                <div className="divide-y max-h-80 overflow-y-auto">
                  {filteredAssets.map(asset => {
                    const Icon = asset.icon;
                    const cc = CONDITION_CONFIG[asset.condition];
                    return (
                      <div key={asset.id} className="grid grid-cols-[auto_1fr_120px_100px_80px] gap-3 items-center px-5 py-2.5 hover:bg-muted/20 transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <p className="text-xs font-medium truncate">{asset.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{asset.location}</p>
                        <span className={cn("text-xs font-medium", cc.color)}>{cc.label}</span>
                        <div className="flex justify-center">
                          <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                            style={{ borderColor: cc.pct > 80 ? "rgb(74,222,128)" : cc.pct > 60 ? "rgb(96,165,250)" : cc.pct > 40 ? "rgb(251,191,36)" : "rgb(248,113,113)" }}>
                            {cc.pct}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {showAddModal && <AddAssetModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
