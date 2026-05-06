"use client";

export interface StoredUserProfile {
  name: string;
  college: string;
  branch: string;
  year: string;
  clubs: string;
}

const PROFILE_KEY = "campusmind_user";

export function saveProfile(profile: StoredUserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): StoredUserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as StoredUserProfile) : null;
  } catch {
    return null;
  }
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY);
}

export function getFirstName(profile: Pick<StoredUserProfile, "name"> | null) {
  return profile?.name?.trim().split(/\s+/)[0] || "there";
}
