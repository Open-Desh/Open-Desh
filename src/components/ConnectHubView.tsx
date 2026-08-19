import React, { useState } from "react";
import { Users, MessageSquare, Video, Calendar, Sparkles, Send } from "lucide-react";
import { UserProfile } from "../types.ts";

interface ConnectHubViewProps {
  userProfile: UserProfile;
}

export const ConnectHubView: React.FC<ConnectHubViewProps> = ({ userProfile }) => {
  const [activeTab, setActiveTab] = useState<"townhalls" | "discussions">("townhalls");
  const [discussionPost, setDiscussionPost] = useState("");
  const [discussions, setDiscussions] = useState([
    {
      id: "disc_1",
      author: "Vikas Aggarwal",
      authorRole: "Citizen Activist",
      title: "Proposal for dedicated bicycle corridors along Golf Course Extension Rd",
      text: "We should formally petition GMDA to carve out safe segregated bicycle tracks before the next road resurfacing cycle. Thoughts on collective signature submission?",
      votes: 84,
      replies: 19,
      timestamp: "2 hours ago",
    },
    {
      id: "disc_2",
      author: "Dr. Meenakshi S.",
      authorRole: "Environmental Scientist",
      title: "Groundwater recharge pits mandate for residential apartments",
      text: "With summer approaching, auditing functional status of rainwater harvesting pits across Sector 45-57 is vital. Let's create an open data registry.",
      votes: 112,
      replies: 26,
      timestamp: "5 hours ago",
    },
  ]);

  const townhalls = [
    {
      id: "th_1",
      title: "Old Gurugram Metro Rail Line: Public Consultation & Land Alignment",
      host: "DMRC & Municipal Joint Committee",
      date: "Saturday, 22 Aug 2026 • 11:00 AM IST",
      type: "Hybrid Live Townhall",
      attendees: 1240,
      status: "Upcoming",
    },
    {
      id: "th_2",
      title: "Monsoon Preparedness & Badshahpur Stormwater Drainage Audit",
      host: "Executive Engineer, PWD & Jal Board",
      date: "Wednesday, 26 Aug 2026 • 04:00 PM IST",
      type: "Virtual Broadcast & Q/A",
      attendees: 860,
      status: "Registration Open",
    },
  ];

  const handlePostDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discussionPost.trim()) return;

    const newDisc = {
      id: `disc_${Date.now()}`,
      author: userProfile.fullName,
      authorRole: `${userProfile.category.toUpperCase()} • Verified`,
      title: discussionPost.slice(0, 50) + "...",
      text: discussionPost,
      votes: 1,
      replies: 0,
      timestamp: "Just now",
    };

    setDiscussions([newDisc, ...discussions]);
    setDiscussionPost("");
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-12 animate-fadeIn space-y-4">
      {/* Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900">Public Townhall & Civic Assembly</h1>
            <p className="text-xs text-slate-500">
              Live consultation sessions between citizens, elected representatives, and departmental engineers.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("townhalls")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "townhalls"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          Live Virtual Townhalls ({townhalls.length})
        </button>
        <button
          onClick={() => setActiveTab("discussions")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "discussions"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
          }`}
        >
          Community Policy Debates ({discussions.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === "townhalls" ? (
        <div className="space-y-3">
          {townhalls.map((th) => (
            <div
              key={th.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {th.type}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {th.status}
                </span>
              </div>

              <h3 className="text-base font-black text-slate-900">{th.title}</h3>
              <p className="text-xs text-slate-500 font-medium">Conducted by: {th.host}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{th.date}</span>
                </span>
                <button
                  onClick={() => alert("You have been registered for this Townhall session. Joining link dispatched.")}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all"
                >
                  Join Public Room
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Post Box */}
          <form
            onSubmit={handlePostDiscussion}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-3"
          >
            <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider">
              Start Citizen Debate / Policy Petition
            </h3>
            <textarea
              rows={2}
              value={discussionPost}
              onChange={(e) => setDiscussionPost(e.target.value)}
              placeholder="Present your civic proposal or municipal improvement idea..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!discussionPost.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
              >
                Publish Proposal
              </button>
            </div>
          </form>

          {/* List */}
          <div className="space-y-3">
            {discussions.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-2"
              >
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span className="font-bold text-slate-900">{d.author} • {d.authorRole}</span>
                  <span>{d.timestamp}</span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-900">{d.title}</h4>
                <p className="text-xs text-slate-700 leading-relaxed">{d.text}</p>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 pt-2 border-t border-slate-100">
                  <button className="hover:text-blue-600">👍 {d.votes} Endorsements</button>
                  <button className="hover:text-blue-600">💬 {d.replies} Arguments</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
