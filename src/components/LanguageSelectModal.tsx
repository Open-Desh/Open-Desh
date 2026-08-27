import React, { useState, useMemo } from "react";
import {
  X,
  ArrowLeft,
  Globe,
  Search,
  Check,
  Sparkles,
  MapPin,
  Languages,
} from "lucide-react";
import { useLanguage, INDIAN_LANGUAGES, LanguageInfo } from "../context/LanguageContext.tsx";

export const LanguageSelectModal: React.FC = () => {
  const {
    language,
    setLanguage,
    isLanguageModalOpen,
    closeLanguageModal,
    t,
  } = useLanguage();

  const [search, setSearch] = useState("");

  const filteredLanguages = useMemo(() => {
    if (!search.trim()) return INDIAN_LANGUAGES;
    const q = search.toLowerCase().trim();
    return INDIAN_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.region.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
    );
  }, [search]);

  if (!isLanguageModalOpen) return null;

  const handleSelectLanguage = (code: string) => {
    setLanguage(code);
    closeLanguageModal();
  };

  return (
    <div
      id="language-select-fullscreen"
      className="fixed inset-0 z-[500] bg-white flex flex-col w-full h-full overflow-hidden animate-fadeIn"
    >
      {/* Full-screen Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={closeLanguageModal}
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Back / Close"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight flex items-center gap-2">
              <Languages className="w-5 h-5 text-blue-600 shrink-0" />
              {t("lang.selectTitle", "Select App Language")}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {t("lang.selectSubtitle", "Choose your preferred Indian language / अपनी भाषा चुनें")}
            </p>
          </div>
        </div>

        <button
          onClick={closeLanguageModal}
          className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
        >
          Done
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 sm:px-6 sm:py-4 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 bg-slate-100 hover:bg-slate-100/80 px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-600/10 transition-all">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={t("lang.searchPlaceholder", "Search language (हिन्दी, தமிழ், বাংলা, Telugu, Marathi...)")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 px-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Language Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>Available Indian Languages ({filteredLanguages.length})</span>
            <span className="flex items-center gap-1 text-blue-600">
              <Sparkles className="w-3.5 h-3.5" />
              Instant Translation
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pb-16">
            {filteredLanguages.map((lang: LanguageInfo) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  id={`lang-option-${lang.code}`}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                    isSelected
                      ? "bg-blue-50/90 border-blue-600 ring-2 ring-blue-600/30 shadow-xs"
                      : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-base font-black ${isSelected ? "text-blue-700" : "text-slate-900 group-hover:text-blue-600"}`}>
                        {lang.nativeName}
                      </span>
                      {lang.nativeName !== lang.name && (
                        <span className="text-xs font-bold text-slate-500 truncate">
                          ({lang.name})
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {lang.region}
                    </span>
                  </div>

                  {isSelected ? (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide px-2 py-0.5 rounded-md bg-slate-100 group-hover:bg-slate-200">
                      {lang.code}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {filteredLanguages.length === 0 && (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <Globe className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-base font-bold text-slate-700">No languages matched "{search}"</p>
              <p className="text-xs text-slate-400">Try searching in English or native script (e.g. Hindi, हिन्दी, Tamil)</p>
            </div>
          )}
        </div>

        {/* Bottom Bar Info */}
        <div className="sticky bottom-0 z-20 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Open Desh Multilingual Civic Network</span>
          </div>
          <button
            onClick={closeLanguageModal}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

