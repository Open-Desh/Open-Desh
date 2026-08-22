import React, { useState, useMemo } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { db } from "../firebase.ts";
import { doc, setDoc } from "firebase/firestore";
import { WheelColumn, MONTHS } from "./DateWheelPicker.tsx";

interface AgePromptModalProps {
  isOpen: boolean;
  userId: string;
  onSaveAge: (age: number, birthDate?: string) => void;
  onCancel?: () => void;
}

export const AgePromptModal: React.FC<AgePromptModalProps> = ({
  isOpen,
  userId,
  onSaveAge,
  onCancel,
}) => {
  // Default to 22-Aug-2013 or a sensible default
  const [selectedDay, setSelectedDay] = useState<number>(22);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(7); // August (0-indexed)
  const [selectedYear, setSelectedYear] = useState<number>(2013);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Maximum days in chosen month/year
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
  }, [selectedYear, selectedMonthIndex]);

  // Ensure selectedDay doesn't exceed daysInMonth
  const safeDay = Math.min(selectedDay, daysInMonth);

  // Formatted date display matching image: e.g. "22-Aug-2013"
  const formattedDisplay = useMemo(() => {
    const monthShort = MONTHS[selectedMonthIndex]?.short || "Aug";
    const dayStr = safeDay < 10 ? `0${safeDay}` : `${safeDay}`;
    return `${dayStr}-${monthShort}-${selectedYear}`;
  }, [safeDay, selectedMonthIndex, selectedYear]);

  // Previous & Next values for the 3-column roller effect
  const prevDay = safeDay === 1 ? daysInMonth : safeDay - 1;
  const nextDay = safeDay === daysInMonth ? 1 : safeDay + 1;

  const prevMonthIndex = selectedMonthIndex === 0 ? 11 : selectedMonthIndex - 1;
  const nextMonthIndex = selectedMonthIndex === 11 ? 0 : selectedMonthIndex + 1;

  const prevYear = selectedYear - 1;
  const nextYear = selectedYear + 1;

  if (!isOpen) return null;

  const handleStepDay = (delta: number) => {
    let next = safeDay + delta;
    if (next < 1) next = daysInMonth;
    if (next > daysInMonth) next = 1;
    setSelectedDay(next);
  };

  const handleStepMonth = (delta: number) => {
    let next = selectedMonthIndex + delta;
    if (next < 0) next = 11;
    if (next > 11) next = 0;
    setSelectedMonthIndex(next);
  };

  const handleStepYear = (delta: number) => {
    const currentYear = new Date().getFullYear();
    let next = selectedYear + delta;
    if (next < 1920) next = 1920;
    if (next > currentYear) next = currentYear;
    setSelectedYear(next);
  };

  const handleContinue = async () => {
    const currentYear = new Date().getFullYear();
    const calculatedAge = Math.max(1, currentYear - selectedYear);
    const monthStr = (selectedMonthIndex + 1).toString().padStart(2, "0");
    const dayStr = safeDay.toString().padStart(2, "0");
    const birthDateISO = `${selectedYear}-${monthStr}-${dayStr}`;

    setLoading(true);
    setErrorMsg(null);

    try {
      if (userId) {
        await setDoc(
          doc(db, "users", userId),
          {
            age: calculatedAge,
            birthDate: birthDateISO,
            birthDayFormatted: formattedDisplay,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
      onSaveAge(calculatedAge, birthDateISO);
    } catch (err) {
      console.warn("Notice saving birthday to Firestore:", err);
      onSaveAge(calculatedAge, birthDateISO);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between max-w-md mx-auto h-dvh max-h-screen overflow-hidden select-none border-x border-slate-200">
      {/* 1. Header with Back Arrow and Top Right Logo */}
      <header className="p-4 flex items-center justify-between shrink-0">
        <button
          onClick={() => {
            if (onCancel) onCancel();
            else onSaveAge(Math.max(1, new Date().getFullYear() - selectedYear));
          }}
          className="p-2 -ml-2 text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6 text-slate-950 stroke-[2.5]" />
        </button>

        {/* Original Brand Logo in Top Right */}
        <div className="flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Open Desh Logo"
            className="h-8 sm:h-9 max-w-[140px] object-contain"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.endsWith("/assets/logo.svg")) {
                target.src = "/assets/logo.svg";
              }
            }}
          />
        </div>
      </header>

      {/* 2. Main Birthday Prompt & Formatted Date Display */}
      <div className="flex-1 flex flex-col px-6 pt-2 pb-4 min-h-0">
        <div className="shrink-0">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
            When's your<br />birthday?
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Your birthday won't be shown publicly
          </p>

          {/* Formatted Date Display (Exact match to 22-Aug-2013) */}
          <div className="text-3xl sm:text-4xl font-bold text-slate-950 mt-6 sm:mt-8 tracking-tight">
            {formattedDisplay}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
            {errorMsg}
          </div>
        )}

        {/* 3. Three-Column Wheel Roller Date Picker (Scrollable + Swipeable + Clickable) */}
        <div className="mt-auto mb-6 py-2">
          <div className="relative">
            {/* Top Divider Line */}
            <div className="absolute top-[38px] left-0 right-0 border-t border-slate-300 pointer-events-none" />

            {/* Bottom Divider Line */}
            <div className="absolute top-[86px] left-0 right-0 border-b border-slate-300 pointer-events-none" />

            <div className="grid grid-cols-3 text-center items-center select-none py-1">
              {/* Column 1: Day */}
              <WheelColumn
                label="Day"
                currentValue={safeDay}
                prevValue={prevDay}
                nextValue={nextDay}
                onStep={handleStepDay}
              />

              {/* Column 2: Month */}
              <WheelColumn
                label="Month"
                currentValue={MONTHS[selectedMonthIndex].full}
                prevValue={MONTHS[prevMonthIndex].full}
                nextValue={MONTHS[nextMonthIndex].full}
                onStep={handleStepMonth}
              />

              {/* Column 3: Year */}
              <WheelColumn
                label="Year"
                currentValue={selectedYear}
                prevValue={prevYear}
                nextValue={nextYear <= new Date().getFullYear() ? nextYear : ""}
                onStep={handleStepYear}
              />
            </div>
          </div>
        </div>

        {/* 4. Bottom Continue Button */}
        <div className="shrink-0 pt-2 pb-6">
          <button
            onClick={handleContinue}
            disabled={loading}
            className="w-full py-3.5 sm:py-4 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <span>Continue</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
