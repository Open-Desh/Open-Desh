import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  BookOpen,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Mail,
  Copy,
  Check,
  Share2,
  ShieldCheck,
  Building,
  Building2,
  Phone,
  Rocket,
  AlertTriangle,
  Landmark,
  Star,
  IndianRupee,
  Shield,
  Lock,
  Globe,
  X,
  Send,
  Camera,
  MapPin,
  CheckCircle,
  Repeat,
  Award,
  MessageSquare,
  Edit3,
  Calculator,
  CornerDownRight,
  PieChart,
  TrendingUp,
  BarChart3,
  User,
  Key,
  EyeOff,
  ShieldAlert,
  UserX,
  FileCheck,
  AlertOctagon,
  Flame,
  Flag,
  Cpu,
  UserPlus,
  FilePlus,
  BadgeCheck,
} from "lucide-react";
import { HELP_CATEGORIES, HELP_ARTICLES } from "../data/helpCenterData.ts";
import { HelpArticle, HelpCategoryId, UserCategory } from "../types.ts";
import { db, handleFirestoreError, OperationType } from "../firebase.ts";
import { doc, setDoc } from "firebase/firestore";
import { useLanguage } from "../context/LanguageContext.tsx";
import { updateSeo, buildHelpArticleSeo } from "../lib/seo.ts";

export const HelpView: React.FC = () => {
  const { language } = useLanguage();
  const isHindi = language === "hi";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [activeModalArticle, setActiveModalArticle] = useState<HelpArticle | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedLinkArticleId, setCopiedLinkArticleId] = useState<string | null>(null);

  const supportEmail = "help@opendesh.com";
  const sourceBaseUrl = "https://help.opendesh.com";

  // Icon mapping helper
  const renderCategoryIcon = (iconName: string, className = "w-5 h-5") => {
    switch (iconName) {
      case "Rocket":
        return <Rocket className={className} />;
      case "AlertTriangle":
        return <AlertTriangle className={className} />;
      case "Landmark":
        return <Landmark className={className} />;
      case "Star":
        return <Star className={className} />;
      case "IndianRupee":
        return <IndianRupee className={className} />;
      case "Shield":
        return <Shield className={className} />;
      case "Lock":
        return <Lock className={className} />;
      case "Globe":
        return <Globe className={className} />;
      case "Building2":
        return <Building2 className={className} />;
      case "Camera":
        return <Camera className={className} />;
      case "MapPin":
        return <MapPin className={className} />;
      case "CheckCircle":
        return <CheckCircle className={className} />;
      case "Repeat":
        return <Repeat className={className} />;
      case "Award":
        return <Award className={className} />;
      case "MessageSquare":
        return <MessageSquare className={className} />;
      case "Edit3":
        return <Edit3 className={className} />;
      case "Calculator":
        return <Calculator className={className} />;
      case "CornerDownRight":
        return <CornerDownRight className={className} />;
      case "PieChart":
        return <PieChart className={className} />;
      case "TrendingUp":
        return <TrendingUp className={className} />;
      case "BarChart3":
        return <BarChart3 className={className} />;
      case "User":
        return <User className={className} />;
      case "Key":
        return <Key className={className} />;
      case "EyeOff":
        return <EyeOff className={className} />;
      case "ShieldAlert":
        return <ShieldAlert className={className} />;
      case "UserX":
        return <UserX className={className} />;
      case "FileCheck":
        return <FileCheck className={className} />;
      case "AlertOctagon":
        return <AlertOctagon className={className} />;
      case "Flame":
        return <Flame className={className} />;
      case "ShieldCheck":
        return <ShieldCheck className={className} />;
      case "Flag":
        return <Flag className={className} />;
      case "Cpu":
        return <Cpu className={className} />;
      case "UserPlus":
        return <UserPlus className={className} />;
      case "FilePlus":
        return <FilePlus className={className} />;
      case "Send":
        return <Send className={className} />;
      default:
        return <BookOpen className={className} />;
    }
  };

  // Language text helper for articles
  const getArticleTitle = (art: HelpArticle) => {
    if (!isHindi && art.englishTitle) return art.englishTitle;
    return art.title;
  };

  const getArticleSummary = (art: HelpArticle) => {
    if (!isHindi && art.englishSummary) return art.englishSummary;
    return art.summary;
  };

  const getArticleKeyPoints = (art: HelpArticle): string[] => {
    if (!isHindi && art.englishKeyPoints && art.englishKeyPoints.length > 0) {
      return art.englishKeyPoints;
    }
    return art.keyPoints;
  };

  const getArticleFullContent = (art: HelpArticle): string[] => {
    if (!isHindi && art.englishFullContent && art.englishFullContent.length > 0) {
      return art.englishFullContent;
    }
    return art.fullContent;
  };

  const getCategoryLabel = (cat: { label: string; hindiLabel: string }) => {
    return isHindi ? cat.hindiLabel : cat.label;
  };

  const getCategoryDescription = (cat: { description: string; descriptionHindi?: string }) => {
    return isHindi && cat.descriptionHindi ? cat.descriptionHindi : cat.description;
  };

  // Filter articles based on category and search query
  const filteredArticles = useMemo(() => {
    return HELP_ARTICLES.filter((article) => {
      const matchesCat =
        selectedCategory === "all" || article.category === selectedCategory;

      if (!searchQuery.trim()) return matchesCat;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        article.title.toLowerCase().includes(q) ||
        (article.englishTitle && article.englishTitle.toLowerCase().includes(q)) ||
        article.summary.toLowerCase().includes(q) ||
        (article.englishSummary && article.englishSummary.toLowerCase().includes(q)) ||
        article.categoryLabel.toLowerCase().includes(q) ||
        article.categoryHindi.toLowerCase().includes(q) ||
        article.tags.some((t) => t.toLowerCase().includes(q)) ||
        (article.englishTags && article.englishTags.some((t) => t.toLowerCase().includes(q))) ||
        article.keyPoints.some((kp) => kp.toLowerCase().includes(q));

      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Group filtered articles by category for structured overview
  const groupedArticles = useMemo(() => {
    const map = new Map<HelpCategoryId, HelpArticle[]>();

    HELP_CATEGORIES.forEach((cat) => {
      map.set(cat.id, []);
    });

    filteredArticles.forEach((art) => {
      const list = map.get(art.category) || [];
      list.push(art);
      map.set(art.category, list);
    });

    return map;
  }, [filteredArticles]);

  // Copy email to clipboard
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  // Copy article link
  const handleCopyArticleLink = (article: HelpArticle, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${sourceBaseUrl}/${article.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLinkArticleId(article.id);
    setTimeout(() => setCopiedLinkArticleId(null), 2500);
  };

  // Sync / Seed articles to Firestore in the background for permanent persistence
  const syncArticlesToFirestore = async () => {
    try {
      await setDoc(
        doc(db, "help_articles", "_meta_index"),
        {
          totalArticles: HELP_ARTICLES.length,
          categoriesCount: HELP_CATEGORIES.length,
          lastUpdated: new Date().toISOString(),
          platform: "Open Desh Knowledge Base",
          version: "2026.1",
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("Firestore Help Articles Sync Notice:", err);
      handleFirestoreError(err, OperationType.WRITE, "help_articles");
    }
  };

  // Dynamic SEO update for Help Center and active article modal
  useEffect(() => {
    if (activeModalArticle) {
      updateSeo(buildHelpArticleSeo(activeModalArticle));
    } else {
      updateSeo({
        title: isHindi ? "नागरिक सहायता केंद्र व कानूनी RTI गाइड" : "Help Center & Legal RTI Guides",
        description: isHindi
          ? "Open Desh सहायता केंद्र: शिकायत दर्ज करने, RTI आवेदन, नगर निगम SLA और नागरिक अधिकारों की संपूर्ण जानकारी।"
          : "Open Desh Help Center: Comprehensive guides for civic grievance reporting, RTI Act 2005 filing, and municipal SLA timelines.",
        keywords: ["Open Desh Help", "Civic Rights", "RTI Guide", "Grievance Redressal SLA", "Municipal Standards"]
      });
    }
  }, [activeModalArticle, isHindi]);

  return (
    <div
      id="help-center-root"
      className="w-full pb-28 md:pb-16 animate-fadeIn space-y-4 sm:space-y-6 px-0"
    >
      {/* 1. Search & Category Filters Bar — Top corners square, bottom corners rounded, Edge-to-Edge */}
      <div
        id="help-search-filter-card"
        className="w-full bg-white p-4 sm:p-5 rounded-t-none rounded-b-3xl border-y sm:border border-slate-200 shadow-sm space-y-4"
      >
        {/* Search Input */}
        <div className="relative px-1 sm:px-2">
          <Search className="w-5 h-5 text-blue-600 absolute left-4.5 sm:left-5.5 top-1/2 transform -translate-y-1/2" />
          <input
            id="help-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isHindi
                ? "Help Center में खोजें (उदा. 'शिकायत कैसे करें', 'बजट', 'वेरिफिकेशन बैज', 'रेटिंग', 'RTI')..."
                : "Search in Help Center (e.g. 'File a grievance', 'Budget', 'Verification Badges', 'Rating', 'RTI')..."
            }
            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-t-none rounded-b-2xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4.5 sm:right-5.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 px-1 sm:px-2 no-scrollbar">
          <button
            id="category-pill-all"
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-t-none rounded-b-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === "all"
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
            }`}
          >
            <span>{isHindi ? "सभी लेख" : "All Articles"}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedCategory === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {HELP_ARTICLES.length}
            </span>
          </button>

          {HELP_CATEGORIES.map((cat) => {
            const count = HELP_ARTICLES.filter((a) => a.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`category-pill-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-t-none rounded-b-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                }`}
              >
                {renderCategoryIcon(cat.icon, "w-3.5 h-3.5")}
                <span>{getCategoryLabel(cat)}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Category Index Grid (When viewing All and no search) — Flush Edge-to-Edge */}
      {selectedCategory === "all" && !searchQuery.trim() && (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 px-2 sm:px-4">
          {HELP_CATEGORIES.map((cat) => {
            const articlesInCat = HELP_ARTICLES.filter((a) => a.category === cat.id);
            return (
              <div
                key={cat.id}
                id={`help-cat-card-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className="bg-white p-4 rounded-t-none rounded-b-2xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-9 h-9 rounded-t-none rounded-b-xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}
                    >
                      {renderCategoryIcon(cat.icon, "w-4.5 h-4.5")}
                    </div>
                    <span className="text-[11px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-t-none rounded-b-lg border border-slate-100">
                      {articlesInCat.length} {isHindi ? "गाइड्स" : "Guides"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                      {getCategoryLabel(cat)}
                    </h3>
                    {isHindi ? (
                      <p className="text-[11px] font-bold text-slate-400">{cat.label}</p>
                    ) : (
                      <p className="text-[11px] font-bold text-blue-600/80">{cat.hindiLabel}</p>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                    {getCategoryDescription(cat)}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                  <span>{isHindi ? "गाइड्स देखें" : "Explore Guides"}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Articles Section by Category — Edge-to-Edge Cards */}
      <div className="space-y-6 px-2 sm:px-4">
        {HELP_CATEGORIES.filter(
          (cat) => selectedCategory === "all" || selectedCategory === cat.id
        ).map((cat) => {
          const articles = groupedArticles.get(cat.id) || [];
          if (articles.length === 0) return null;

          return (
            <div key={cat.id} id={`category-section-${cat.id}`} className="space-y-3">
              {/* Category Section Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 px-1">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-t-none rounded-b-lg bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shrink-0 shadow-xs`}
                  >
                    {renderCategoryIcon(cat.icon, "w-4 h-4")}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <span>{getCategoryLabel(cat)}</span>
                      <span className="text-xs font-bold text-slate-400">
                        ({isHindi ? cat.label : cat.hindiLabel})
                      </span>
                    </h2>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-t-none rounded-b-lg">
                  {articles.length} {isHindi ? "लेख" : articles.length === 1 ? "Article" : "Articles"}
                </span>
              </div>

              {/* Articles Grid for this category — Top square, bottom rounded */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {articles.map((article) => {
                  const isExpanded = expandedArticleId === article.id;
                  const displayTitle = getArticleTitle(article);
                  const displaySummary = getArticleSummary(article);
                  const displayKeyPoints = getArticleKeyPoints(article);
                  const displayFullContent = getArticleFullContent(article);

                  return (
                    <article
                      key={article.id}
                      id={`article-card-${article.id}`}
                      className="bg-white rounded-t-none rounded-b-2xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                    >
                      {/* Top bar with tag & source link */}
                      <div className="p-4 sm:p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-t-none rounded-b-md border ${cat.badgeBg}`}
                            >
                              {getCategoryLabel(cat)}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                              <BookOpen className="w-3 h-3 text-slate-400" />
                              {article.readTimeMinutes} {isHindi ? "मिनट पठन" : "min read"}
                            </span>
                          </div>

                          <button
                            onClick={(e) => handleCopyArticleLink(article, e)}
                            className="text-slate-400 hover:text-blue-600 p-1 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                            title={isHindi ? "आर्टिकल लिंक कॉपी करें" : "Copy link to article"}
                          >
                            {copiedLinkArticleId === article.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Title */}
                        <div>
                          <h3
                            onClick={() => setActiveModalArticle(article)}
                            className="text-base font-black text-slate-900 hover:text-blue-600 transition-colors cursor-pointer leading-snug"
                          >
                            {displayTitle}
                          </h3>
                          {isHindi && article.englishTitle && (
                            <p className="text-xs font-semibold text-slate-400 mt-0.5">
                              {article.englishTitle}
                            </p>
                          )}
                          {!isHindi && article.title && article.title !== article.englishTitle && (
                            <p className="text-xs font-semibold text-slate-400 mt-0.5">
                              {article.title}
                            </p>
                          )}
                        </div>

                        {/* Short Summary */}
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {displaySummary}
                        </p>

                        {/* Key Bullet Points */}
                        <div className="bg-slate-50/90 border border-slate-100 rounded-t-none rounded-b-xl p-3 space-y-1.5">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            {isHindi ? "मुख्य बिंदु व प्रक्रिया (Key Highlights)" : "Key Highlights & Protocols"}
                          </h4>
                          <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                            {displayKeyPoints.slice(0, 3).map((kp, idx) => (
                              <li key={idx} className="leading-snug">
                                {kp}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Expandable Accordion for Full Content */}
                        {isExpanded && (
                          <div className="pt-2 border-t border-slate-100 space-y-2.5 animate-fadeIn">
                            <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                              {displayFullContent.map((p, idx) => (
                                <p key={idx}>{p}</p>
                              ))}
                            </div>

                            {/* FAQs if present */}
                            {article.faqQuestions && article.faqQuestions.length > 0 && (
                              <div className="bg-blue-50/50 border border-blue-100 rounded-t-none rounded-b-xl p-3 space-y-2">
                                <h5 className="text-[11px] font-bold text-blue-900">
                                  {isHindi ? "अक्सर पूछे जाने वाले सवाल (FAQ):" : "Frequently Asked Questions (FAQ):"}
                                </h5>
                                {article.faqQuestions.map((faq, fIdx) => (
                                  <div key={fIdx} className="space-y-0.5 text-xs">
                                    <p className="font-bold text-slate-900">
                                      Q: {!isHindi && faq.englishQuestion ? faq.englishQuestion : faq.question}
                                    </p>
                                    <p className="text-slate-600 font-medium pl-3">
                                      A: {!isHindi && faq.englishAnswer ? faq.englishAnswer : faq.answer}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bottom Actions Bar with "Full Read Article" Link */}
                      <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 rounded-t-none rounded-b-2xl flex items-center justify-between gap-3">
                        <button
                          id={`toggle-expand-${article.id}`}
                          onClick={() =>
                            setExpandedArticleId(isExpanded ? null : article.id)
                          }
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>
                            {isExpanded
                              ? isHindi
                                ? "कम पढ़ें (Collapse)"
                                : "Collapse Details"
                              : isHindi
                              ? "विस्तार से पढ़ें (Expand)"
                              : "Expand Details"}
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {/* Source Link — pointing to https://help.opendesh.com */}
                        <a
                          id={`source-link-${article.id}`}
                          href={`${sourceBaseUrl}/${article.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-t-none rounded-b-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                          title="Open full official article on help.opendesh.com"
                        >
                          <span>Full Read Article</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredArticles.length === 0 && (
          <div className="bg-white p-10 rounded-t-none rounded-b-3xl border border-slate-200 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              {isHindi ? "कोई आर्टिकल नहीं मिला" : "No Articles Found"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isHindi
                ? `आपकी खोज "${searchQuery}" से संबंधित कोई परिणाम नहीं मिला। कृपया अन्य शब्द (जैसे 'बजट', 'शिकायत', 'RTI', 'रेटिंग') से खोजें।`
                : `No results found for "${searchQuery}". Please try keywords like 'grievance', 'budget', 'badges', 'RTI', or 'scorecard'.`}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-t-none rounded-b-xl cursor-pointer"
            >
              {isHindi ? "सभी आर्टिकल्स देखें" : "View All Articles"}
            </button>
          </div>
        )}
      </div>

      {/* 4. Direct Contact Support Card — Top corners square, bottom corners rounded, Edge-to-Edge */}
      <div
        id="help-contact-footer-card"
        className="w-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 rounded-t-none rounded-b-3xl border-y sm:border border-slate-800 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-1 sm:px-3">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-t-none rounded-b-md bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
              <Mail className="w-3.5 h-3.5" />
              <span>{isHindi ? "आधिकारिक नागरिक सहायता डेस्क" : "Official Citizen Support Desk"}</span>
            </div>
            <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              {isHindi
                ? "क्या आपको और सहायता की आवश्यकता है?"
                : "Need Dedicated Citizen Assistance?"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              {isHindi
                ? "Open Desh की आधिकारिक सहायता टीम से सीधे संपर्क करें। किसी भी तकनीकी समस्या, शिकायत निवारण में देरी या आरटीआई सहायता के लिए हमें ईमेल भेजें।"
                : "Contact the official Open Desh civic support desk. Send us an email for technical support, grievance escalation, or statutory legal guidance."}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {isHindi ? "औसत प्रतिक्रिया समय: 2-4 घंटे" : "Avg. Response: 2-4 Hours"}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                {isHindi ? "100% गोपनीय व सुरक्षित" : "100% Confidential & Secure"}
              </span>
            </div>
          </div>

          {/* Email Action Box */}
          <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-t-none rounded-b-2xl border border-white/15 space-y-3 w-full md:w-auto min-w-[280px]">
            <div className="text-xs font-bold text-slate-300">
              {isHindi ? "आधिकारिक ईमेल आईडी:" : "Official Contact Email:"}
            </div>
            <div className="flex items-center justify-between gap-3 bg-slate-900/90 px-3.5 py-2.5 rounded-t-none rounded-b-xl border border-white/10 font-mono text-sm font-bold text-blue-300">
              <span>{supportEmail}</span>
              <button
                id="copy-support-email-btn"
                onClick={handleCopyEmail}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
                title="Copy email address"
              >
                {copiedEmail ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex gap-2">
              <a
                id="footer-mailto-btn"
                href={`mailto:${supportEmail}?subject=Open%20Desh%20Civic%20Assistance%20Request`}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-t-none rounded-b-xl text-xs font-black text-center transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Mail className="w-4 h-4" />
                <span>{isHindi ? "ईमेल भेजें (Mail Us)" : "Send Email"}</span>
              </a>
              <a
                id="footer-open-knowledgebase-btn"
                href={sourceBaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-t-none rounded-b-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                title="Visit help.opendesh.com"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Statutory Grievance & Emergency Numbers Quick Strip — Top square, bottom rounded */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 px-2 sm:px-4">
        <div className="bg-white p-4 rounded-t-none rounded-b-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-t-none rounded-b-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900">
              {isHindi ? "एंटी-करप्शन हेल्पलाइन" : "Anti-Corruption Helpline"}
            </h4>
            <p className="text-xs font-black text-amber-600 mt-0.5">1064 / 1800-11-0180</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-t-none rounded-b-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-t-none rounded-b-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900">
              {isHindi ? "CPGRAMS केंद्रीय पोर्टल" : "CPGRAMS National Portal"}
            </h4>
            <p className="text-xs font-black text-blue-600 mt-0.5">pgportal.gov.in (1800-11-4000)</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-t-none rounded-b-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-t-none rounded-b-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900">
              {isHindi ? "राष्ट्रीय आपातकालीन सेवा" : "National Emergency Helpline"}
            </h4>
            <p className="text-xs font-black text-rose-600 mt-0.5">112 (Police, Fire, Ambulance)</p>
          </div>
        </div>
      </div>

      {/* 6. Dedicated Full Article Reading Modal */}
      {activeModalArticle && (
        <div
          id="article-detail-modal-overlay"
          onClick={() => setActiveModalArticle(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[300] flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
        >
          <div
            id="article-detail-modal-card"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-none rounded-b-3xl border border-slate-200 shadow-2xl space-y-5 p-6 sm:p-7 relative"
          >
            {/* Close Button */}
            <button
              id="close-article-modal-btn"
              onClick={() => setActiveModalArticle(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="space-y-2 pr-8">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-t-none rounded-b-md bg-blue-50 text-blue-700 border border-blue-200">
                  {isHindi ? activeModalArticle.categoryHindi : activeModalArticle.categoryLabel}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  Updated: {activeModalArticle.lastUpdated}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {getArticleTitle(activeModalArticle)}
              </h2>
              {isHindi && activeModalArticle.englishTitle && (
                <p className="text-xs sm:text-sm font-semibold text-slate-500">
                  {activeModalArticle.englishTitle}
                </p>
              )}
            </div>

            {/* Summary */}
            <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-t-none rounded-b-2xl text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              {getArticleSummary(activeModalArticle)}
            </div>

            {/* Key Action Points */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                {isHindi ? "मुख्य प्रक्रिया व दिशानिर्देश (Key Protocols)" : "Key Highlights & Protocols"}
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700 bg-slate-50 p-4 rounded-t-none rounded-b-2xl border border-slate-200/80">
                {getArticleKeyPoints(activeModalArticle).map((kp, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{kp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detailed Content */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                {isHindi ? "विस्तृत विवरण (Detailed Guide)" : "Detailed Guide & Information"}
              </h4>
              {getArticleFullContent(activeModalArticle).map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* FAQs */}
            {activeModalArticle.faqQuestions && activeModalArticle.faqQuestions.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  {isHindi ? "अक्सर पूछे जाने वाले सवाल (FAQs)" : "Frequently Asked Questions (FAQs)"}
                </h4>
                <div className="space-y-2">
                  {activeModalArticle.faqQuestions.map((faq, fIdx) => (
                    <div
                      key={fIdx}
                      className="p-3.5 bg-slate-50 rounded-t-none rounded-b-xl border border-slate-200/80 space-y-1 text-xs"
                    >
                      <p className="font-bold text-slate-900">
                        Q: {!isHindi && faq.englishQuestion ? faq.englishQuestion : faq.question}
                      </p>
                      <p className="text-slate-600 font-medium leading-relaxed">
                        A: {!isHindi && faq.englishAnswer ? faq.englishAnswer : faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2">
              {(isHindi
                ? activeModalArticle.tags
                : activeModalArticle.englishTags || activeModalArticle.tags
              ).map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-t-none rounded-b-md bg-slate-100 text-slate-600 border border-slate-200"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Footer Modal Actions */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setActiveModalArticle(null)}
                className="px-4 py-2.5 rounded-t-none rounded-b-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {isHindi ? "बंद करें (Close)" : "Close"}
              </button>

              <a
                id="modal-source-full-article-link"
                href={`${sourceBaseUrl}/${activeModalArticle.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-t-none rounded-b-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-sm cursor-pointer"
              >
                <span>Full Read Article (help.opendesh.com)</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
