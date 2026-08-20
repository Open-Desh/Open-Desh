import React, { useState, useMemo } from "react";
import {
  X,
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
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      {/* Backdrop click to close */}
      <div
        className="absolute inset-0"
        onClick={closeLanguageModal}
      />

      <div
        id="language-select-modal"
        className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] z-10 animate-scaleUp"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {t("lang.selectTitle", "Select App Language")}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {t("lang.selectSubtitle", "Choose your preferred Indian language")}
              </p>
            </div>
          </div>

          <button
            onClick={closeLanguageModal}
            className="w-8 h-8 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2 bg-slate-100/90 px-3.5 py-2.5 rounded-2xl border border-slate-200 focus-within:border-blue-600 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder={t("lang.searchPlaceholder", "Search language (हिन्दी, தமிழ், বাংলা...)")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Language Grid */}
        <div className="p-3 sm:p-4 overflow-y-auto no-scrollbar flex-1 space-y-2 max-h-[420px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredLanguages.map((lang: LanguageInfo) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  id={`lang-option-${lang.code}`}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-blue-50/80 border-blue-600 ring-2 ring-blue-600/20 shadow-xs"
                      : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">
                        {lang.nativeName}
                      </span>
                      {lang.nativeName !== lang.name && (
                        <span className="text-xs font-bold text-slate-500">
                          ({lang.name})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {lang.region}
                    </span>
                  </div>

                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                      {lang.code}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {filteredLanguages.length === 0 && (
            <div className="text-center py-8 text-slate-400 space-y-1">
              <Globe className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold">No languages matched your search</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>13 Official & Major Indian Languages Supported</span>
          </div>

          <button
            onClick={closeLanguageModal}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
