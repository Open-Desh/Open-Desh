import React, { useState } from "react";
import {
  ArrowLeft,
  MoreVertical,
  MapPin,
  Link as LinkIcon,
  Star,
  Sparkles,
  Edit3,
  Share2,
  CheckCircle2,
  MessageCircle,
  Repeat2,
  Heart,
  Award,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { UserProfile, ReportIssue } from "../types.ts";
import { EditProfileModal } from "./EditProfileModal.tsx";
import { SystemScoreModal } from "./SystemScoreModal.tsx";
import { RateUserModal } from "./RateUserModal.tsx";

interface ProfileViewProps {
  userProfile: UserProfile;
  activeUser: UserProfile;
  userReports: ReportIssue[];
  onBack?: () => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  onRateUser?: (rating: number, comment: string) => Promise<void>;
  onNavigateToPost?: (reportId: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  activeUser,
  userReports,
  onBack,
  onUpdateProfile,
  onRateUser,
  onNavigateToPost,
}) => {
  const [activeTab, setActiveTab] = useState<"Report" | "Replies" | "Rereport" | "Service" | "Performance">("Report");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSystemScoreOpen, setIsSystemScoreOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(userProfile.isFollowing || false);
  const [followersCount, setFollowersCount] = useState(userProfile.followersCount);

  const isOwnProfile = userProfile.id === activeUser.id;

  const handleToggleFollow = () => {
    setIsFollowing((prev) => !prev);
    setFollowersCount((prev) => (isFollowing ? prev - 1 : prev + 1));
  };

  const getBadges = () => {
    switch (userProfile.category) {
      case "department":
        return {
          primary: "Department",
          primaryColor: "bg-amber-600 text-white",
          secondary: "Govt Verified",
          secondaryColor: "bg-blue-600 text-white",
          roleTitle: userProfile.departmentDetails
            ? `${userProfile.departmentDetails.designation} • ${userProfile.departmentDetails.name}`
            : "Govt Officer",
        };
      case "representative":
        return {
          primary: "Representative",
          primaryColor: "bg-blue-600 text-white",
          secondary: "Rate Leader",
          secondaryColor: "bg-blue-600 text-white",
          roleTitle: userProfile.representativeDetails
            ? `${userProfile.representativeDetails.position} • ${userProfile.representativeDetails.party}`
            : "Elected Member",
        };
      default:
        return {
          primary: "Citizen",
          primaryColor: "bg-blue-600 text-white",
          secondary: "Verified Resident",
          secondaryColor: "bg-emerald-600 text-white",
          roleTitle: userProfile.citizenDetails?.occupation || "Citizen Contributor",
        };
    }
  };

  const badgeInfo = getBadges();

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert("Profile link copied to clipboard!");
    }
  };

  return (
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* Top Bar matching user image design */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 -ml-1 text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-none">
              {userProfile.fullName || "Representative User Name"}
            </h1>
            <span className="text-[11px] text-slate-500 font-medium">
              @{userProfile.username}
            </span>
          </div>
        </div>

        <button
          onClick={handleShare}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Main Profile Header matching user uploaded image (20260819_011518.jpg) */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* DP & Top Metrics Row */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Circular DP Avatar */}
          <div className="relative shrink-0">
            {userProfile.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.fullName}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-full object-cover border border-slate-200 shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-blue-100 text-blue-900 font-black text-xl flex items-center justify-center border border-blue-200">
                DP
              </div>
            )}
            {userProfile.verified && (
              <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full border-2 border-white">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          {/* Right Info: Name & Stats */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
              {userProfile.fullName}
            </h2>

            {/* 3 Stats Counters */}
            <div className="flex items-center gap-4 sm:gap-6 mt-2 text-slate-900">
              <div>
                <span className="font-black text-sm sm:text-base block leading-none">
                  {userProfile.postsCount?.toLocaleString() || userReports.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">posts</span>
              </div>
              <div>
                <span className="font-black text-sm sm:text-base block leading-none">
                  {followersCount >= 1000 ? `${(followersCount / 1000).toFixed(0)}K` : followersCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">followers</span>
              </div>
              <div>
                <span className="font-black text-sm sm:text-base block leading-none">
                  {userProfile.followingCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">following</span>
              </div>
            </div>
          </div>
        </div>

        {/* Role Badges matching user image */}
        <div className="flex items-center gap-2">
          <span
            className={`${badgeInfo.primaryColor} px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide shadow-2xs`}
          >
            {badgeInfo.primary}
          </span>
          <button
            onClick={() => {
              if (userProfile.category === "representative") {
                setIsRateModalOpen(true);
              }
            }}
            className={`${badgeInfo.secondaryColor} px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide shadow-2xs hover:opacity-90 active:scale-95 transition-all`}
          >
            {badgeInfo.secondary}
          </button>
        </div>

        {/* Abouts / Bio Section */}
        <div className="space-y-1.5">
          <p className="text-xs sm:text-sm text-slate-800 font-normal leading-relaxed">
            {userProfile.bio || "Yaa par abouts section aa jayega jo creator daalega"}
          </p>

          {/* Location & External Link */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium pt-1">
            <span className="flex items-center gap-1 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{userProfile.location || "jharkhand"}</span>
            </span>

            {userProfile.websiteUrl && (
              <a
                href={userProfile.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline truncate max-w-[260px]"
              >
                <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{userProfile.websiteUrl.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
          </div>
        </div>

        {/* Performance Scorecard Card (3 columns matching user image) */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 sm:p-4 grid grid-cols-3 divide-x divide-slate-200 shadow-2xs">
          {/* System Score */}
          <div
            onClick={() => setIsSystemScoreOpen(true)}
            className="px-2 text-center cursor-pointer hover:bg-slate-100/70 rounded-xl transition-colors py-1"
          >
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
              SYSTEM SCORE
            </span>
            <span className="text-xl sm:text-2xl font-black text-blue-600 block leading-tight">
              {userProfile.systemScore || 84}
            </span>
          </div>

          {/* Public Rating */}
          <div
            onClick={() => setIsRateModalOpen(true)}
            className="px-2 text-center cursor-pointer hover:bg-slate-100/70 rounded-xl transition-colors py-1"
          >
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
              PUBLIC RATING
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 flex items-center justify-center gap-1 leading-tight">
              {userProfile.publicRating || 4.4}
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </span>
          </div>

          {/* Reviews */}
          <div
            onClick={() => setIsRateModalOpen(true)}
            className="px-2 text-center cursor-pointer hover:bg-slate-100/70 rounded-xl transition-colors py-1"
          >
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
              REVIEWS
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 block leading-tight">
              {userProfile.reviewsCount ? `${(userProfile.reviewsCount / 1000).toFixed(1)}K` : "142.8K"}
            </span>
          </div>
        </div>

        {/* Dynamic Action Buttons matching image (Mention / Follow or Edit Profile) */}
        {isOwnProfile ? (
          <div className="flex gap-2.5 pt-1">
            <button
              id="edit-my-profile-btn"
              onClick={() => setIsEditOpen(true)}
              className="flex-1 py-2.5 px-4 rounded-full border border-slate-300 text-slate-900 text-xs sm:text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Edit3 className="w-4 h-4 text-slate-600" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={handleShare}
              className="py-2.5 px-5 rounded-full border border-slate-300 text-slate-900 text-xs sm:text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Share2 className="w-4 h-4 text-slate-600" />
              <span>Share</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => {
                alert(`Direct mention @${userProfile.username} attached to your next civic draft.`);
              }}
              className="py-2.5 px-4 rounded-full border border-slate-300 text-slate-900 text-xs sm:text-sm font-extrabold hover:bg-slate-50 transition-all text-center shadow-2xs"
            >
              Mention
            </button>
            <button
              onClick={handleToggleFollow}
              className={`py-2.5 px-4 rounded-full text-xs sm:text-sm font-extrabold transition-all text-center shadow-xs ${
                isFollowing
                  ? "bg-slate-100 text-slate-800 border border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  : "bg-slate-900 text-white hover:bg-black"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs matching image: Report | Replies | Rereport | Service | Performance */}
      <div className="border-b border-slate-200 bg-white">
        <div className="flex justify-between overflow-x-auto no-scrollbar px-2 sm:px-4">
          {(["Report", "Replies", "Rereport", "Service", "Performance"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3.5 px-2.5 sm:px-4 text-xs sm:text-sm font-extrabold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? "border-blue-600 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Display */}
      <div className="divide-y divide-slate-100">
        {/* 1. Report Tab */}
        {activeTab === "Report" && (
          <div className="divide-y divide-slate-100">
            {userReports.length > 0 ? (
              userReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => onNavigateToPost && onNavigateToPost(report.id)}
                  className="p-4 hover:bg-slate-50/70 transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {report.category}
                    </span>
                    <span className="text-slate-400 font-medium">{report.timestamp}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-normal">
                    {report.text}
                  </p>

                  {report.imageUrl && (
                    <div className="rounded-xl overflow-hidden max-h-56 bg-slate-900">
                      <img
                        src={report.imageUrl}
                        alt="Evidence"
                        className="w-full h-full object-cover max-h-56"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> {report.likesCount}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Repeat2 className="w-4 h-4 text-emerald-600" /> {report.reReportsCount}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <MessageCircle className="w-4 h-4 text-blue-500" /> {report.repliesCount}
                    </span>
                    <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {report.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No reports published by this user yet.
              </div>
            )}
          </div>
        )}

        {/* 2. Replies Tab */}
        {activeTab === "Replies" && (
          <div className="p-4 space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-900">Official Intervention on Report #REP-001</span>
                <span className="text-slate-400 text-[11px]">1 hour ago</span>
              </div>
              <p className="text-xs text-slate-700">
                "Official PWD Team has acknowledged ticket #PWD-JH-9921. Road resurfacing contractor has been summoned on site."
              </p>
              <span className="text-[10px] font-bold text-blue-600">Verified Department Action</span>
            </div>
          </div>
        )}

        {/* 3. Rereport Tab */}
        {activeTab === "Rereport" && (
          <div className="p-4 space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                <Repeat2 className="w-4 h-4" /> Re-reported into Jharkhand Constituency Feed
              </div>
              <p className="text-xs text-slate-800">
                "Deep 3-foot asphalt crater on Main Road near Kanke Chowk. @PWD urgent repair required!"
              </p>
            </div>
          </div>
        )}

        {/* 4. Service Tab */}
        {activeTab === "Service" && (
          <div className="p-4 space-y-3">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <h3 className="text-xs font-black uppercase text-slate-900">
                Constituency Welfare Services & Helplines
              </h3>
              <ul className="text-xs text-slate-700 space-y-2">
                <li className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span>Constituency Public Grievance Desk:</span>
                  <span className="font-bold text-blue-600">0651-2400-881</span>
                </li>
                <li className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span>MLALAD Public Fund Portal:</span>
                  <span className="font-bold text-emerald-600">Active (FY 26-27)</span>
                </li>
                <li className="flex justify-between items-center py-1">
                  <span>Direct Citizen WhatsApp Helpdesk:</span>
                  <span className="font-bold text-slate-900">+91 94311 00921</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* 5. Performance Tab */}
        {activeTab === "Performance" && (
          <div className="p-4 space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">Legislative Attendance (Vidhan Sabha)</span>
                <span className="font-black text-blue-600">92%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: "92%" }}></div>
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="font-bold text-slate-800">Promises Delivered</span>
                <span className="font-black text-emerald-600">19 / 30 (63.3%)</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: "63.3%" }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        userProfile={userProfile}
        onSave={onUpdateProfile}
      />

      {/* System Score Breakdown Modal */}
      <SystemScoreModal
        isOpen={isSystemScoreOpen}
        onClose={() => setIsSystemScoreOpen(false)}
        targetName={userProfile.fullName}
        systemScore={userProfile.systemScore || 84}
      />

      {/* Rate User Modal */}
      <RateUserModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        targetName={userProfile.fullName}
        targetId={userProfile.id}
        existingReviews={userProfile.reviews || []}
        onSubmitReview={async (rating, comment) => {
          if (onRateUser) {
            await onRateUser(rating, comment);
          }
        }}
      />
    </div>
  );
};
