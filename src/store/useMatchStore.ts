import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Match, MatchRegistration, MatchParticipant, JudgingTask } from "../types";
import { mockMatches, mockRegistrations, mockParticipants, mockJudgingTasks } from "../data/matches";
import { generateId } from "../utils";

export type ValidationResult = {
  ok: boolean;
  error?: string;
  conflictMatches?: Match[];
};

const gradePriority: Record<string, number> = {
  "大一": 1,
  "大二": 2,
  "大三": 3,
  "大四": 4,
  "研一": 5,
  "研二": 6,
  "研三": 7,
  "博士": 8,
};

function isGradeAllowed(gradeLimit: string, userGrade: string): boolean {
  if (!gradeLimit || gradeLimit === "无限制") return true;

  const userP = gradePriority[userGrade] ?? 0;

  if (gradeLimit === "大一") return userP === 1;
  if (gradeLimit === "大一及以上") return userP >= 1;
  if (gradeLimit === "大二") return userP === 2;
  if (gradeLimit === "大二及以上") return userP >= 2;
  if (gradeLimit === "大三") return userP === 3;
  if (gradeLimit === "大三及以上") return userP >= 3;
  if (gradeLimit === "大四") return userP === 4;
  if (gradeLimit === "大四及以上") return userP >= 4;
  if (gradeLimit.includes("及以上")) {
    const base = gradeLimit.replace("及以上", "").trim();
    const baseP = gradePriority[base] ?? 0;
    return userP >= baseP;
  }
  if (gradeLimit.includes("-")) {
    const [from, to] = gradeLimit.split("-");
    const fromP = gradePriority[from] ?? 0;
    const toP = gradePriority[to] ?? 0;
    return userP >= fromP && userP <= toP;
  }
  return gradeLimit === userGrade;
}

interface MatchState {
  matches: Match[];
  registrations: MatchRegistration[];
  participants: MatchParticipant[];
  judgingTasks: JudgingTask[];
  addMatch: (match: Match) => void;
  updateMatch: (id: string, data: Partial<Match>) => void;
  checkGradeLimit: (matchId: string, userGrade: string) => ValidationResult;
  checkTimeConflict: (userId: string, date: string, time: string) => Match[];
  checkAllConflicts: (matchId: string, userId: string, userGrade: string) => ValidationResult;
  registerMatch: (matchId: string, userId: string, userGrade: string, teamId?: string) => ValidationResult;
  approveRegistration: (regId: string, userGrade: string) => ValidationResult;
  rejectRegistration: (id: string) => void;
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

      checkGradeLimit: (matchId, userGrade) => {
        const match = get().matches.find((m) => m.id === matchId);
        if (!match) return { ok: false, error: "比赛不存在" };
        if (isGradeAllowed(match.gradeLimit, userGrade)) {
          return { ok: true };
        }
        return {
          ok: false,
          error: `「${match.title}」仅限 ${match.gradeLimit} 学生参赛，你是${userGrade}，不符合报名要求。`,
        };
      },

      checkTimeConflict: (userId, date, time) => {
        const state = get();
        const conflicts: Match[] = [];

        // 已审核通过的报名
        const approvedIds = new Set(
          state.registrations
            .filter((r) => r.userId === userId && r.status === "approved")
            .map((r) => r.matchId)
        );

        // 已安排上场的比赛（participants）
        const participantMatchIds = new Set<string>();
        state.participants.forEach((p) => {
          const isOnTeam = p.speakers.some((s) => s.userId === userId);
          if (isOnTeam) participantMatchIds.add(p.matchId);
        });

        const checkIds = new Set<string>([...approvedIds, ...participantMatchIds]);
        state.matches.forEach((m) => {
          if (checkIds.has(m.id) && m.date === date && m.time === time) {
            conflicts.push(m);
          }
        });

        return conflicts;
      },

      checkAllConflicts: (matchId, userId, userGrade) => {
        const state = get();
        const match = state.matches.find((m) => m.id === matchId);
        if (!match) return { ok: false, error: "比赛不存在" };

        const gradeRes = state.checkGradeLimit(matchId, userGrade);
        if (!gradeRes.ok) return gradeRes;

        const conflicts = state.checkTimeConflict(userId, match.date, match.time);
        if (conflicts.length > 0) {
          const titles = conflicts.map((c) => `「${c.title}」(${c.time})`).join("、");
          return {
            ok: false,
            error: `时间冲突！你在${match.date} ${match.time} 已经有安排：${titles}`,
            conflictMatches: conflicts,
          };
        }
        return { ok: true };
      },

      registerMatch: (matchId, userId, userGrade, teamId) => {
        const state = get();
        const match = state.matches.find((m) => m.id === matchId);

        // 检查是否已报名
        const exist = state.registrations.find(
          (r) => r.matchId === matchId && r.userId === userId
        );
        if (exist && exist.status !== "rejected") {
          return { ok: false, error: "你已经报名过这场比赛了" };
        }

        // 检查年级 + 时间冲突
        const check = state.checkAllConflicts(matchId, userId, userGrade);
        if (!check.ok) return check;

        if (!match) return { ok: false, error: "比赛不存在" };

        // 满了吗？
        if (match.registeredCount >= match.maxTeams) {
          return { ok: false, error: `「${match.title}」报名人数已满（${match.maxTeams}）` };
        }

        const newReg: MatchRegistration = {
          id: generateId("r"),
          matchId,
          userId,
          teamId,
          status: "pending",
          registeredAt: new Date().toISOString(),
        };

        set({
          registrations: exist
            ? state.registrations.map((r) => (r.id === exist.id ? { ...newReg, id: exist.id } : r))
            : [...state.registrations, newReg],
          matches: state.matches.map((m) =>
            m.id === matchId
              ? { ...m, registeredCount: exist ? m.registeredCount : m.registeredCount + 1 }
              : m
          ),
        });

        return { ok: true };
      },

      approveRegistration: (regId, userGrade) => {
        const state = get();
        const reg = state.registrations.find((r) => r.id === regId);
        if (!reg) return { ok: false, error: "报名记录不存在" };
        if (reg.status === "approved") return { ok: false, error: "已审核通过" };

        // 年级限制
        const gradeRes = state.checkGradeLimit(reg.matchId, userGrade);
        if (!gradeRes.ok) return gradeRes;

        const match = state.matches.find((m) => m.id === reg.matchId);
        if (match) {
          const conflicts = state.checkTimeConflict(reg.userId, match.date, match.time);
          if (conflicts.length > 0) {
            const titles = conflicts.map((c) => `「${c.title}」(${c.time})`).join("、");
            return {
              ok: false,
              error: `审核失败：该选手已有时间冲突 —— ${match.date} ${match.time} 安排了 ${titles}`,
              conflictMatches: conflicts,
            };
          }
        }

        set({
          registrations: state.registrations.map((r) =>
            r.id === regId ? { ...r, status: "approved" } : r
          ),
        });
        return { ok: true };
      },

      rejectRegistration: (id) =>
        set({
          registrations: get().registrations.map((r) =>
            r.id === id ? { ...r, status: "rejected" } : r
          ),
        }),

      getMatchesByUser: (userId) => {
        const state = get();
        const matchIds = new Set<string>();
        state.registrations
          .filter((r) => r.userId === userId)
          .forEach((r) => matchIds.add(r.matchId));
        state.participants.forEach((p) => {
          if (p.speakers.some((s) => s.userId === userId)) {
            matchIds.add(p.matchId);
          }
        });
        return state.matches.filter((m) => matchIds.has(m.id));
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
