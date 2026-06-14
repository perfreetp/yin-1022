import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Team, TeamMember, LeaderboardEntry, BracketMatch } from "../types";
import { mockTeams, mockTeamMembers, mockLeaderboard } from "../data/teams";

interface TeamState {
  teams: Team[];
  teamMembers: TeamMember[];
  leaderboard: LeaderboardEntry[];
  brackets: BracketMatch[];
  createTeam: (team: Team, members: TeamMember[]) => void;
  updateTeam: (id: string, data: Partial<Team>) => void;
  addMember: (teamId: string, member: TeamMember) => void;
  updateMember: (memberId: string, data: Partial<TeamMember>) => void;
  removeMember: (teamMemberId: string) => void;
  swapMembers: (teamId: string, formalId: string, substituteId: string) => void;
  archiveTeam: (id: string) => void;
  disbandTeam: (id: string) => void;
  getTeamById: (id: string) => Team | undefined;
  getTeamMembers: (teamId: string) => TeamMember[];
  getTeamsByUser: (userId: string) => Team[];
  setBrackets: (brackets: BracketMatch[]) => void;
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      teams: mockTeams,
      teamMembers: mockTeamMembers,
      leaderboard: mockLeaderboard,
      brackets: [],
      createTeam: (team, members) =>
        set({
          teams: [...get().teams, team],
          teamMembers: [...get().teamMembers, ...members],
        }),
      updateTeam: (id, data) =>
        set({
          teams: get().teams.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        }),
      addMember: (teamId, member) =>
        set({
          teamMembers: [...get().teamMembers, member],
        }),
      updateMember: (memberId, data) =>
        set({
          teamMembers: get().teamMembers.map((m) =>
            m.id === memberId ? { ...m, ...data } : m
          ),
        }),
      removeMember: (teamMemberId) =>
        set({
          teamMembers: get().teamMembers.filter((m) => m.id !== teamMemberId),
        }),
      swapMembers: (teamId, formalId, substituteId) => {
        const formal = get().teamMembers.find((m) => m.id === formalId);
        const substitute = get().teamMembers.find((m) => m.id === substituteId);
        if (!formal || !substitute) return;
        set({
          teamMembers: get().teamMembers.map((m) => {
            if (m.id === formalId) {
              return { ...m, isSubstitute: true, position: substitute.position };
            }
            if (m.id === substituteId) {
              return { ...m, isSubstitute: false, position: formal.position };
            }
            return m;
          }),
        });
      },
      archiveTeam: (id) =>
        set({
          teams: get().teams.map((t) =>
            t.id === id ? { ...t, archived: true, status: "archived" } : t
          ),
        }),
      disbandTeam: (id) =>
        set({
          teamMembers: get().teamMembers.filter((m) => m.teamId !== id),
          teams: get().teams.filter((t) => t.id !== id),
        }),
      getTeamById: (id) => get().teams.find((t) => t.id === id),
      getTeamMembers: (teamId) =>
        get().teamMembers.filter((m) => m.teamId === teamId),
      getTeamsByUser: (userId) => {
        const memberTeamIds = get()
          .teamMembers.filter((m) => m.userId === userId)
          .map((m) => m.teamId);
        return get().teams.filter((t) => memberTeamIds.includes(t.id));
      },
      setBrackets: (brackets) => set({ brackets }),
    }),
    {
      name: "debate-team-storage",
    }
  )
);
