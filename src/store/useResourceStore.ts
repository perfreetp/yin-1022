import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Resource, SpeechClip, Announcement, Comment } from "../types";
import { mockResources, mockSpeechClips, mockAnnouncements, mockComments } from "../data/resources";

interface ResourceState {
  resources: Resource[];
  speechClips: SpeechClip[];
  announcements: Announcement[];
  comments: Comment[];
  addAnnouncement: (announcement: Announcement) => void;
  addComment: (comment: Comment) => void;
  toggleFavorite: (resourceId: string) => void;
  likeSpeech: (id: string) => void;
  incrementViews: (id: string) => void;
}

export const useResourceStore = create<ResourceState>()(
  persist(
    (set, get) => ({
      resources: mockResources,
      speechClips: mockSpeechClips,
      announcements: mockAnnouncements,
      comments: mockComments,
      addAnnouncement: (announcement) =>
        set({ announcements: [...get().announcements, announcement] }),
      addComment: (comment) =>
        set({ comments: [...get().comments, comment] }),
      toggleFavorite: (resourceId) =>
        set({
          resources: get().resources.map((r) =>
            r.id === resourceId ? { ...r, favorite: !r.favorite } : r
          ),
        }),
      likeSpeech: (id) =>
        set({
          speechClips: get().speechClips.map((s) =>
            s.id === id
              ? { ...s, likes: s.likedByMe ? s.likes - 1 : s.likes + 1, likedByMe: !s.likedByMe }
              : s
          ),
        }),
      incrementViews: (id) =>
        set({
          resources: get().resources.map((r) =>
            r.id === id ? { ...r, views: r.views + 1 } : r
          ),
        }),
    }),
    {
      name: "debate-resource-storage",
    }
  )
);
