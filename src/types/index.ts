export type UserRole = "student" | "judge" | "admin";

export type DebatePosition = "first" | "second" | "third" | "fourth";

export type TeamStatus = "recruiting" | "full" | "confirmed" | "archived";

export type MatchStatus = "registration" | "pending" | "ongoing" | "finished" | "cancelled";

export type RegistrationStatus = "pending" | "approved" | "rejected";

export type JudgingStatus = "pending" | "in_progress" | "completed";

export type ResourceType = "topic" | "template" | "video" | "speech";

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  grade: string;
  major: string;
  phone: string;
  email: string;
  bio: string;
  preferredPositions: DebatePosition[];
  debateStyles: string[];
  availableSlots: AvailableSlot[];
  bestSpeakerCount: number;
  winCount: number;
  matchCount: number;
  badges: string[];
}

export interface AvailableSlot {
  day: number;
  periods: number[];
}

export interface Team {
  id: string;
  name: string;
  season: string;
  status: TeamStatus;
  captainId: string;
  description: string;
  createdAt: string;
  archived: boolean;
  avatar?: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  position: DebatePosition | null;
  status: "invited" | "applied" | "confirmed" | "rejected";
  isSubstitute: boolean;
  joinedAt: string;
}

export interface Match {
  id: string;
  title: string;
  topic: string;
  proDescription: string;
  conDescription: string;
  date: string;
  time: string;
  venue: string;
  season: string;
  round: string;
  format: string;
  gradeLimit: string;
  status: MatchStatus;
  result?: MatchResult;
  maxTeams: number;
  registeredCount: number;
}

export interface MatchResult {
  winner: "pro" | "con" | "tie";
  proScore: number;
  conScore: number;
  bestSpeakerId: string;
  summary: string;
}

export interface MatchRegistration {
  id: string;
  matchId: string;
  userId: string;
  teamId?: string;
  status: RegistrationStatus;
  registeredAt: string;
  reviewedAt?: string;
  rejectReason?: string;
  notes?: string;
}

export interface MatchParticipant {
  id: string;
  matchId: string;
  teamId: string;
  side: "pro" | "con";
  speakers: { position: DebatePosition; userId: string }[];
}

export interface JudgingTask {
  id: string;
  matchId: string;
  judgeId: string;
  status: JudgingStatus;
  scores: Score[];
  comment: string;
  bestSpeakerId?: string;
  submittedAt?: string;
}

export interface Score {
  id: string;
  taskId: string;
  teamId: string;
  speakerId?: string;
  category: ScoreCategory;
  score: number;
  note?: string;
}

export type ScoreCategory =
  | "opening_statement"
  | "cross_examination"
  | "free_debate"
  | "closing_statement"
  | "team_cooperation"
  | "overall_impression";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  matchId?: string;
  pinned: boolean;
  commentsCount: number;
}

export interface Comment {
  id: string;
  announcementId: string;
  userId: string;
  content: string;
  createdAt: string;
  parentId?: string;
}

export interface SpeechClip {
  id: string;
  title: string;
  matchId?: string;
  matchTitle?: string;
  userId: string;
  userName: string;
  content: string;
  videoUrl?: string;
  thumbnail?: string;
  likes: number;
  likedByMe: boolean;
  commentsCount: number;
  createdAt: string;
  tags: string[];
}

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  description: string;
  category: string;
  content: string;
  author: string;
  authorAvatar?: string;
  views: number;
  downloads: number;
  createdAt: string;
  tags: string[];
  favorite: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  teamAvatar?: string;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  goalDifference: number;
  trend: "up" | "down" | "same";
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  type: "match" | "training" | "meeting";
  status: MatchStatus | "scheduled";
}

export interface BracketMatch {
  id: string;
  round: string;
  proTeamId: string | null;
  conTeamId: string | null;
  venue: string;
  date: string;
  time: string;
  proScore?: number;
  conScore?: number;
  winner?: "pro" | "con" | null;
}
