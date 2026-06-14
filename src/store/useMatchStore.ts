import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Match, MatchRegistration, MatchParticipant, JudgingTask } from "../types";
import { mockMatches, mockRegistrations, mockParticipants, mockJudgingTasks } from "../data/matches";

interface MatchState {
  matches: Match[];
  registrations: MatchRegistration[];
  participants: MatchParticipant[];
  judgingTasks: JudgingTask[];
  addMatch: (match: Match) => void;
  updateMatch: (id: string, data: Partial<Match>) => void;
  registerMatch: (registration: MatchRegistration) => void;
  approveRegistration: (id: string) => void;
  rejectRegistration: (id: string) => void;
  checkTimeConflict: (userId: string, date: string, time: string) => Match[];
  getMatchesByUser: (userId: string) => Match[];
  getMatchById: (id: string) => Match | undefined;
  getJudgeTasks: (judgeId: string) => JudgingTask[];
  submitJudging: (taskId: string, scores: JudgingTask["scores"], comment: string, bestSpeakerId: string) => void;
}

export const useMatchStore = create<MatchState>()(
  persist(
    (set, get) => ({
      matches: mockMatches,
      registrations: mockRegistrations,
      participants: mockParticipants,
      judgingTasks: mockJudgingTasks,
      addMatch: (match) => set({ matches: [...get().matches, match] }),
      updateMatch: (id, data) =>
        set({
          matches: get().matches.map((m) =>
            m.id === id ? { ...m, ...data } : m
          ),
        }),
      registerMatch: (registration) =>
        set({
          registrations: [...get().registrations, registration],
        }),
      approveRegistration: (id) =>
        set({
          registrations: get().registrations.map((r) =>
            r.id === id ? { ...r, status: "approved" } : r
          ),
        }),
      rejectRegistration: (id) =>
        set({
          registrations: get().registrations.map((r) =>
            r.id === id ? { ...r, status: "rejected" } : r
          ),
        }),
      checkTimeConflict: (userId, date, time) => {
        const userRegistrations = get()
          .registrations.filter((r) => r.userId === userId && r.status === "approved")
          .map((r) => r.matchId);
        return get().matches.filter(
          (m) =>
            userRegistrations.includes(m.id) &&
            m.date === date &&
            m.time === time
        );
      },
      getMatchesByUser: (userId) => {
        const userRegistrations = get()
          .registrations.filter((r) => r.userId === userId)
          .map((r) => r.matchId);
        return get().matches.filter((m) => userRegistrations.includes(m.id));
      },
      getMatchById: (id) => get().matches.find((m) => m.id === id),
      getJudgeTasks: (judgeId) =>
        get().judgingTasks.filter((t) => t.judgeId === judgeId),
      submitJudging: (taskId, scores, comment, bestSpeakerId) =>
        set({
          judgingTasks: get().judgingTasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: "completed",
                  scores,
                  comment,
                  bestSpeakerId,
                  submittedAt: new Date().toISOString(),
                }
              : t
          ),
        }),
    }),
    {
      name: "debate-match-storage",
    }
  )
);
