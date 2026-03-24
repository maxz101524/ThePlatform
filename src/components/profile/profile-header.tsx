"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
    <div className="flex items-start gap-4">
      <div className="h-20 w-20 shrink-0 bg-bg-surface border border-border flex items-center justify-center text-2xl font-heading text-text-muted uppercase">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-20 w-20 object-cover" />
        ) : (
          profile.username[0]
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-3xl font-bold uppercase text-text-primary truncate">
            {profile.display_name || profile.username}
          </h1>
          {isOwnProfile && (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              Edit Profile
            </Button>
          )}
          {isLoggedIn && !isOwnProfile && (
            <FollowButton targetId={profile.id} isFollowing={initialIsFollowing} />
          )}
        </div>
        <p className="text-sm text-text-muted">@{profile.username}</p>
        {profile.bio && (
          <p className="mt-2 text-sm text-text-secondary max-w-lg">{profile.bio}</p>
        )}
        <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
          <span><strong className="text-text-primary">{profile.follower_count}</strong> followers</span>
          <span><strong className="text-text-primary">{profile.following_count}</strong> following</span>
          {profile.instagram && (
            <a
              href={`https://instagram.com/${profile.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-primary hover:underline"
            >
              @{profile.instagram}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
