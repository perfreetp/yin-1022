import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Team, TeamMember, LeaderboardEntry } from "../types";
import { mockTeams, mockTeamMembers, mockLeaderboard } from "../data/teams";

interface TeamState {
  teams: Team[];
  teamMembers: TeamMember[];
  leaderboard: LeaderboardEntry[];
  createTeam: (team: Team, members: TeamMember[]) => void;
  updateTeam: (id: string, data: Partial<Team>) => void;
  addMember: (teamId: string, member: TeamMember) => void;
  updateMember: (memberId: string, data: Partial<TeamMember>) => void;
  removeMember: (teamMemberId: string) => void;
  archiveTeam: (id: string) => void;
  disbandTeam: (id: string) => void;
  getTeamById: (id: string) => Team | undefined;
  getTeamMembers: (teamId: string) => TeamMember[];
  getTeamsByUser: (userId: string) => Team[];
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      teams: mockTeams,
      teamMembers: mockTeamMembers,
      leaderboard: mockLeaderboard,
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
    }),
    {
      name: "debate-team-storage",
    }
  )
);
