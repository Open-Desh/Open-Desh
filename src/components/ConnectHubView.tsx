import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, Users } from "lucide-react";
import { UserProfile } from "../types.ts";
import { db } from "../firebase.ts";
import { collection, getDocs } from "firebase/firestore";

interface ConnectHubViewProps {
  userProfile: UserProfile;
  onBack: () => void;
  onSelectUser: (userId: string) => void;
  onToggleFollow?: (userId: string) => void;
}

export const ConnectHubView: React.FC<ConnectHubViewProps> = ({
  userProfile,
  onBack,
  onSelectUser,
  onToggleFollow,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  // Fetch real users from Firebase Firestore and backend database
  useEffect(() => {
    let isMounted = true;

    async function loadRealUsers() {
      setLoading(true);
      const userMap: Record<string, UserProfile> = {};

      // 1. Fetch from Firestore users collection
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as UserProfile;
          if (data && (data.id || docSnap.id)) {
            const uid = data.id || docSnap.id;
            userMap[uid] = {
              ...data,
              id: uid,
            };
          }
        });
      } catch (err) {
        console.warn("Firestore users query notice:", err);
      }

      // 2. Fetch from /api/users to complement/hydrate with registered backend entities
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const apiUsers: UserProfile[] = await res.json();
          apiUsers.forEach((u) => {
            if (u && u.id && !userMap[u.id]) {
              userMap[u.id] = u;
            }
          });
        }
      } catch (err) {
        console.warn("API users fetch notice:", err);
      }

      if (isMounted) {
        // Exclude current user from suggestions
        const list = Object.values(userMap).filter((u) => u.id !== userProfile.id);
        setUsers(list);

        // Initialize follow status map
        const initialFollowMap: Record<string, boolean> = {};
        list.forEach((u) => {
          initialFollowMap[u.id] = Boolean(u.isFollowing);
        });
        setFollowingMap(initialFollowMap);
        setLoading(false);
      }
    }

    loadRealUsers();

    return () => {
      isMounted = false;
    };
  }, [userProfile.id]);

  const handleFollowClick = (e: React.MouseEvent, targetUserId: string) => {
    e.stopPropagation();
    setFollowingMap((prev) => ({
      ...prev,
      [targetUserId]: !prev[targetUserId],
    }));

    if (onToggleFollow) {
      onToggleFollow(targetUserId);
    }
  };

  return (
    <div className="max-w-xl mx-auto pb-24 md:pb-12 animate-fadeIn bg-white border-x border-slate-200 min-h-screen">
      {/* 1. Dedicated Fixed/Sticky Header Bar: Back Button + Connect Title (No right counter, fixed on top) */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center px-4 h-14">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors cursor-pointer mr-3"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-black text-slate-900 tracking-tight">Connect</h1>
      </div>

      {/* 2. Section Header: Suggested for you */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
          Suggested for you
        </h2>
      </div>

      {/* 3. Real Profiles List */}
      {loading ? (
        <div className="p-8 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading profiles...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="p-8 text-center space-y-2 border-t border-slate-100">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-1" />
          <p className="text-sm font-bold text-slate-800">No profiles found</p>
          <p className="text-xs text-slate-500">
            No other registered users found in the database.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {users.map((profile) => {
            const isFollowing = followingMap[profile.id] || false;
            const isVerified =
              profile.verified ||
              profile.category === "representative" ||
              profile.category === "department";

            return (
              <div
                key={profile.id}
                onClick={() => onSelectUser(profile.id)}
                className="p-4 hover:bg-slate-50/90 transition-colors cursor-pointer flex items-start gap-3 group"
              >
                {/* Avatar */}
                <img
                  src={
                    profile.avatarUrl ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80"
                  }
                  alt={profile.fullName}
                  className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                />

                {/* Info Container */}
                <div className="flex-1 min-w-0 pr-2">
                  {/* Name + Verified Badge */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-black text-slate-900 hover:underline leading-tight truncate">
                      {profile.fullName}
                    </h3>
                    {isVerified && (
                      <CheckCircle2 className="w-4 h-4 text-sky-500 fill-sky-500 text-white shrink-0" />
                    )}
                    {profile.category === "representative" && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                        {profile.representativeDetails?.position || "Representative"}
                      </span>
                    )}
                    {profile.category === "department" && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                        {profile.departmentDetails?.officialBadge || "Official Dept"}
                      </span>
                    )}
                  </div>

                  {/* Handle */}
                  <p className="text-xs text-slate-500 font-medium">
                    @{profile.username.replace(/^@/, "")}
                  </p>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-xs text-slate-800 mt-1 line-clamp-2 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}

                  {/* Additional Context Tags (Constituency / Department / Location) */}
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 flex-wrap">
                    {profile.representativeDetails?.constituency && (
                      <span className="font-bold text-slate-600">
                        📍 {profile.representativeDetails.constituency}
                      </span>
                    )}
                    {profile.departmentDetails?.name && (
                      <span className="font-bold text-slate-600">
                        🏛️ {profile.departmentDetails.name}
                      </span>
                    )}
                    {profile.location && !profile.representativeDetails?.constituency && (
                      <span>📍 {profile.location}</span>
                    )}
                  </div>
                </div>

                {/* Follow / Following Button (Exact Reference Style) */}
                <button
                  onClick={(e) => handleFollowClick(e, profile.id)}
                  className={`px-5 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95 ${
                    isFollowing
                      ? "bg-white hover:bg-rose-50 text-slate-900 hover:text-rose-600 border border-slate-300 hover:border-rose-300"
                      : "bg-slate-950 hover:bg-slate-800 text-white"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
