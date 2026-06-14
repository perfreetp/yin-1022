import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types";
import { mockUsers, currentUserId } from "../data/users";

interface UserState {
  users: User[];
  currentUserId: string;
  setCurrentUser: (id: string) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  getCurrentUser: () => User | undefined;
  getUserById: (id: string) => User | undefined;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: mockUsers,
      currentUserId: currentUserId,
      setCurrentUser: (id) => set({ currentUserId: id }),
      updateUser: (id, data) =>
        set({
          users: get().users.map((u) =>
            u.id === id ? { ...u, ...data } : u
          ),
        }),
      getCurrentUser: () => get().users.find((u) => u.id === get().currentUserId),
      getUserById: (id) => get().users.find((u) => u.id === id),
    }),
    {
      name: "debate-user-storage",
    }
  )
);
