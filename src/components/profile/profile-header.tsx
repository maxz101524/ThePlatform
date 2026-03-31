"use client";

import { useState } from "react";
import { FollowButton } from "@/components/profile/follow-button";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import type { UserProfile } from "@/lib/types";

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  isFollowing: boolean;
  isLoggedIn: boolean;
}

export function ProfileHeader({ profile, isOwnProfile, isFollowing: initialIsFollowing, isLoggedIn }: ProfileHeaderProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <EditProfileForm profile={profile} onClose={() => setEditing(false)} />;
  }

  return (
    <div className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-4">
      {/* Avatar */}
      <div className="w-[140px] h-[140px] shrink-0 rounded-xl border-4 border-accent-red shadow-xl overflow-hidden flex items-center justify-center bg-bg-dark-elevated">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-[140px] h-[140px] rounded-xl object-cover" />
        ) : (
          <span className="text-5xl font-heading text-zinc-400 uppercase">
            {profile.username[0]}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-center md:text-left">
        <h1 className="font-heading text-7xl md:text-8xl font-black uppercase leading-[0.85] tracking-tighter text-white">
          {profile.display_name || profile.username}
        </h1>
        <p className="font-mono text-accent-red text-sm tracking-widest uppercase mt-3">
          @{profile.username}
        </p>
        {profile.bio && (
          <p className="text-zinc-400 text-sm mt-3 max-w-xl leading-relaxed">
            {profile.bio}
          </p>
        )}
        <div className="mt-3 flex items-center justify-center md:justify-start gap-4 text-xs">
          <span>
            <strong className="text-zinc-400">{profile.follower_count}</strong>{" "}
            <span className="text-zinc-500">followers</span>
          </span>
          <span>
            <strong className="text-zinc-400">{profile.following_count}</strong>{" "}
            <span className="text-zinc-500">following</span>
          </span>
          {profile.instagram && (
            <a
              href={`https://instagram.com/${profile.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-red hover:underline"
            >
              @{profile.instagram}
            </a>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 shrink-0">
        {isOwnProfile && (
          <button
            onClick={() => setEditing(true)}
            className="bg-accent-red px-8 py-3 rounded-lg font-heading font-bold uppercase text-white hover:brightness-110 transition-all"
          >
            Edit Profile
          </button>
        )}
        {isLoggedIn && !isOwnProfile && (
          <FollowButton targetId={profile.id} isFollowing={initialIsFollowing} />
        )}
      </div>
    </div>
  );
}
