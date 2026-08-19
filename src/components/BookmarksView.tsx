import React from "react";
import { Bookmark, MapPin, Heart, Repeat2, ArrowRight } from "lucide-react";
import { ReportIssue } from "../types.ts";

interface BookmarksViewProps {
  bookmarkedReports: ReportIssue[];
  onRemoveBookmark: (id: string) => void;
  onNavigate: (view: string) => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  bookmarkedReports,
  onRemoveBookmark,
  onNavigate,
}) => {
  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-12 animate-fadeIn space-y-4">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Bookmark className="w-5 h-5 fill-blue-600 text-blue-600" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900">Saved Civic Grievances</h1>
            <p className="text-xs text-slate-500">
              Track resolution progress of bookmarked reports across your constituency.
            </p>
          </div>
        </div>
        <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
          {bookmarkedReports.length} Saved
        </span>
      </div>

      {bookmarkedReports.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No saved reports yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click the bookmark icon on any report in the feed to pin it here for ongoing tracking.
          </p>
          <button
            onClick={() => onNavigate("dashboard")}
            className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            Explore Home Feed
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarkedReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 md:p-5 space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {report.category}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{report.authorName}</span>
                </div>
                <button
                  onClick={() => onRemoveBookmark(report.id)}
                  className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>

              <p className="text-xs md:text-sm text-slate-800 leading-relaxed">{report.text}</p>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>{report.location?.city}</span>
                </span>
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  Status: {report.status} (Stage {report.departmentStatusLevel}/3)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
