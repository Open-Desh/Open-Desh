import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  IndianRupee,
  TrendingUp,
  PieChart as PieIcon,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  X,
  Building2,
  Landmark,
  MapPin,
  Layers,
  CheckCircle2,
  FileText,
  Filter,
  Grid,
  BarChart3,
  Compass,
  SlidersHorizontal,
  Wallet,
  Users,
  Megaphone,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Info,
  ExternalLink,
  RotateCcw,
  Tag,
  Check,
  Calendar,
  ChevronRight,
  Droplets,
  Home,
  Briefcase,
  Route,
  Activity,
  Award,
  AlertCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Cell,
} from "recharts";
import { BudgetHierarchyNode, BudgetLevel, BudgetLineItem } from "../types";
import { getBudgetsDirect } from "../lib/firestoreSync";
import { REAL_INDIAN_BUDGET_DATA } from "../data/realBudgetData";
import { useLanguage } from "../context/LanguageContext";

interface BudgetViewProps {
  onBack?: () => void;
  onOpenCompose?: (mention?: string, defaultText?: string) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({ onBack, onOpenCompose }) => {
  const { language, t } = useLanguage();

  // State
  const [budgets, setBudgets] = useState<BudgetHierarchyNode[]>(REAL_INDIAN_BUDGET_DATA);
  const [viewMode, setViewMode] = useState<"landing" | "wheel_hub" | "detail_overview" | "data_ledger">("landing");
  const [selectedLevel, setSelectedLevel] = useState<BudgetLevel>("national");
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>("budget_national_india");
  const [activeTab, setActiveTab] = useState<"overview" | "outflow" | "inflow" | "schemes" | "trends">("overview");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>("all");
  const [isHeaderSearchOpen, setIsHeaderSearchOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<BudgetLineItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [showUpdatesModal, setShowUpdatesModal] = useState<boolean>(false);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showMoneyTrailModal, setShowMoneyTrailModal] = useState<boolean>(false);
  const [showWorksModal, setShowWorksModal] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // Advanced Filter Modal States
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterState, setFilterState] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterBudgetRange, setFilterBudgetRange] = useState<string>("all");
  const [filterFiscalYear, setFilterFiscalYear] = useState<string>("all");
  const [overviewChartTab, setOverviewChartTab] = useState<"chart" | "split" | "metrics">("chart");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const landingSearchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch from Firestore on mount
  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        const data = await getBudgetsDirect();
        if (data && data.length > 0) {
          const firestoreMap = new Map(data.map((b) => [b.id, b]));
          const combined = REAL_INDIAN_BUDGET_DATA.map((defaultNode) => {
            const remote = firestoreMap.get(defaultNode.id);
            if (!remote) return defaultNode;
            return {
              ...defaultNode,
              ...remote,
            };
          });
          setBudgets(combined);
        } else {
          setBudgets(REAL_INDIAN_BUDGET_DATA);
        }
      } catch (err) {
        console.warn("Error loading budgets from Firestore:", err);
        setBudgets(REAL_INDIAN_BUDGET_DATA);
      }
    };
    fetchBudgetData();
  }, []);

  // Click outside to collapse search dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsHeaderSearchOpen(false);
      }
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node) &&
        landingSearchInputRef.current &&
        !landingSearchInputRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Escape key closes search & modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isHeaderSearchOpen) setIsHeaderSearchOpen(false);
        if (showInfoModal) setShowInfoModal(false);
        if (showUpdatesModal) setShowUpdatesModal(false);
        if (showFilterModal) setShowFilterModal(false);
        if (showMoneyTrailModal) setShowMoneyTrailModal(false);
        if (showWorksModal) setShowWorksModal(false);
        setIsSearchFocused(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHeaderSearchOpen, showInfoModal, showUpdatesModal, showFilterModal, showMoneyTrailModal, showWorksModal]);

  // Focus search input when header search is opened
  useEffect(() => {
    if (isHeaderSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isHeaderSearchOpen]);

  // Available nodes for current selected level
  const availableNodesForLevel = useMemo(() => {
    return budgets.filter((b) => b.level === selectedLevel);
  }, [budgets, selectedLevel]);

  // All unique state names across dataset for dropdowns
  const allStateNames = useMemo(() => {
    const set = new Set<string>();
    budgets.forEach((b) => {
      if (b.level === "state") {
        const cleanName = b.name.split("(")[0].trim();
        set.add(cleanName);
      }
      if (b.parentState) set.add(b.parentState);
    });
    return Array.from(set).sort();
  }, [budgets]);

  // Unique list of parent states for filtering in District / Village views
  const uniqueStates = useMemo(() => {
    const set = new Set<string>();
    availableNodesForLevel.forEach((n) => {
      if (n.parentState) set.add(n.parentState);
    });
    return Array.from(set).sort();
  }, [availableNodesForLevel]);

  // Current active budget node
  const activeNode = useMemo(() => {
    const found = budgets.find((b) => b.id === selectedBudgetId);
    if (found) return found;
    return availableNodesForLevel[0] || budgets[0] || REAL_INDIAN_BUDGET_DATA[0];
  }, [budgets, selectedBudgetId, availableNodesForLevel]);

  // Popular States for landing page showcase
  const popularStates = useMemo(() => {
    const stateBudgets = budgets.filter((b) => b.level === "state");
    const popularKeys = [
      "Uttar Pradesh",
      "Maharashtra",
      "Karnataka",
      "Tamil Nadu",
      "Gujarat",
      "Rajasthan",
      "West Bengal",
      "Madhya Pradesh",
      "Bihar",
      "Telangana",
    ];

    const ordered: {
      id: string;
      name: string;
      budgetDisplay: string;
      utilizationPercent: number;
      image: string;
      node: BudgetHierarchyNode;
    }[] = [];

    popularKeys.forEach((key) => {
      const match = stateBudgets.find((s) => s.name.toLowerCase().includes(key.toLowerCase()));
      if (match) {
        let util = 72;
        if (key === "Maharashtra") util = 68;
        if (key === "Karnataka") util = 75;
        if (key === "Tamil Nadu") util = 71;
        if (key === "Gujarat") util = 69;
        if (key === "Rajasthan") util = 70;
        if (key === "West Bengal") util = 74;
        if (key === "Madhya Pradesh") util = 73;
        if (key === "Bihar") util = 67;
        if (key === "Telangana") util = 76;

        let display = `₹${(match.totalBudgetCr / 100000).toFixed(2)} Lakh Cr`;
        if (match.totalBudgetCr < 100000) {
          display = `₹${match.totalBudgetCr.toLocaleString("en-IN")} Cr`;
        }

        ordered.push({
          id: match.id,
          name: key,
          budgetDisplay: display,
          utilizationPercent: util,
          image: match.image || "https://images.unsplash.com/photo-1597041593980-4c2432819d77?w=400&auto=format&fit=crop&q=80",
          node: match,
        });
      }
    });

    return ordered;
  }, [budgets]);

  // Level change handler
  const handleLevelChange = (level: BudgetLevel) => {
    setSelectedLevel(level);
    setSelectedStateFilter("all");
    setCategoryFilter("all");
    const nodes = budgets.filter((b) => b.level === level);
    if (nodes.length > 0) {
      setSelectedBudgetId(nodes[0].id);
    }
    if (level === "national") {
      setViewMode("detail_overview");
    } else {
      setViewMode("wheel_hub"); // Open directory grid
    }
  };

  // Select node from landing / directory / search to open detail overview immediately
  const handleSelectNode = (node: BudgetHierarchyNode, targetTab?: "overview" | "outflow" | "inflow" | "schemes" | "trends") => {
    setSelectedBudgetId(node.id);
    setSelectedLevel(node.level);
    setActiveTab(targetTab || "overview");
    setViewMode("detail_overview");
    setCategoryFilter("all");
    setIsSearchFocused(false);
    setIsHeaderSearchOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filtered line items (inflows or outflows)
  const currentItems = activeTab === "inflow" ? activeNode.inflows : activeNode.outflows;

  const categories = useMemo(() => {
    const set = new Set<string>();
    currentItems?.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [currentItems]);

  const filteredItems = useMemo(() => {
    if (!currentItems) return [];
    return currentItems.filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.nodalMinistryOrDept &&
          item.nodalMinistryOrDept.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat = categoryFilter === "all" || item.category === categoryFilter;

      return matchSearch && matchCat;
    });
  }, [currentItems, searchQuery, categoryFilter]);

  // Filtered schemes
  const filteredSchemes = useMemo(() => {
    if (!activeNode.keySchemes) return [];
    if (!searchQuery) return activeNode.keySchemes;
    return activeNode.keySchemes.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeNode.keySchemes, searchQuery]);

  // Filtered nodes in directory based on search, state filter
  const filteredWheelNodes = useMemo(() => {
    return availableNodesForLevel.filter((node) => {
      const matchesSearch =
        !searchQuery ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (node.hindiName && node.hindiName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (node.parentState && node.parentState.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (node.parentDistrict && node.parentDistrict.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (node.capitalOrHQ && node.capitalOrHQ.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (node.tagline && node.tagline.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesState =
        selectedStateFilter === "all" ||
        node.parentState === selectedStateFilter;

      return matchesSearch && matchesState;
    });
  }, [availableNodesForLevel, searchQuery, selectedStateFilter]);

  // =========================================================================
  // ADVANCED DEEP SEARCH ENGINE
  // =========================================================================
  interface SearchMatchResult {
    id: string;
    node: BudgetHierarchyNode;
    title: string;
    subtitle: string;
    type: "state" | "district" | "village" | "national" | "scheme" | "outflow" | "inflow";
    typeLabel: string;
    amountDisplay: string;
    icon: string;
    targetTab?: "overview" | "outflow" | "inflow" | "schemes" | "trends";
  }

  const globalSearchResults = useMemo((): SearchMatchResult[] => {
    if (!searchQuery || searchQuery.trim().length === 0) return [];
    const q = searchQuery.toLowerCase().trim();
    const results: SearchMatchResult[] = [];

    // 1. Check direct budget nodes
    budgets.forEach((node) => {
      const nodeName = node.name.toLowerCase();
      const hindiName = (node.hindiName || "").toLowerCase();
      const parentState = (node.parentState || "").toLowerCase();
      const parentDistrict = (node.parentDistrict || "").toLowerCase();
      const capitalOrHQ = (node.capitalOrHQ || "").toLowerCase();
      const tagline = (node.tagline || "").toLowerCase();
      const audit = (node.auditNotes || "").toLowerCase();

      let matched = false;
      let matchSubtitle = "";

      if (nodeName.includes(q) || hindiName.includes(q)) {
        matched = true;
        matchSubtitle = node.parentState
          ? `${node.level.toUpperCase()} in ${node.parentState}`
          : node.tagline || `FY ${node.fiscalYear}`;
      } else if (parentState.includes(q) || parentDistrict.includes(q) || capitalOrHQ.includes(q)) {
        matched = true;
        matchSubtitle = `${node.level.toUpperCase()} • ${node.parentDistrict || node.capitalOrHQ || ""}, ${node.parentState || ""}`;
      } else if (tagline.includes(q) || audit.includes(q)) {
        matched = true;
        matchSubtitle = node.tagline || `Budget: ₹${node.totalBudgetCr} Cr`;
      }

      if (matched) {
        const typeLabels: Record<string, string> = {
          national: "National",
          state: "State / UT",
          district: "District",
          village: "Gram Panchayat",
        };

        const cleanTitle = language === "hi" && node.hindiName ? node.hindiName.split("बजट")[0].trim() : node.name;

        let display = `₹${(node.totalBudgetCr / 100000).toFixed(2)} Lakh Cr`;
        if (node.totalBudgetCr < 100000) {
          display = `₹${node.totalBudgetCr.toLocaleString("en-IN")} Cr`;
        }

        results.push({
          id: `node_${node.id}`,
          node: node,
          title: cleanTitle,
          subtitle: matchSubtitle,
          type: node.level as any,
          typeLabel: typeLabels[node.level] || node.level,
          amountDisplay: display,
          icon: node.emblemIcon || (node.level === "state" ? "🏛️" : node.level === "district" ? "🏢" : "🏡"),
          targetTab: "overview",
        });
      }

      // 2. Check Key Schemes inside this node
      if (node.keySchemes) {
        node.keySchemes.forEach((sch) => {
          if (sch.name.toLowerCase().includes(q) || sch.description.toLowerCase().includes(q)) {
            results.push({
              id: `scheme_${node.id}_${sch.name}`,
              node: node,
              title: sch.name,
              subtitle: `Scheme under ${node.name.split("(")[0]} (${sch.beneficiaryTarget || "Flagship"})`,
              type: "scheme",
              typeLabel: "Scheme",
              amountDisplay: `₹${sch.allocatedCr.toLocaleString("en-IN")} Cr`,
              icon: "📜",
              targetTab: "overview",
            });
          }
        });
      }

      // 3. Check Outflows
      if (node.outflows) {
        node.outflows.forEach((item) => {
          if (
            item.name.toLowerCase().includes(q) ||
            item.shortName.toLowerCase().includes(q) ||
            (item.category && item.category.toLowerCase().includes(q)) ||
            (item.nodalMinistryOrDept && item.nodalMinistryOrDept.toLowerCase().includes(q))
          ) {
            results.push({
              id: `outflow_${node.id}_${item.id}`,
              node: node,
              title: item.name,
              subtitle: `Expenditure (${item.category || "Capex"}) • ${node.name.split("(")[0]}`,
              type: "outflow",
              typeLabel: "Expenditure",
              amountDisplay: `₹${item.allocatedAmountCr.toLocaleString("en-IN")} Cr`,
              icon: "💸",
              targetTab: "outflow",
            });
          }
        });
      }

      // 4. Check Inflows
      if (node.inflows) {
        node.inflows.forEach((item) => {
          if (
            item.name.toLowerCase().includes(q) ||
            item.shortName.toLowerCase().includes(q) ||
            (item.category && item.category.toLowerCase().includes(q))
          ) {
            results.push({
              id: `inflow_${node.id}_${item.id}`,
              node: node,
              title: item.name,
              subtitle: `Revenue (${item.category || "Tax"}) • ${node.name.split("(")[0]}`,
              type: "inflow",
              typeLabel: "Revenue",
              amountDisplay: `₹${item.allocatedAmountCr.toLocaleString("en-IN")} Cr`,
              icon: "💰",
              targetTab: "inflow",
            });
          }
        });
      }
    });

    return results
      .sort((a, b) => {
        const aExact = a.title.toLowerCase().startsWith(q) ? 1 : 0;
        const bExact = b.title.toLowerCase().startsWith(q) ? 1 : 0;
        return bExact - aExact;
      })
      .slice(0, 15);
  }, [budgets, searchQuery, language]);

  // Execute Search
  const handleExecuteSearch = (customQuery?: string) => {
    const queryToUse = customQuery !== undefined ? customQuery : searchQuery;
    if (!queryToUse.trim()) return;

    const matches = globalSearchResults;
    if (matches.length > 0) {
      const topMatch = matches[0];
      handleSelectNode(topMatch.node, topMatch.targetTab);
      return;
    }

    const q = queryToUse.toLowerCase().trim();
    const fallbackNode = budgets.find(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.hindiName && b.hindiName.toLowerCase().includes(q)) ||
        (b.parentState && b.parentState.toLowerCase().includes(q)) ||
        (b.parentDistrict && b.parentDistrict.toLowerCase().includes(q))
    );

    if (fallbackNode) {
      handleSelectNode(fallbackNode);
    } else {
      setSelectedLevel("state");
      setViewMode("wheel_hub");
    }
  };

  // Quick Search Tags
  const quickSearchTags = [
    { label: "Arunachal Pradesh", query: "Arunachal", icon: "🏔️" },
    { label: "Rajasthan", query: "Rajasthan", icon: "🏛️" },
    { label: "Uttar Pradesh", query: "Uttar Pradesh", icon: "🏛️" },
    { label: "Maharashtra", query: "Maharashtra", icon: "🏛️" },
    { label: "Ranchi District", query: "Ranchi", icon: "🏢" },
    { label: "Gram Panchayat", query: "Panchayat", icon: "🏡" },
    { label: "Jal Jeevan", query: "Jal Jeevan", icon: "🚰" },
    { label: "Highways & Capex", query: "Highway", icon: "🛣️" },
  ];

  // Apply Filter Modal selections
  const handleApplyFilterModal = () => {
    setShowFilterModal(false);

    if (filterState !== "all") {
      const stateNode = budgets.find(
        (b) =>
          b.level === "state" &&
          (b.name.toLowerCase().includes(filterState.toLowerCase()) ||
            (b.parentState && b.parentState.toLowerCase().includes(filterState.toLowerCase())))
      );
      if (stateNode) {
        handleSelectNode(stateNode);
        return;
      }
    }

    if (filterLevel !== "all") {
      setSelectedLevel(filterLevel as BudgetLevel);
      if (filterState !== "all") {
        setSelectedStateFilter(filterState);
      }
      setViewMode("wheel_hub");
      return;
    }

    setViewMode("wheel_hub");
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilterLevel("all");
    setFilterState("all");
    setFilterCategory("all");
    setFilterBudgetRange("all");
    setFilterFiscalYear("all");
    setSelectedStateFilter("all");
    setCategoryFilter("all");
    setSearchQuery("");
  };

  // Currency format helper
  const formatAmount = (crAmount: number) => {
    if (crAmount >= 100000) {
      return `₹${(crAmount / 100000).toFixed(2)} Lakh Cr`;
    }
    if (crAmount >= 1000) {
      return `₹${(crAmount / 1000).toFixed(2)}k Cr`;
    }
    if (crAmount >= 1) {
      return `₹${crAmount.toLocaleString("en-IN", { maximumFractionDigits: 1 })} Cr`;
    }
    const lakhs = crAmount * 100;
    return `₹${lakhs.toFixed(1)} Lakhs`;
  };

  // Helper for displaying entity name cleanly
  const getDisplayName = (node: BudgetHierarchyNode) => {
    if (language === "hi" && node.hindiName) {
      return node.hindiName.split("बजट")[0].split("योजना")[0].trim();
    }
    return node.name.split("(")[0].trim();
  };

  // Helper for population format
  const formatPopulation = (pop?: number) => {
    if (!pop) return "15.7 Lakh";
    if (pop >= 10000000) {
      return `${(pop / 10000000).toFixed(1)} Cr`;
    }
    if (pop >= 100000) {
      return `${(pop / 100000).toFixed(1)} Lakh`;
    }
    return pop.toLocaleString("en-IN");
  };

  // Helper for area format
  const formatArea = (node: BudgetHierarchyNode) => {
    if (node.areaSqKm) return String(node.areaSqKm);
    if (node.level === "national") return "3.287M sq km";
    if (node.level === "state") return "83,743 sq km";
    if (node.level === "district") return "4,200 sq km";
    return "24.5 sq km";
  };

  // Helper for capital / HQ
  const formatCapitalOrHQ = (node: BudgetHierarchyNode) => {
    if (node.capitalOrHQ) return node.capitalOrHQ;
    if (node.parentDistrict) return node.parentDistrict;
    if (node.parentState) return node.parentState;
    return "Capital HQ";
  };

  // Helper for calculating Overview Metrics matching the exact mockup
  const overviewMetrics = useMemo(() => {
    const approved = activeNode.totalBudgetCr;
    const released = activeNode.releasedCr ?? Math.round(approved * 0.875);
    const spent = activeNode.spentCr ?? Math.round(approved * 0.721);
    const balance = Math.max(0, approved - spent);
    const workValue = activeNode.workValueCr ?? Math.round(approved * 0.619);

    const releasedPercent = approved > 0 ? ((released / approved) * 100).toFixed(1) : "87.5";
    const spentPercent = approved > 0 ? ((spent / approved) * 100).toFixed(1) : "72.1";
    const balancePercent = approved > 0 ? ((balance / approved) * 100).toFixed(1) : "27.9";
    const workValuePercent = approved > 0 ? ((workValue / approved) * 100).toFixed(1) : "61.9";

    return {
      approved,
      released,
      spent,
      balance,
      workValue,
      releasedPercent,
      spentPercent,
      balancePercent,
      workValuePercent,
    };
  }, [activeNode]);

  // Visual Chart Data for Budget Overview
  const overviewChartData = useMemo(() => {
    const gross = activeNode.grossExpenditureCr || activeNode.totalBudgetCr || 0;
    const isUtAllocation = activeNode.budgetType === "union_budget_ut_allocation";

    if (isUtAllocation) {
      const capex = activeNode.capexCr || Math.round(gross * 0.25);
      const revExp = activeNode.revenueExpCr || Math.max(0, gross - capex);

      return [
        {
          key: "allocation",
          name: "Union Grant / Allocation",
          amountCr: gross,
          color: "#2563eb",
          category: "Union Budget Allocation",
          description: "Union Budget Grant Allocation for the UT",
        },
        {
          key: "revexp",
          name: "Operational Outlay",
          amountCr: revExp,
          color: "#7c3aed",
          category: "Operational / Welfare",
          description: "Administrative services, welfare & local operations",
        },
        {
          key: "capex",
          name: "Capital Outlay",
          amountCr: capex,
          color: "#f59e0b",
          category: "Capex Infrastructure",
          description: "Capital projects, ports, roads & island asset creation",
        },
      ];
    }

    const net = activeNode.netExpenditureCr || gross;
    const revReceipts = activeNode.revenueReceiptsCr || activeNode.totalRevenueCr || Math.round(gross * 0.82);
    const capex = activeNode.capitalOutlayCr || activeNode.capexCr || Math.round(gross * 0.2);
    const revExp = activeNode.revenueExpenditureCr || activeNode.revenueExpCr || Math.max(0, gross - capex);
    const debtRepay = activeNode.debtRepaymentCr || (gross > net ? gross - net : 0);

    const items = [
      {
        key: "outlay",
        name: activeNode.grossExpenditureCr ? "Gross Exp." : "Total Outlay",
        amountCr: gross,
        color: "#2563eb",
        category: "Total Budget",
        description: "Total State Budget Gross Expenditure",
      },
    ];

    if (activeNode.netExpenditureCr && activeNode.netExpenditureCr !== gross) {
      items.push({
        key: "net_exp",
        name: "Net Exp.",
        amountCr: net,
        color: "#0284c7",
        category: "Net Outlay",
        description: "Net Outlay (excluding debt repayment)",
      });
    }

    items.push(
      {
        key: "revenue",
        name: "Revenue Receipts",
        amountCr: revReceipts,
        color: "#059669",
        category: "Receipts",
        description: "Own Tax + Non-Tax + Central Devolutions",
      },
      {
        key: "revexp",
        name: "Revenue Exp.",
        amountCr: revExp,
        color: "#7c3aed",
        category: "Operational",
        description: "Salaries, Subsidies, Welfare DBTs & Operations",
      },
      {
        key: "capex",
        name: "Capital Outlay",
        amountCr: capex,
        color: "#f59e0b",
        category: "Capex Assets",
        description: "Highways, Irrigation, Energy & Asset Creation",
      }
    );

    if (debtRepay > 0) {
      items.push({
        key: "debt",
        name: "Debt Repayment",
        amountCr: debtRepay,
        color: "#ef4444",
        category: "Debt Servicing",
        description: "Principal repayment & public debt liability clearance",
      });
    }

    return items;
  }, [activeNode]);

  // Helper for works progress
  const worksProgress = useMemo(() => {
    const total = activeNode.totalWorks ?? (activeNode.level === "national" ? 24500 : activeNode.level === "state" ? 1802 : 340);
    const completed = activeNode.completedWorks ?? Math.round(total * 0.712);
    const inProgress = activeNode.inProgressWorks ?? Math.round(total * 0.242);
    const delayed = activeNode.delayedWorks ?? Math.max(0, total - completed - inProgress);

    return { total, completed, inProgress, delayed };
  }, [activeNode]);

  // Helper for beneficiaries
  const beneficiaries = useMemo(() => {
    if (activeNode.ruralBeneficiaries && activeNode.citizenBeneficiaries) {
      return {
        rural: activeNode.ruralBeneficiaries,
        citizen: activeNode.citizenBeneficiaries,
      };
    }
    if (activeNode.level === "national") {
      return { rural: "18.5 Cr", citizen: "8.62 Cr" };
    }
    if (activeNode.level === "state") {
      return { rural: "18.5 Cr", citizen: "8.62 Cr" };
    }
    return { rural: "1.2 Lakh", citizen: "85k" };
  }, [activeNode]);

  // Top 5 "Where is the money going?" items matching mockup styling
  const topOutflowItems = useMemo(() => {
    if (!activeNode.outflows || activeNode.outflows.length === 0) {
      return [
        {
          id: "def_1",
          name: "Infrastructure, Roads & Railways",
          allocatedAmountCr: Math.round(activeNode.totalBudgetCr * 0.23),
          percentage: 23.0,
          color: "bg-blue-600",
          icon: <Building2 className="w-4 h-4 text-blue-600" />,
          bgIcon: "bg-blue-50",
        },
        {
          id: "def_2",
          name: "Interest Payments & Debt Servicing",
          allocatedAmountCr: Math.round(activeNode.totalBudgetCr * 0.218),
          percentage: 21.8,
          color: "bg-rose-500",
          icon: <IndianRupee className="w-4 h-4 text-rose-500" />,
          bgIcon: "bg-rose-50",
        },
        {
          id: "def_3",
          name: "Rural Development, PMAY & MGNREGA",
          allocatedAmountCr: Math.round(activeNode.totalBudgetCr * 0.088),
          percentage: 8.8,
          color: "bg-purple-600",
          icon: <Home className="w-4 h-4 text-purple-600" />,
          bgIcon: "bg-purple-50",
        },
        {
          id: "def_4",
          name: "Education",
          allocatedAmountCr: Math.round(activeNode.totalBudgetCr * 0.079),
          percentage: 7.9,
          color: "bg-teal-500",
          icon: <Landmark className="w-4 h-4 text-teal-600" />,
          bgIcon: "bg-teal-50",
        },
        {
          id: "def_5",
          name: "Health & Family Welfare",
          allocatedAmountCr: Math.round(activeNode.totalBudgetCr * 0.041),
          percentage: 4.1,
          color: "bg-amber-500",
          icon: <Activity className="w-4 h-4 text-amber-600" />,
          bgIcon: "bg-amber-50",
        },
      ];
    }

    const palette = [
      { color: "bg-blue-600", iconColor: "text-blue-600", bgIcon: "bg-blue-50" },
      { color: "bg-rose-500", iconColor: "text-rose-500", bgIcon: "bg-rose-50" },
      { color: "bg-purple-600", iconColor: "text-purple-600", bgIcon: "bg-purple-50" },
      { color: "bg-teal-500", iconColor: "text-teal-600", bgIcon: "bg-teal-50" },
      { color: "bg-amber-500", iconColor: "text-amber-600", bgIcon: "bg-amber-50" },
    ];

    return activeNode.outflows.slice(0, 5).map((item, idx) => {
      const p = palette[idx % palette.length];
      const pct = activeNode.totalBudgetCr > 0 ? (item.allocatedAmountCr / activeNode.totalBudgetCr) * 100 : item.percentage;

      let iconElement = <Building2 className={`w-4 h-4 ${p.iconColor}`} />;
      if (item.name.toLowerCase().includes("interest") || item.name.toLowerCase().includes("debt")) {
        iconElement = <IndianRupee className={`w-4 h-4 ${p.iconColor}`} />;
      } else if (item.name.toLowerCase().includes("rural") || item.name.toLowerCase().includes("awas")) {
        iconElement = <Home className={`w-4 h-4 ${p.iconColor}`} />;
      } else if (item.name.toLowerCase().includes("edu") || item.name.toLowerCase().includes("school")) {
        iconElement = <Landmark className={`w-4 h-4 ${p.iconColor}`} />;
      } else if (item.name.toLowerCase().includes("health") || item.name.toLowerCase().includes("welfare")) {
        iconElement = <Activity className={`w-4 h-4 ${p.iconColor}`} />;
      }

      return {
        id: item.id,
        name: item.name,
        allocatedAmountCr: item.allocatedAmountCr,
        percentage: Number(pct.toFixed(1)),
        color: p.color,
        icon: iconElement,
        bgIcon: p.bgIcon,
      };
    });
  }, [activeNode]);

  // Major Schemes formatted for the 2nd Card
  const majorSchemesList = useMemo(() => {
    if (activeNode.keySchemes && activeNode.keySchemes.length > 0) {
      return activeNode.keySchemes.slice(0, 4).map((s, idx) => {
        let iconElem = <Home className="w-5 h-5 text-emerald-600" />;
        let bgStyle = "bg-emerald-50 text-emerald-600";
        if (s.name.toLowerCase().includes("nrega") || s.name.toLowerCase().includes("wage")) {
          iconElem = <Briefcase className="w-5 h-5 text-purple-600" />;
          bgStyle = "bg-purple-50 text-purple-600";
        } else if (s.name.toLowerCase().includes("pmgsy") || s.name.toLowerCase().includes("road")) {
          iconElem = <Route className="w-5 h-5 text-amber-600" />;
          bgStyle = "bg-amber-50 text-amber-600";
        } else if (s.name.toLowerCase().includes("jal") || s.name.toLowerCase().includes("water")) {
          iconElem = <Droplets className="w-5 h-5 text-blue-600" />;
          bgStyle = "bg-blue-50 text-blue-600";
        }

        const approvedStr = s.approvedDisplay || `₹${s.allocatedCr} Cr`;
        const spentStr = s.spentDisplay || `₹${s.utilizedCr || Math.round(s.allocatedCr * 0.86)} Cr`;
        const utilPercent = s.allocatedCr > 0 && s.utilizedCr ? `${((s.utilizedCr / s.allocatedCr) * 100).toFixed(1)}%` : "86.1%";

        return {
          name: s.name,
          approvedStr,
          spentStr,
          utilPercent,
          iconElem,
          bgStyle,
        };
      });
    }

    // Default Fallback matching mockup
    return [
      {
        name: "PMAY-Gramin",
        approvedStr: "₹80.6 Cr",
        spentStr: "₹69.4 Cr",
        utilPercent: "86.1%",
        iconElem: <Home className="w-5 h-5 text-emerald-600" />,
        bgStyle: "bg-emerald-50 text-emerald-600",
      },
      {
        name: "MGNREGA",
        approvedStr: "₹86.0 Cr",
        spentStr: "₹74.0 Cr",
        utilPercent: "86.0%",
        iconElem: <Briefcase className="w-5 h-5 text-purple-600" />,
        bgStyle: "bg-purple-50 text-purple-600",
      },
      {
        name: "PMGSY",
        approvedStr: "₹19.0 Cr",
        spentStr: "₹14.6 Cr",
        utilPercent: "76.8%",
        iconElem: <Route className="w-5 h-5 text-amber-600" />,
        bgStyle: "bg-amber-50 text-amber-600",
      },
      {
        name: "Jal Jeevan Mission",
        approvedStr: "₹12.5 Cr",
        spentStr: "₹9.8 Cr",
        utilPercent: "78.4%",
        iconElem: <Droplets className="w-5 h-5 text-blue-600" />,
        bgStyle: "bg-blue-50 text-blue-600",
      },
    ];
  }, [activeNode]);

  const tierOptions: { key: BudgetLevel; label: string; icon: React.ReactNode }[] = [
    {
      key: "national",
      label: language === "hi" ? "राष्ट्रीय" : "National",
      icon: <Landmark className="w-3.5 h-3.5" />,
    },
    {
      key: "state",
      label: language === "hi" ? "राज्य व UTs" : "States & UTs",
      icon: <Building2 className="w-3.5 h-3.5" />,
    },
    {
      key: "district",
      label: language === "hi" ? "जिले" : "Districts",
      icon: <Layers className="w-3.5 h-3.5" />,
    },
    {
      key: "village",
      label: language === "hi" ? "ग्राम पंचायतें" : "Panchayats",
      icon: <MapPin className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/60 text-slate-900 pb-24">
      {/* 1. STICKY HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3 relative">
          {isHeaderSearchOpen ? (
            /* Full-width Search Bar Mode */
            <div
              ref={searchContainerRef}
              className="flex items-center w-full gap-2 animate-in fade-in duration-200"
            >
              <button
                onClick={() => {
                  setIsHeaderSearchOpen(false);
                  setSearchQuery("");
                }}
                aria-label="Close search"
                className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleExecuteSearch();
                    }
                  }}
                  placeholder={
                    language === "hi"
                      ? "राज्य, जिला, पंचायत, योजना या खर्च खोजें..."
                      : "Search State, District, Panchayat, Scheme..."
                  }
                  className="w-full pl-9 pr-9 py-2 text-sm bg-slate-100 rounded-full border-none focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-900 placeholder:text-slate-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Header Live Search Results Dropdown */}
              <div className="absolute top-full left-0 right-0 mt-1 mx-2 sm:mx-4 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {searchQuery.trim().length === 0 ? (
                  <div className="p-3 bg-slate-50/80 border-b border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Popular Quick Searches</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {quickSearchTags.map((tag) => (
                        <button
                          key={tag.label}
                          onClick={() => {
                            setSearchQuery(tag.query);
                            handleExecuteSearch(tag.query);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 cursor-pointer shadow-2xs transition-all"
                        >
                          <span>{tag.icon}</span>
                          <span>{tag.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : globalSearchResults.length > 0 ? (
                  <div>
                    <div className="p-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                        <Search className="w-3 h-3 text-blue-600" />
                        Found {globalSearchResults.length} match{globalSearchResults.length > 1 ? "es" : ""} in database
                      </span>
                      <span className="text-[10px] text-blue-600 font-medium">
                        Press Enter or tap to jump
                      </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {globalSearchResults.map((res) => (
                        <div
                          key={res.id}
                          onClick={() => {
                            handleSelectNode(res.node, res.targetTab);
                          }}
                          className="p-3 flex items-center justify-between hover:bg-blue-50/80 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-3 pr-2 min-w-0">
                            <span className="text-xl shrink-0">{res.icon}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 truncate">
                                  {res.title}
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                                    res.type === "state"
                                      ? "bg-blue-100 text-blue-700"
                                      : res.type === "district"
                                      ? "bg-purple-100 text-purple-700"
                                      : res.type === "village"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : res.type === "scheme"
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {res.typeLabel}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                                {res.subtitle}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs sm:text-sm font-bold text-blue-600">
                              {res.amountDisplay}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      onClick={() => {
                        setSelectedLevel("state");
                        setViewMode("wheel_hub");
                        setIsHeaderSearchOpen(false);
                      }}
                      className="p-2.5 bg-slate-50 text-center border-t border-slate-100 hover:bg-slate-100 cursor-pointer text-xs font-bold text-blue-600"
                    >
                      View All in Complete Directory →
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-xs font-bold text-slate-700">
                      No exact matching record for "{searchQuery}"
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Try searching for Arunachal Pradesh, Rajasthan, UP, Ranchi, or Jal Jeevan.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedLevel("state");
                        setViewMode("wheel_hub");
                        setIsHeaderSearchOpen(false);
                      }}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
                    >
                      Browse All 36 States & UTs
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Standard Header from Mockup */
            <>
              <div className="flex items-center gap-3">
                {viewMode !== "landing" ? (
                  <button
                    onClick={() => {
                      if (viewMode === "data_ledger") {
                        setViewMode("detail_overview");
                      } else if (viewMode === "detail_overview" && selectedLevel !== "national") {
                        setViewMode("wheel_hub");
                      } else {
                        setViewMode("landing");
                      }
                    }}
                    aria-label="Go Back"
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors focus:outline-hidden cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                ) : onBack ? (
                  <button
                    onClick={onBack}
                    aria-label="Go Back"
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors focus:outline-hidden cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                ) : (
                  /* Circular "dp" User Avatar Badge */
                  <div
                    onClick={() => setViewMode("landing")}
                    className="w-10 h-10 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-sm shadow-xs cursor-pointer select-none hover:opacity-90 transition-opacity"
                  >
                    dp
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <h1
                      onClick={() => setViewMode("landing")}
                      className="text-base font-bold text-slate-900 tracking-tight leading-tight cursor-pointer hover:text-blue-600 transition-colors"
                    >
                      Budget Ledger
                    </h1>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Gov Data
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 leading-none mt-0.5 font-medium">
                    {viewMode === "landing"
                      ? "Union Budget of India • FY 2025-26"
                      : viewMode === "wheel_hub"
                      ? `${
                          selectedLevel === "state"
                            ? "States & UTs"
                            : selectedLevel === "district"
                            ? "Districts"
                            : "Panchayats"
                        } Directory`
                      : `${getDisplayName(activeNode)} • FY ${activeNode.fiscalYear}`}
                  </p>
                </div>
              </div>

              {/* Right Action Icons: Search (on other pages) + Info */}
              <div className="flex items-center gap-1.5">
                {viewMode !== "landing" && (
                  <button
                    onClick={() => {
                      setIsHeaderSearchOpen(true);
                      setTimeout(() => {
                        searchInputRef.current?.focus();
                      }, 50);
                    }}
                    aria-label="Search Budgets"
                    title="Search Budgets"
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setShowInfoModal(true)}
                  aria-label="Official Budget Audit Information"
                  title="Official Budget Sources & Info"
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Tier Bar: Clean modern button style without "< Home" and without counts */}
        {viewMode === "wheel_hub" && (
          <div className="border-t border-slate-200 bg-white px-3 py-2.5 shadow-2xs">
            <div className="max-w-4xl mx-auto flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              {tierOptions.map((tier) => {
                const isActive = selectedLevel === tier.key;
                return (
                  <button
                    key={tier.key}
                    onClick={() => handleLevelChange(tier.key)}
                    className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs font-bold ring-2 ring-blue-600/20"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/80"
                    }`}
                  >
                    {tier.icon}
                    <span>{tier.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main className="max-w-4xl mx-auto w-full px-3 sm:px-4 pt-3">
        {/* ============================================================== */}
        {/* VIEW 1: LANDING PAGE */}
        {/* ============================================================== */}
        {viewMode === "landing" ? (
          <div className="flex flex-col space-y-6 pb-8">
            {/* Monument / Parliament Skyline Illustration Backdrop */}
            <div className="relative pt-3">
              <div className="relative w-full max-w-2xl mx-auto h-28 sm:h-32 flex items-center justify-center pointer-events-none select-none">
                <svg
                  className="w-full h-full text-slate-300/70"
                  viewBox="0 0 800 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M370 170 H430 V120 Q400 90 370 120 Z"
                    fill="currentColor"
                    opacity="0.25"
                  />
                  <rect x="365" y="125" width="70" height="45" rx="3" fill="currentColor" opacity="0.3" />
                  <path
                    d="M360 125 Q400 70 440 125 Z"
                    fill="currentColor"
                    opacity="0.35"
                  />
                  <line x1="400" y1="70" x2="400" y2="40" stroke="#475569" strokeWidth="2.5" />
                  <path
                    d="M400 40 Q410 38 420 42 Q430 46 440 40 L440 55 Q430 61 420 57 Q410 53 400 55 Z"
                    fill="#ff9933"
                  />
                  <path
                    d="M400 45 Q410 43 420 47 Q430 51 440 45 L440 50 Q430 56 420 52 Q410 48 400 50 Z"
                    fill="#ffffff"
                  />
                  <path
                    d="M400 50 Q410 48 420 52 Q430 56 440 50 L440 55 Q430 61 420 57 Q410 53 400 55 Z"
                    fill="#138808"
                  />
                  <circle cx="420" cy="48" r="2.5" fill="#000088" />

                  <path
                    d="M100 170 L120 130 L160 130 L170 170 L240 170 L250 110 L300 110 L310 170 L350 170 L350 100 L370 100 L370 170"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    opacity="0.4"
                  />
                  <path
                    d="M430 170 L430 100 L450 100 L450 170 L490 170 L500 110 L550 110 L560 170 L630 170 L640 130 L680 130 L700 170"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    opacity="0.4"
                  />
                  <path d="M265 110 Q275 85 285 110 Z" fill="currentColor" opacity="0.25" />
                  <path d="M515 110 Q525 85 535 110 Z" fill="currentColor" opacity="0.25" />
                  <path d="M135 130 Q140 110 145 130 Z" fill="currentColor" opacity="0.25" />
                  <path d="M655 130 Q660 110 665 130 Z" fill="currentColor" opacity="0.25" />
                  <line x1="50" y1="170" x2="750" y2="170" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
                </svg>
              </div>

              {/* Floating Search Bar */}
              <div className="relative -mt-6 max-w-2xl mx-auto z-30">
                <div className="bg-white rounded-2xl p-1.5 shadow-lg border border-slate-200 flex items-center gap-2 transition-all hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-3 focus-within:ring-blue-100">
                  <div
                    onClick={() => handleExecuteSearch()}
                    className="p-2.5 text-slate-400 hover:text-blue-600 cursor-pointer transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    ref={landingSearchInputRef}
                    type="text"
                    value={searchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchFocused(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleExecuteSearch();
                      }
                    }}
                    placeholder="Search State, District, Panchayat, Scheme..."
                    className="flex-1 text-sm bg-transparent border-none text-slate-900 placeholder:text-slate-400 focus:outline-hidden py-1"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilterModal(true)}
                    title="Filters & Directory"
                    aria-label="Filters and Directory"
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </button>
                </div>

                {/* Instant Live Search Results Card Dropdown */}
                {isSearchFocused && (
                  <div
                    ref={searchDropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    {searchQuery.trim().length === 0 ? (
                      <div className="p-3 bg-slate-50/80 border-b border-slate-100">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Popular Quick Searches</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {quickSearchTags.map((tag) => (
                            <button
                              key={tag.label}
                              onClick={() => {
                                setSearchQuery(tag.query);
                                handleExecuteSearch(tag.query);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 cursor-pointer shadow-2xs transition-all"
                            >
                              <span>{tag.icon}</span>
                              <span>{tag.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : globalSearchResults.length > 0 ? (
                      <div>
                        <div className="p-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                            <Search className="w-3 h-3 text-blue-600" />
                            Found {globalSearchResults.length} match{globalSearchResults.length > 1 ? "es" : ""} in database
                          </span>
                          <span className="text-[10px] text-blue-600 font-medium">
                            Press Enter or tap to jump
                          </span>
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                          {globalSearchResults.map((res) => (
                            <div
                              key={res.id}
                              onClick={() => {
                                handleSelectNode(res.node, res.targetTab);
                              }}
                              className="p-3 flex items-center justify-between hover:bg-blue-50/80 cursor-pointer transition-colors group"
                            >
                              <div className="flex items-center gap-3 pr-2 min-w-0">
                                <span className="text-xl shrink-0">{res.icon}</span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                      {res.title}
                                    </h4>
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                                        res.type === "state"
                                          ? "bg-blue-100 text-blue-800"
                                          : res.type === "district"
                                          ? "bg-purple-100 text-purple-800"
                                          : res.type === "village"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : res.type === "scheme"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-slate-100 text-slate-700"
                                      }`}
                                    >
                                      {res.typeLabel}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {res.subtitle}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0 flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-extrabold text-blue-600 block">
                                  {res.amountDisplay}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div
                          onClick={() => {
                            setSelectedLevel("state");
                            setViewMode("wheel_hub");
                            setIsSearchFocused(false);
                          }}
                          className="p-2.5 bg-slate-50 text-center border-t border-slate-100 hover:bg-slate-100 cursor-pointer text-xs font-bold text-blue-600"
                        >
                          View All in Complete Directory →
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-xs font-bold text-slate-700">
                          No exact matching record for "{searchQuery}"
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Try searching for Arunachal Pradesh, Rajasthan, UP, Ranchi, or Jal Jeevan.
                        </p>
                        <button
                          onClick={() => {
                            setSelectedLevel("state");
                            setViewMode("wheel_hub");
                            setIsSearchFocused(false);
                          }}
                          className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
                        >
                          Browse All 36 States & UTs
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 1: Explore by Level */}
            <section>
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Explore by Level
                </h2>
                <button
                  onClick={() => {
                    setSelectedLevel("state");
                    setViewMode("wheel_hub");
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* States & UTs */}
                <div
                  onClick={() => {
                    setSelectedLevel("state");
                    setViewMode("wheel_hub");
                  }}
                  className="group bg-blue-50/70 border border-blue-200/90 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:bg-blue-50 hover:border-blue-400 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-105 transition-transform">
                      <svg className="w-6 h-6 fill-blue-600" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">States & UTs</span>
                      <span className="text-2xl font-black text-blue-900 tracking-tight block">36</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:text-blue-700">
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Districts */}
                <div
                  onClick={() => {
                    setSelectedLevel("district");
                    setViewMode("wheel_hub");
                  }}
                  className="group bg-purple-50/70 border border-purple-200/90 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:bg-purple-50 hover:border-purple-400 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-purple-100 flex items-center justify-center text-purple-600 shrink-0 group-hover:scale-105 transition-transform">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Districts</span>
                      <span className="text-2xl font-black text-purple-900 tracking-tight block">802</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-bold text-purple-600 group-hover:text-purple-700">
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Gram Panchayats */}
                <div
                  onClick={() => {
                    setSelectedLevel("village");
                    setViewMode("wheel_hub");
                  }}
                  className="group bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:bg-emerald-50 hover:border-emerald-400 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Gram Panchayats</span>
                      <span className="text-2xl font-black text-emerald-900 tracking-tight block">2.68 Lakh+</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
                    <span>Explore</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: Popular States Showcase */}
            <section>
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Popular States
                </h2>
                <button
                  onClick={() => {
                    setSelectedLevel("state");
                    setViewMode("wheel_hub");
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {popularStates.slice(0, 10).map((st) => (
                  <div
                    key={st.id}
                    onClick={() => handleSelectNode(st.node)}
                    className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col items-center text-center cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group relative"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden mb-2 ring-2 ring-slate-100 group-hover:ring-blue-500 transition-all">
                      <img
                        src={st.image}
                        alt={st.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {st.name}
                    </h3>
                    <p className="text-[11px] font-extrabold text-blue-600 mt-1">
                      {st.budgetDisplay}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {st.utilizationPercent}% Utilized
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : viewMode === "wheel_hub" ? (
          /* ============================================================== */
          /* VIEW 2: DIRECTORY HUB */
          /* ============================================================== */
          <section className="space-y-4 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {selectedLevel === "state"
                    ? "All 36 States & Union Territories"
                    : selectedLevel === "district"
                    ? "802 Districts Directory"
                    : "2.68 Lakh+ Gram Panchayats Directory"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select any state or jurisdiction to view complete verified budget allocations.
                </p>
              </div>

              {(selectedLevel === "district" || selectedLevel === "village") && uniqueStates.length > 0 && (
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={selectedStateFilter}
                    onChange={(e) => setSelectedStateFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
                  >
                    <option value="all">All States & UTs</option>
                    {uniqueStates.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredWheelNodes.map((node) => {
                const displayName = getDisplayName(node);
                const subLocation = node.parentState || node.capitalOrHQ || "";

                return (
                  <div
                    key={node.id}
                    onClick={() => handleSelectNode(node)}
                    className="group flex flex-col items-center text-center p-3.5 rounded-2xl border bg-white border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer relative"
                  >
                    <div className="relative mb-2.5">
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full p-0.5 ring-2 ring-slate-200 group-hover:ring-3 group-hover:ring-blue-500 transition-all overflow-hidden">
                        <img
                          src={
                            node.image ||
                            "https://images.unsplash.com/photo-1597041593980-4c2432819d77?w=300&auto=format&fit=crop&q=80"
                          }
                          alt={node.name}
                          className="w-full h-full rounded-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-xs">
                        {node.emblemIcon || "🏛️"}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {displayName}
                    </h3>
                    {subLocation && (
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                        {subLocation}
                      </p>
                    )}

                    <div className="mt-2.5 w-full pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Outlay
                      </span>
                      <span className="text-xs font-bold text-blue-600">
                        {formatAmount(node.totalBudgetCr)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          /* ============================================================== */
          /* VIEW 3: EXACT STATE / JURISDICTION PROFILE DESIGN */
          /* (Match to user's uploaded mockup: 20260823_015717.jpg) */
          /* ============================================================== */
          <div className="space-y-4 pb-12 animate-in fade-in duration-150">
            {/* 1. Interactive Breadcrumb Bar */}
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium flex-wrap py-1">
              <button
                onClick={() => setViewMode("landing")}
                className="hover:text-blue-600 font-semibold cursor-pointer transition-colors"
              >
                India
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button
                onClick={() => {
                  setSelectedLevel("state");
                  setViewMode("wheel_hub");
                }}
                className="hover:text-blue-600 font-semibold cursor-pointer transition-colors"
              >
                States & UTs
              </button>
              {activeNode.parentState && activeNode.level !== "state" && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-600">{activeNode.parentState}</span>
                </>
              )}
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-blue-600 font-bold">
                {getDisplayName(activeNode)}
              </span>
            </nav>

            {/* 2. State / Jurisdiction Header Profile Card */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Avatar + Title + Tagline + Metrics */}
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-2 ring-slate-100 shadow-sm">
                      <img
                        src={
                          activeNode.image ||
                          "https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?w=400&auto=format&fit=crop&q=80"
                        }
                        alt={activeNode.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                        {getDisplayName(activeNode)}
                      </h2>
                      {activeNode.budgetType === "union_budget_ut_allocation" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Union Budget UT Allocation
                        </span>
                      ) : activeNode.budgetType === "legislature_ut_budget" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                          UT with Legislature Budget
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                          {activeNode.level === "state"
                            ? "State Budget Profile"
                            : activeNode.level === "district"
                            ? "District Profile"
                            : activeNode.level === "village"
                            ? "Panchayat Profile"
                            : "Union Budget of India"}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-1 max-w-xl">
                      {activeNode.tagline ||
                        "Frontier Highway • Hydro-Power & Border Village Vibrant Program"}
                    </p>

                    {/* Metadata items row */}
                    <div className="flex items-center gap-4 text-xs text-slate-600 font-medium mt-3 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Population {activeNode.populationYear ? `(${activeNode.populationYear})` : ""}</span>
                        <span className="font-bold text-slate-900">
                          {formatPopulation(activeNode.population)}
                        </span>
                      </div>

                      {activeNode.districtCount && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>Districts</span>
                          <span className="font-bold text-slate-900">
                            {activeNode.districtCount}
                          </span>
                        </div>
                      )}

                      {activeNode.panchayatCount !== undefined && activeNode.panchayatCount > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{activeNode.panchayatType || "Panchayats"}</span>
                          <span className="font-bold text-slate-900">
                            {activeNode.panchayatCount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      ) : activeNode.panchayatType ? (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Governance</span>
                          <span className="font-bold text-slate-900">
                            {activeNode.panchayatType}
                          </span>
                        </div>
                      ) : null}

                      {formatCapitalOrHQ(activeNode) && (
                        <div className="flex items-center gap-1.5">
                          <Landmark className="w-3.5 h-3.5 text-slate-400" />
                          <span>HQ/Capital</span>
                          <span className="font-bold text-slate-900">
                            {formatCapitalOrHQ(activeNode)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Box: Per Capita Outlay Card */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-center min-w-[180px] self-stretch md:self-auto shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>
                      {activeNode.budgetType === "union_budget_ut_allocation"
                        ? "Per Capita Allocation"
                        : activeNode.perCapitaNetBudgetInr
                        ? "Per Capita Net Outlay"
                        : "Per Capita Outlay"}
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight mt-1">
                    ₹{(activeNode.perCapitaNetBudgetInr || activeNode.perCapitaBudgetInr || 224202).toLocaleString("en-IN")}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                    / citizen ({activeNode.fiscalYear})
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Budget Overview (FY 2024-25 / 2025-26) Card with Interactive Visual Charts */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
              {/* Header with Title, Source & View Mode Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Budget Overview <span className="text-slate-500 font-normal">(FY {activeNode.fiscalYear})</span>
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Official Outlay: <strong className="text-slate-800">{formatAmount(activeNode.totalBudgetCr)}</strong> • Last updated: {activeNode.lastUpdated || "2024-25"}
                  </p>
                </div>

                {/* View Mode Toggle Buttons */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 text-xs font-semibold">
                  <button
                    onClick={() => setOverviewChartTab("chart")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      overviewChartTab === "chart"
                        ? "bg-white text-blue-600 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Macro Chart
                  </button>
                  <button
                    onClick={() => setOverviewChartTab("split")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      overviewChartTab === "split"
                        ? "bg-white text-blue-600 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Capex vs Revenue
                  </button>
                  <button
                    onClick={() => setOverviewChartTab("metrics")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      overviewChartTab === "metrics"
                        ? "bg-white text-blue-600 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Execution Tiles
                  </button>
                </div>
              </div>

              {/* TAB 1: Macro Financial Architecture Visual Bar Chart */}
              {overviewChartTab === "chart" && (
                <div className="space-y-4">
                  <div className="h-64 sm:h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overviewChartData} margin={{ top: 20, right: 15, left: -10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke="#64748b"
                          fontSize={11}
                          tickLine={false}
                          interval={0}
                          dy={10}
                        />
                        <YAxis
                          stroke="#64748b"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k Cr`}
                        />
                        <Tooltip
                          formatter={(value: any) => [
                            `₹${Number(value).toLocaleString("en-IN")} Cr`,
                            "Amount",
                          ]}
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderRadius: "1rem",
                            border: "none",
                            color: "#fff",
                            fontSize: "12px",
                            padding: "8px 12px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                          }}
                          itemStyle={{ color: "#93c5fd", fontWeight: "bold" }}
                          labelStyle={{ color: "#e2e8f0", fontWeight: "bold", marginBottom: "4px" }}
                        />
                        <Bar dataKey="amountCr" radius={[8, 8, 0, 0]} maxBarSize={55}>
                          {overviewChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 4 Interactive Legend & Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                    {overviewChartData.map((item) => (
                      <div key={item.key} className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100 flex flex-col justify-between">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-[11px] font-semibold text-slate-600 truncate">{item.name}</span>
                        </div>
                        <div>
                          <span className="text-sm sm:text-base font-black text-slate-900 block">
                            {formatAmount(item.amountCr)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: Capex vs Revenue Expenditure Split */}
              {overviewChartTab === "split" && (
                <div className="space-y-4">
                  {/* Two-Column Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Capex Card */}
                    <div className="bg-amber-50/40 border border-amber-200/70 rounded-2xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                              🏗️
                            </div>
                            <div>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900">Capital Outlay (Capex)</h4>
                              <span className="text-[11px] text-amber-700 font-semibold">Asset Creation & Infrastructure</span>
                            </div>
                          </div>
                          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            {activeNode.totalBudgetCr > 0 ? (( (activeNode.capexCr || 0) / activeNode.totalBudgetCr) * 100).toFixed(1) : 0}% of Outlay
                          </span>
                        </div>

                        <div className="mt-3">
                          <span className="text-xl sm:text-2xl font-black text-amber-800 block">
                            {formatAmount(activeNode.capexCr || 0)}
                          </span>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            Allocated directly to long-term capital assets: State highways, metro lines, irrigation dams, solar parks, school/hospital buildings, and industrial parks.
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-amber-200/50 flex items-center justify-between text-[11px] font-medium text-slate-500">
                        <span>Total Capex Allocation</span>
                        <strong className="text-slate-800">₹{(activeNode.capexCr || 0).toLocaleString("en-IN")} Cr</strong>
                      </div>
                    </div>

                    {/* Revenue Expenditure Card */}
                    <div className="bg-purple-50/40 border border-purple-200/70 rounded-2xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                              🛡️
                            </div>
                            <div>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900">Revenue Expenditure</h4>
                              <span className="text-[11px] text-purple-700 font-semibold">Social Welfare & Operations</span>
                            </div>
                          </div>
                          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                            {activeNode.totalBudgetCr > 0 ? (( (activeNode.revenueExpCr || (activeNode.totalBudgetCr - (activeNode.capexCr || 0))) / activeNode.totalBudgetCr) * 100).toFixed(1) : 0}% of Outlay
                          </span>
                        </div>

                        <div className="mt-3">
                          <span className="text-xl sm:text-2xl font-black text-purple-800 block">
                            {formatAmount(activeNode.revenueExpCr || (activeNode.totalBudgetCr - (activeNode.capexCr || 0)))}
                          </span>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            Covers ongoing government operational spending: Public sector teacher & doctor salaries, pensions, power subsidies, nutrition, welfare DBT programs, and interest servicing.
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-purple-200/50 flex items-center justify-between text-[11px] font-medium text-slate-500">
                        <span>Total Revenue Operations</span>
                        <strong className="text-slate-800">₹{(activeNode.revenueExpCr || (activeNode.totalBudgetCr - (activeNode.capexCr || 0))).toLocaleString("en-IN")} Cr</strong>
                      </div>
                    </div>
                  </div>

                  {/* Visual Proportion Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Capital Assets (Capex)</span>
                      <span>Operational & Welfare (Revenue Exp)</span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden bg-slate-100 flex shadow-inner">
                      <div
                        className="bg-amber-500 h-full transition-all duration-500"
                        style={{
                          width: `${Math.max(5, Math.min(95, activeNode.totalBudgetCr > 0 ? ((activeNode.capexCr || 0) / activeNode.totalBudgetCr) * 100 : 20))}%`,
                        }}
                      />
                      <div
                        className="bg-purple-600 h-full transition-all duration-500"
                        style={{
                          width: `${Math.max(5, Math.min(95, 100 - (activeNode.totalBudgetCr > 0 ? ((activeNode.capexCr || 0) / activeNode.totalBudgetCr) * 100 : 20)))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: 4 Metric Tiles Grid (Execution & Releases) */}
              {overviewChartTab === "metrics" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {/* Tile 1: Approved */}
                  <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                        <IndianRupee className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div>
                      <span className="text-base sm:text-lg font-black text-emerald-700 block leading-tight">
                        {formatAmount(overviewMetrics.approved)}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 block mt-0.5">Approved</span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5">100%</span>
                    </div>
                  </div>

                  {/* Tile 2: Released */}
                  <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-full bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div>
                      <span className="text-base sm:text-lg font-black text-blue-700 block leading-tight">
                        {formatAmount(overviewMetrics.released)}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 block mt-0.5">Released</span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5">
                        {overviewMetrics.releasedPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Tile 3: Spent */}
                  <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
                        <Wallet className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div>
                      <span className="text-base sm:text-lg font-black text-amber-700 block leading-tight">
                        {formatAmount(overviewMetrics.spent)}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 block mt-0.5">Spent</span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5">
                        {overviewMetrics.spentPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Tile 4: Balance */}
                  <div className="bg-purple-50/40 border border-purple-100 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-full bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div>
                      <span className="text-base sm:text-lg font-black text-purple-700 block leading-tight">
                        {formatAmount(overviewMetrics.balance)}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 block mt-0.5">Balance</span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5">
                        {overviewMetrics.balancePercent}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Union Budget Key Macro Indicators (Budget at a Glance FY 2025-26) */}
              {activeNode.level === "national" && activeNode.fiscalDeficitCr && (
                <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-sm">
                        🏛️
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Union Budget at a Glance (FY {activeNode.fiscalYear})
                        </h4>
                        <span className="text-xs text-slate-400">
                          Ministry of Finance Official Budget Estimates (BE)
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50 self-start sm:self-auto">
                      GDP: ₹{(activeNode.gdpCr ? activeNode.gdpCr / 100000 : 356.98).toFixed(2)} Lakh Cr
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {/* Fiscal Deficit */}
                    <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                      <span className="text-[11px] text-red-400 font-semibold block">Fiscal Deficit</span>
                      <span className="text-sm sm:text-base font-black text-white block mt-0.5">
                        ₹{(activeNode.fiscalDeficitCr / 100000).toFixed(2)}L Cr
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        4.4% of GDP
                      </span>
                    </div>

                    {/* Revenue Deficit */}
                    <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                      <span className="text-[11px] text-amber-400 font-semibold block">Revenue Deficit</span>
                      <span className="text-sm sm:text-base font-black text-white block mt-0.5">
                        ₹{((activeNode.revenueDeficitCr || 523846) / 100000).toFixed(2)}L Cr
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        Effective: ₹{((activeNode.effectiveRevenueDeficitCr || 96654) / 1000).toFixed(0)}k Cr
                      </span>
                    </div>

                    {/* Effective Capex */}
                    <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                      <span className="text-[11px] text-emerald-400 font-semibold block">Effective Capex</span>
                      <span className="text-sm sm:text-base font-black text-white block mt-0.5">
                        ₹{((activeNode.effectiveCapitalExpenditureCr || 1548282) / 100000).toFixed(2)}L Cr
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        Direct Capex + Grants
                      </span>
                    </div>

                    {/* Net Tax Revenue */}
                    <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                      <span className="text-[11px] text-blue-400 font-semibold block">Net Tax to Centre</span>
                      <span className="text-sm sm:text-base font-black text-white block mt-0.5">
                        ₹{((activeNode.taxRevenueNetToCentreCr || 2837409) / 100000).toFixed(2)}L Cr
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        Gross Tax: ₹38.40L Cr
                      </span>
                    </div>

                    {/* Non-Tax Revenue */}
                    <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                      <span className="text-[11px] text-purple-400 font-semibold block">Non-Tax Revenue</span>
                      <span className="text-sm sm:text-base font-black text-white block mt-0.5">
                        ₹{((activeNode.nonTaxRevenueCr || 583000) / 100000).toFixed(2)}L Cr
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        Dividends & Profits
                      </span>
                    </div>

                    {/* Transfers to States */}
                    <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                      <span className="text-[11px] text-teal-400 font-semibold block">Transfers to States</span>
                      <span className="text-sm sm:text-base font-black text-white block mt-0.5">
                        ₹{((activeNode.resourcesTransferredToStatesCr || 2501284) / 100000).toFixed(2)}L Cr
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        Devolution + Grants
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Priority Focus & Audit Notes Footer */}
              {activeNode.auditNotes && (
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 min-w-0">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-medium text-slate-600 truncate">
                      <strong className="text-slate-900">Key Focus:</strong> {activeNode.auditNotes}
                    </span>
                  </div>
                  {activeNode.officialGazetteRef && (
                    <a
                      href={activeNode.officialGazetteRef}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1 shrink-0"
                    >
                      <span>{activeNode.officialSource || "Official Source"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* 4. Official Audit & Source Verification Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong>Data updated as on {activeNode.lastUpdated || "2024-25"}</strong> • All financial figures are official & verified
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Source: {activeNode.officialSource || `Finance Department, ${getDisplayName(activeNode)}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 4: DETAILED DATA LEDGER (Itemized Breakdown) */}
        {/* ============================================================== */}
        {viewMode === "data_ledger" && (
          <div className="space-y-4 pb-12 animate-in fade-in">
            {/* Header banner */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  {getDisplayName(activeNode)} • Itemized Ledger
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  {activeTab === "outflow"
                    ? "Expenditure Outflows"
                    : activeTab === "inflow"
                    ? "Revenues & Inflows"
                    : activeTab === "schemes"
                    ? "Flagship Development Schemes"
                    : "Multi-Year Historical Trends"}
                </h2>
              </div>

              <button
                onClick={() => setViewMode("detail_overview")}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>

            {/* Line items list */}
            {activeTab === "outflow" || activeTab === "inflow" ? (
              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const isExpanded = selectedItem?.id === item.id;
                  const pct = activeNode.totalBudgetCr > 0 ? ((item.allocatedAmountCr / activeNode.totalBudgetCr) * 100).toFixed(1) : "0";

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(isExpanded ? null : item)}
                      className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-blue-300 transition-all cursor-pointer space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                            {item.category && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                {item.category}
                              </span>
                            )}
                          </div>
                          {item.nodalMinistryOrDept && (
                            <p className="text-xs text-slate-500 mt-0.5">{item.nodalMinistryOrDept}</p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm sm:text-base font-extrabold text-blue-600 block">
                            {formatAmount(item.allocatedAmountCr)}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {pct}% of budget
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="pt-3 mt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                          {item.description && <p className="leading-relaxed">{item.description}</p>}
                          {onOpenCompose && (
                            <div className="pt-2 flex justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenCompose(
                                    item.nodalMinistryOrDept || activeNode.name,
                                    `Query regarding ${item.name} (${formatAmount(item.allocatedAmountCr)}) under ${activeNode.name}: `
                                  );
                                }}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer"
                              >
                                File Civic Query / Grievance
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : activeTab === "schemes" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredSchemes.map((sch, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">{sch.name}</h4>
                      <span className="text-sm font-bold text-blue-600 shrink-0">
                        {sch.allocatedCr ? formatAmount(sch.allocatedCr) : sch.approvedDisplay}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{sch.description}</p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Status:</span>
                      <span className="font-semibold text-emerald-600">{sch.beneficiaryTarget || "Active"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 5. MONEY TRAIL AUDIT MODAL */}
      {/* ========================================================================= */}
      {showMoneyTrailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Budget Money Trail Breakdown</h3>
                  <p className="text-[11px] text-slate-500">{getDisplayName(activeNode)} • FY {activeNode.fiscalYear}</p>
                </div>
              </div>
              <button
                onClick={() => setShowMoneyTrailModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex justify-between font-bold text-emerald-900">
                  <span>1. Legislative Approved Outlay</span>
                  <span>{formatAmount(overviewMetrics.approved)} (100%)</span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1">
                  Enacted by the State Legislative Assembly / Parliament under the Appropriation Act.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="flex justify-between font-bold text-blue-900">
                  <span>2. Treasury Fund Released</span>
                  <span>{formatAmount(overviewMetrics.released)} ({overviewMetrics.releasedPercent}%)</span>
                </div>
                <p className="text-[11px] text-blue-700 mt-1">
                  Disbursed from Consolidated Fund of India / State Treasury to Nodal Executive Departments.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="flex justify-between font-bold text-amber-900">
                  <span>3. Actual Expenditure Spent</span>
                  <span>{formatAmount(overviewMetrics.spent)} ({overviewMetrics.spentPercent}%)</span>
                </div>
                <p className="text-[11px] text-amber-700 mt-1">
                  Direct vendor payments, DBT transfers, contractor vouchers via PFMS & e-Treasury.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200">
                <div className="flex justify-between font-bold text-purple-900">
                  <span>4. Physical Work Value Created</span>
                  <span>{formatAmount(overviewMetrics.workValue)} ({overviewMetrics.workValuePercent}%)</span>
                </div>
                <p className="text-[11px] text-purple-700 mt-1">
                  Geo-tagged assets completed, roads paved, classrooms built, and potable tap pipelines laid.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowMoneyTrailModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. WORKS MODAL */}
      {/* ========================================================================= */}
      {showWorksModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Development Works Summary</h3>
              <button
                onClick={() => setShowWorksModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 bg-emerald-50 rounded-xl font-semibold text-emerald-900">
                <span>Completed Projects</span>
                <span>{worksProgress.completed.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-amber-50 rounded-xl font-semibold text-amber-900">
                <span>In Progress Works</span>
                <span>{worksProgress.inProgress.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-rose-50 rounded-xl font-semibold text-rose-900">
                <span>Delayed / Behind Schedule</span>
                <span>{worksProgress.delayed.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-blue-50 rounded-xl font-bold text-blue-900">
                <span>Total Registered Works</span>
                <span>{worksProgress.total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button
              onClick={() => setShowWorksModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. ADVANCED BUDGET FILTER MODAL */}
      {/* ========================================================================= */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Budget Filter & Navigation</h3>
                  <p className="text-[11px] text-slate-500">Find any State, District, Panchayat or Scheme</p>
                </div>
              </div>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Governance Tier / Level</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: "all", label: "All Levels" },
                  { key: "state", label: "36 States & UTs" },
                  { key: "district", label: "802 Districts" },
                  { key: "village", label: "2.68L+ Panchayats" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilterLevel(item.key)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      filterLevel === item.key
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Select State or Union Territory</span>
              </label>
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer shadow-2xs"
              >
                <option value="all">Pan-India (All 36 States & UTs)</option>
                {allStateNames.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Fiscal Year</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["all", "2025-26", "2024-25"].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setFilterFiscalYear(yr)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      filterFiscalYear === yr
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {yr === "all" ? "All Years" : `FY ${yr}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All</span>
              </button>
              <button
                type="button"
                onClick={handleApplyFilterModal}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply & Explore</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Official Government Budget Data</h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>Constitutional Authority:</strong> All Union Budget estimates are presented under <strong>Article 112</strong> of the Constitution of India.
              </p>
              <p>
                <strong>Coverage:</strong> The portal catalogs verified budget data across <strong>28 States & 8 Union Territories</strong>, <strong>802 Districts</strong>, and <strong>2.68 Lakh+ Gram Panchayats</strong>.
              </p>
              <p>
                <strong>Audit Compliance:</strong> Expenditure audits and receipts are monitored by the <strong>Comptroller and Auditor General of India (CAG)</strong>.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
