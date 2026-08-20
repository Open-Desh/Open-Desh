import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  IndianRupee,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

interface BudgetViewProps {
  onBack?: () => void;
}

interface BudgetEntry {
  id: string;
  name: string;
  shortName: string;
  amountLakhCr: number; // in Lakh Crore INR
  percentage: number;
  color: string;
  description: string;
  keyItems?: string[];
  growthYoY: string;
  category: string;
}

const INFLOW_DATA: BudgetEntry[] = [
  {
    id: "gst",
    name: "Goods & Services Tax (GST)",
    shortName: "GST",
    amountLakhCr: 14.35,
    percentage: 28.0,
    color: "#2563eb", // brand Royal Blue
    description: "Indirect tax collected across pan-India supply of goods and services.",
    growthYoY: "+12.4%",
    category: "Tax Revenue",
  },
  {
    id: "borrowings",
    name: "Borrowings & Liabilities",
    shortName: "Borrowings",
    amountLakhCr: 11.27,
    percentage: 22.0,
    color: "#7c3aed", // violet-600
    description: "Sovereign market bonds, external debt, and national small savings fund.",
    growthYoY: "-3.1%",
    category: "Capital Receipts",
  },
  {
    id: "income_tax",
    name: "Personal Income Tax",
    shortName: "Income Tax",
    amountLakhCr: 9.73,
    percentage: 19.0,
    color: "#059669", // emerald-600
    description: "Direct tax levied on salaried individuals, professionals, and HUFs.",
    growthYoY: "+18.2%",
    category: "Tax Revenue",
  },
  {
    id: "corporate_tax",
    name: "Corporation Tax",
    shortName: "Corporate Tax",
    amountLakhCr: 8.71,
    percentage: 17.0,
    color: "#d97706", // amber-600
    description: "Direct tax levied on corporate profits of domestic and foreign firms.",
    growthYoY: "+10.8%",
    category: "Tax Revenue",
  },
  {
    id: "non_tax",
    name: "Non-Tax Revenue & Dividends",
    shortName: "Non-Tax Revenue",
    amountLakhCr: 4.61,
    percentage: 9.0,
    color: "#0891b2", // cyan-600
    description: "Surplus dividends from RBI, PSU dividends, 5G spectrum, and user fees.",
    growthYoY: "+34.5%",
    category: "Non-Tax Revenue",
  },
  {
    id: "customs_excise",
    name: "Customs & Union Excise",
    shortName: "Customs & Excise",
    amountLakhCr: 2.57,
    percentage: 5.0,
    color: "#db2777", // pink-600
    description: "Import duties on imported goods, crude oil excise, and specialized cesses.",
    growthYoY: "+4.1%",
    category: "Tax Revenue",
  },
];

const OUTFLOW_DATA: BudgetEntry[] = [
  {
    id: "infra",
    name: "Infrastructure & Transport",
    shortName: "Infrastructure",
    amountLakhCr: 11.11,
    percentage: 21.7,
    color: "#2563eb", // brand Royal Blue
    description: "Capital outlays for National Highways (NHAI), Railways & Smart Ports.",
    keyItems: ["PM Gati Shakti", "Bharatmala", "Railway Modernization"],
    growthYoY: "+17.2%",
    category: "Capital Expenditure (Capex)",
  },
  {
    id: "interest",
    name: "Interest & Debt Servicing",
    shortName: "Interest Payments",
    amountLakhCr: 10.50,
    percentage: 20.5,
    color: "#475569", // slate-600
    description: "Statutory interest repayments on sovereign government borrowings.",
    keyItems: ["Internal Market Debt", "External Loans", "NSSF Interest"],
    growthYoY: "+6.8%",
    category: "Transfers & Debt",
  },
  {
    id: "states_share",
    name: "States' Share of Taxes",
    shortName: "State Devolution",
    amountLakhCr: 8.76,
    percentage: 17.1,
    color: "#059669", // emerald-600
    description: "Constitutional transfer of 41% central tax revenue to States and UTs.",
    keyItems: ["15th Finance Commission Grants", "50-Yr Capex Loans"],
    growthYoY: "+11.3%",
    category: "Transfers & Debt",
  },
  {
    id: "defence",
    name: "Defence & National Security",
    shortName: "Defence",
    amountLakhCr: 6.22,
    percentage: 12.1,
    color: "#d97706", // amber-600
    description: "Armed forces modernization, indigenous defence equipment & border roads.",
    keyItems: ["Capital Acquisition", "Modernization", "Border Roads"],
    growthYoY: "+7.8%",
    category: "Capital Expenditure (Capex)",
  },
  {
    id: "schemes_rural",
    name: "Welfare & Rural Development",
    shortName: "Rural & Welfare",
    amountLakhCr: 4.25,
    percentage: 8.3,
    color: "#7c3aed", // violet-600
    description: "Rural road connectivity, PM Awas housing, and MGNREGA employment support.",
    keyItems: ["PM Awas Yojana", "MGNREGA", "Jal Jeevan Mission"],
    growthYoY: "+9.5%",
    category: "Revenue Expenditure",
  },
  {
    id: "subsidies",
    name: "Subsidies (Food & Fertilizer)",
    shortName: "Subsidies",
    amountLakhCr: 4.09,
    percentage: 8.0,
    color: "#db2777", // pink-600
    description: "Free food grain distribution (PMGKAY), fertilizer subsidy, and clean energy.",
    keyItems: ["PM Garib Kalyan Anna Yojana", "Fertilizer Subsidy"],
    growthYoY: "-2.4%",
    category: "Revenue Expenditure",
  },
  {
    id: "health_edu",
    name: "Health, Education & Skills",
    shortName: "Health & Education",
    amountLakhCr: 3.84,
    percentage: 7.5,
    color: "#0891b2", // cyan-600
    description: "National Health Mission, Ayushman Bharat, AIIMS, and Samagra Shiksha.",
    keyItems: ["Ayushman Bharat", "PM-SHRI Schools", "NHM"],
    growthYoY: "+13.1%",
    category: "Revenue Expenditure",
  },
  {
    id: "pensions",
    name: "Pensions & Public Administration",
    shortName: "Pensions",
    amountLakhCr: 2.47,
    percentage: 4.8,
    color: "#e11d48", // rose-600
    description: "Civilian & defence pensions (OROP) and administrative service operations.",
    keyItems: ["Defence Pensions (OROP)", "Civil Service Pensions"],
    growthYoY: "+4.2%",
    category: "Revenue Expenditure",
  },
];

const HISTORICAL_TREND = [
  { year: "FY 21-22", total: 37.9, capex: 5.9 },
  { year: "FY 22-23", total: 41.9, capex: 7.4 },
  { year: "FY 23-24", total: 45.0, capex: 9.5 },
  { year: "FY 24-25", total: 48.2, capex: 10.2 },
  { year: "FY 25-26", total: 51.24, capex: 11.11 },
];

export const BudgetView: React.FC<BudgetViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<"inflow" | "outflow">("inflow");
  const [searchQuery, setSearchQuery] = useState("");
  const [chartViewType, setChartViewType] = useState<"pie" | "bar">("pie");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const totalInflow = useMemo(
    () => INFLOW_DATA.reduce((sum, item) => sum + item.amountLakhCr, 0),
    []
  );
  const totalOutflow = useMemo(
    () => OUTFLOW_DATA.reduce((sum, item) => sum + item.amountLakhCr, 0),
    []
  );

  const currentDataset = activeTab === "inflow" ? INFLOW_DATA : OUTFLOW_DATA;

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return currentDataset;
    const q = searchQuery.toLowerCase().trim();
    return currentDataset.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.shortName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.keyItems && item.keyItems.some((k) => k.toLowerCase().includes(q)))
    );
  }, [currentDataset, searchQuery]);

  const pieChartData = useMemo(() => {
    return currentDataset.map((item) => ({
      name: item.shortName,
      fullName: item.name,
      value: item.amountLakhCr,
      percentage: item.percentage,
      color: item.color,
    }));
  }, [currentDataset]);

  const barChartData = useMemo(() => {
    return currentDataset.map((item) => ({
      name: item.shortName,
      fullName: item.name,
      amount: item.amountLakhCr,
      percentage: `${item.percentage}%`,
      color: item.color,
    }));
  }, [currentDataset]);

  return (
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* 1. Header: Edge-to-Edge Sticky Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              id="budget-back-btn"
              onClick={onBack}
              className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <IndianRupee className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">
                Union Budget
              </h1>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5 hidden sm:block">
                National Receipts & Expenditure Ledger
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 text-xs font-black text-blue-700">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>FY 2025-26</span>
        </div>
      </header>

      {/* 2. Coalition / Flow Tabs (Twitter/X-style Edge-to-Edge Tabs) */}
      <div className="grid grid-cols-2 bg-white border-b border-slate-200 text-xs font-bold">
        <button
          id="budget-tab-inflow"
          onClick={() => setActiveTab("inflow")}
          className={`py-3 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "inflow"
              ? "border-blue-600 text-blue-600 font-black bg-blue-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Revenue (Inflow)</span>
        </button>

        <button
          id="budget-tab-outflow"
          onClick={() => setActiveTab("outflow")}
          className={`py-3 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "outflow"
              ? "border-blue-600 text-blue-600 font-black bg-blue-50/20"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Expenditure (Outflow)</span>
        </button>
      </div>

      {/* 3. Edge-to-Edge Clean Summary Bar (Flush & Concise) */}
      <div className="grid grid-cols-2 divide-x divide-slate-200/80 bg-slate-50/70 border-b border-slate-200 px-4 py-3">
        {/* Receipts Metric */}
        <div
          onClick={() => setActiveTab("inflow")}
          className={`pr-3 cursor-pointer ${
            activeTab === "inflow" ? "opacity-100" : "opacity-75 hover:opacity-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
              Total Receipts
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              +11.8%
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              ₹{totalInflow.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-slate-500">Lakh Cr</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
            GST, Taxes & Receipts
          </p>
        </div>

        {/* Expenditure Metric */}
        <div
          onClick={() => setActiveTab("outflow")}
          className={`pl-3 cursor-pointer ${
            activeTab === "outflow" ? "opacity-100" : "opacity-75 hover:opacity-100"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
              Total Spending
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Capex ₹11.1L Cr
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900">
              ₹{totalOutflow.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-slate-500">Lakh Cr</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
            Infra, Defence & Welfare
          </p>
        </div>
      </div>

      {/* 4. Chart Visualization (Edge-to-Edge Flush Container) */}
      <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-blue-600" />
              {activeTab === "inflow" ? "Revenue Breakdown" : "Expenditure Allocation"}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {activeTab === "inflow" ? "Sources of government revenue" : "Sector-wise public outlays"}
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
            <button
              onClick={() => setChartViewType("pie")}
              className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                chartViewType === "pie"
                  ? "bg-white text-blue-600 shadow-2xs font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <PieIcon className="w-3 h-3" />
              <span>Donut</span>
            </button>
            <button
              onClick={() => setChartViewType("bar")}
              className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                chartViewType === "bar"
                  ? "bg-white text-blue-600 shadow-2xs font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              <span>Bar</span>
            </button>
          </div>
        </div>

        {/* Chart Content */}
        <div className="w-full">
          {chartViewType === "pie" ? (
            <div className="space-y-3">
              {/* Donut Chart Container */}
              <div className="w-full h-52 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke={activeIndex === index ? "#0f172a" : "#fff"}
                          strokeWidth={activeIndex === index ? 2 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, _: any, item: any) => [
                        `₹${Number(val).toFixed(2)} Lakh Cr (${item.payload.percentage}%)`,
                        item.payload.fullName,
                      ]}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "8px",
                        color: "#fff",
                        border: "none",
                        fontSize: "11px",
                        fontWeight: "600",
                        padding: "6px 10px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Centered Total Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    ₹{(activeTab === "inflow" ? totalInflow : totalOutflow).toFixed(1)}L Cr
                  </span>
                </div>
              </div>

              {/* Grid Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                {pieChartData.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs transition-all ${
                      activeIndex === idx
                        ? "bg-blue-50/60 border-blue-300 font-black"
                        : "bg-slate-50/60 border-slate-100"
                    }`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0 flex-1 flex items-center justify-between gap-1">
                      <span className="truncate text-[11px] font-bold text-slate-700">
                        {item.name}
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-900 shrink-0">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickFormatter={(val) => `₹${val}L`}
                  />
                  <Tooltip
                    formatter={(val: any, _: any, item: any) => [
                      `₹${Number(val).toFixed(2)} Lakh Cr (${item.payload.percentage})`,
                      item.payload.fullName,
                    ]}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderRadius: "8px",
                      color: "#fff",
                      border: "none",
                      fontSize: "11px",
                      fontWeight: "600",
                      padding: "6px 10px",
                    }}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* 5. Edge-to-Edge Search Bar */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2">
        <span className="text-xs font-black text-slate-900 uppercase tracking-wider shrink-0">
          {activeTab === "inflow" ? "Revenue Items" : "Spending Sectors"}
        </span>

        <div className="relative max-w-[220px] w-full">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-7.5 pr-6 py-1.5 bg-white border border-slate-200 rounded-full focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 text-slate-900 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 6. Edge-to-Edge Timeline List (Divide-Y Clean Rows) */}
      <div className="divide-y divide-slate-100 border-b border-slate-200">
        {filteredData.map((item) => (
          <article
            key={item.id}
            className="p-4 hover:bg-slate-50/50 transition-colors space-y-2.5"
          >
            {/* Header: Name + Share Badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <h3 className="text-sm font-black text-slate-900 leading-tight">
                  {item.name}
                </h3>
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                {item.percentage}% Share
              </span>
            </div>

            {/* Figures Row */}
            <div className="flex items-baseline justify-between pt-0.5">
              <span className="text-sm font-black text-slate-900">
                ₹{item.amountLakhCr.toFixed(2)} Lakh Crore
              </span>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {item.growthYoY} YoY
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed">
              {item.description}
            </p>

            {/* Key Schemes / Sub-Items */}
            {item.keyItems && item.keyItems.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {item.keyItems.map((scheme, sIdx) => (
                  <span
                    key={sIdx}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {scheme}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      {/* 7. 5-Year Historical Growth Trend (Edge-to-Edge Flush Section) */}
      <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
        <div>
          <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            5-Year Budget Trend (₹ Lakh Crore)
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Total Budget Size vs Capital Infrastructure Outlay
          </p>
        </div>

        <div className="w-full h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={HISTORICAL_TREND}
              margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCapex" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickFormatter={(val) => `₹${val}L`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderRadius: "8px",
                  color: "#fff",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "6px 10px",
                }}
                formatter={(val: any, name: any) => [
                  `₹${val} Lakh Cr`,
                  name === "total" ? "Total Budget Size" : "Capex Outlay",
                ]}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
                name="total"
              />
              <Area
                type="monotone"
                dataKey="capex"
                stroke="#059669"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCapex)"
                name="capex"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 8. Public Transparency Note (Flush Bottom) */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 text-slate-700 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <span className="font-black text-slate-900">Official Data Source: </span>
          Union Budget of India, Ministry of Finance & Reserve Bank of India reports.
        </div>
      </div>
    </div>
  );
};
