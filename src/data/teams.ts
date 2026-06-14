import type { Team, TeamMember, LeaderboardEntry } from "../types";

export const mockTeams: Team[] = [
  {
    id: "t001",
    name: "逻辑风暴",
    season: "2025春季赛",
    status: "confirmed",
    captainId: "u002",
    description: "以严谨逻辑和扎实数据为基础，专注政策类辩题。",
    createdAt: "2025-04-10T08:00:00Z",
    archived: false,
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=logic",
  },
  {
    id: "t002",
    name: "思辩之光",
    season: "2025春季赛",
    status: "confirmed",
    captainId: "u001",
    description: "注重价值深度与语言感染力，擅长价值类辩题。",
    createdAt: "2025-04-12T10:00:00Z",
    archived: false,
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=light",
  },
  {
    id: "t003",
    name: "新生先锋队",
    season: "2025新生杯",
    status: "recruiting",
    captainId: "u005",
    description: "大一新生组成的队伍，招新中！欢迎热爱辩论的同学加入。",
    createdAt: "2025-06-10T14:00:00Z",
    archived: false,
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=newbie",
  },
  {
    id: "t004",
    name: "攻无不克",
    season: "2025春季赛",
    status: "full",
    captainId: "u004",
    description: "以凌厉攻辩著称的老牌强队。",
    createdAt: "2025-04-08T09:00:00Z",
    archived: false,
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=attack",
  },
  {
    id: "t005",
    name: "精英联盟",
    season: "2025精英邀请赛",
    status: "recruiting",
    captainId: "u002",
    description: "面向大二及以上同学招募，目标冲击邀请赛冠军。",
    createdAt: "2025-06-13T16:00:00Z",
    archived: false,
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=elite",
  },
  {
    id: "t006",
    name: "历史强队",
    season: "2024秋季赛",
    status: "archived",
    captainId: "u003",
    description: "2024秋季赛冠军队伍，已归档。",
    createdAt: "2024-09-01T08:00:00Z",
    archived: true,
    avatar: "https://api.dicebear.com/7.x/shapes/svg?seed=history",
  },
];

export const mockTeamMembers: TeamMember[] = [
  { id: "tm001", teamId: "t001", userId: "u002", position: "first", status: "confirmed", isSubstitute: false, joinedAt: "2025-04-10T08:00:00Z" },
  { id: "tm002", teamId: "t001", userId: "u001", position: "second", status: "confirmed", isSubstitute: false, joinedAt: "2025-04-10T09:00:00Z" },
  { id: "tm003", teamId: "t001", userId: "u004", position: "third", status: "confirmed", isSubstitute: false, joinedAt: "2025-04-10T10:00:00Z" },
  { id: "tm004", teamId: "t001", userId: "u002", position: "fourth", status: "confirmed", isSubstitute: false, joinedAt: "2025-04-10T11:00:00Z" },
  { id: "tm005", teamId: "t001", userId: "u005", position: null, status: "confirmed", isSubstitute: true, joinedAt: "2025-04-12T08:00:00Z" },

  { id: "tm006", teamId: "t002", userId: "u001", position: "first", status: "confirmed", isSubstitute: false, joinedAt: "2025-04-12T10:00:00Z" },
  { id: "tm007", teamId: "t002", userId: "u005", position: "second", status: "confirmed", isSubstitute: false, joinedAt: "2025-04-12T11:00:00Z" },
  { id: "tm008", teamId: "t002", userId: "u002", position: "third", status: "confirmed", isSubstitute: false, joinedAt: "2025-04-12T12:00:00Z" },
  { id: "tm009", teamId: "t002", userId: "u004", position: "fourth", status: "confirmed", isSubstitute: false, joinedAt: "2025-04-12T13:00:00Z" },

  { id: "tm010", teamId: "t003", userId: "u005", position: "first", status: "confirmed", isSubstitute: false, joinedAt: "2025-06-10T14:00:00Z" },
  { id: "tm011", teamId: "t003", userId: "u001", position: null, status: "invited", isSubstitute: false, joinedAt: "2025-06-12T10:00:00Z" },

  { id: "tm012", teamId: "t004", userId: "u004", position: "first", status: "confirmed", isSubstitute: false, joinedAt: "2025-04-08T09:00:00Z" },
  { id: "tm013", teamId: "t004", userId: "u002", position: "second", status: "confirmed", isSubstitute: false, joinedAt: "2025-04-08T10:00:00Z" },
  { id: "tm014", teamId: "t004", userId: "u001", position: "third", status: "confirmed", isSubstitute: false, joinedAt: "2025-04-08T11:00:00Z" },
  { id: "tm015", teamId: "t004", userId: "u005", position: "fourth", status: "confirmed", isSubstitute: false, joinedAt: "2025-04-08T12:00:00Z" },

  { id: "tm016", teamId: "t005", userId: "u002", position: "first", status: "confirmed", isSubstitute: false, joinedAt: "2025-06-13T16:00:00Z" },
  { id: "tm017", teamId: "t005", userId: "u001", position: null, status: "invited", isSubstitute: false, joinedAt: "2025-06-14T09:00:00Z" },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, teamId: "t001", teamName: "逻辑风暴", teamAvatar: "https://api.dicebear.com/7.x/shapes/svg?seed=logic", points: 18, wins: 6, losses: 0, draws: 0, goalDifference: 58, trend: "same" },
  { rank: 2, teamId: "t004", teamName: "攻无不克", teamAvatar: "https://api.dicebear.com/7.x/shapes/svg?seed=attack", points: 15, wins: 5, losses: 1, draws: 0, goalDifference: 42, trend: "up" },
  { rank: 3, teamId: "t002", teamName: "思辩之光", teamAvatar: "https://api.dicebear.com/7.x/shapes/svg?seed=light", points: 12, wins: 4, losses: 2, draws: 0, goalDifference: 25, trend: "up" },
  { rank: 4, teamId: "t006", teamName: "历史强队", teamAvatar: "https://api.dicebear.com/7.x/shapes/svg?seed=history", points: 9, wins: 3, losses: 3, draws: 0, goalDifference: 12, trend: "down" },
  { rank: 5, teamId: "t003", teamName: "新生先锋队", teamAvatar: "https://api.dicebear.com/7.x/shapes/svg?seed=newbie", points: 3, wins: 1, losses: 5, draws: 0, goalDifference: -28, trend: "same" },
  { rank: 6, teamId: "t005", teamName: "精英联盟", teamAvatar: "https://api.dicebear.com/7.x/shapes/svg?seed=elite", points: 0, wins: 0, losses: 0, draws: 0, goalDifference: 0, trend: "same" },
];
