import type { DebatePosition, MatchStatus, RegistrationStatus, TeamStatus, JudgingStatus, ScoreCategory } from "../types";

export const positionLabels: Record<DebatePosition, string> = {
  first: "一辩",
  second: "二辩",
  third: "三辩",
  fourth: "四辩",
};

export const matchStatusLabels: Record<MatchStatus, { label: string; className: string }> = {
  registration: { label: "报名中", className: "bg-green-100 text-green-700" },
  pending: { label: "待开赛", className: "bg-blue-100 text-blue-700" },
  ongoing: { label: "进行中", className: "bg-amber-100 text-amber-700" },
  finished: { label: "已结束", className: "bg-gray-100 text-gray-700" },
  cancelled: { label: "已取消", className: "bg-red-100 text-red-700" },
};

export const registrationStatusLabels: Record<RegistrationStatus, { label: string; className: string }> = {
  pending: { label: "待审核", className: "bg-amber-100 text-amber-700" },
  approved: { label: "已通过", className: "bg-green-100 text-green-700" },
  rejected: { label: "已拒绝", className: "bg-red-100 text-red-700" },
};

export const teamStatusLabels: Record<TeamStatus, { label: string; className: string }> = {
  recruiting: { label: "招募中", className: "bg-green-100 text-green-700" },
  full: { label: "已满员", className: "bg-blue-100 text-blue-700" },
  confirmed: { label: "已确认", className: "bg-primary-100 text-primary-700" },
  archived: { label: "已归档", className: "bg-gray-100 text-gray-500" },
};

export const judgingStatusLabels: Record<JudgingStatus, { label: string; className: string }> = {
  pending: { label: "待评审", className: "bg-amber-100 text-amber-700" },
  in_progress: { label: "评审中", className: "bg-blue-100 text-blue-700" },
  completed: { label: "已完成", className: "bg-green-100 text-green-700" },
};

export const scoreCategoryLabels: Record<ScoreCategory, { label: string; weight: number }> = {
  opening_statement: { label: "立论陈词", weight: 0.3 },
  cross_examination: { label: "攻辩环节", weight: 0.25 },
  free_debate: { label: "自由辩论", weight: 0.25 },
  closing_statement: { label: "总结陈词", weight: 0.2 },
  team_cooperation: { label: "团队配合", weight: 0 },
  overall_impression: { label: "整体印象", weight: 0 },
};

export const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export const dayPeriods = [
  { label: "第1-2节", value: [1, 2], time: "08:00-09:40" },
  { label: "第3-4节", value: [3, 4], time: "10:00-11:40" },
  { label: "第5-6节", value: [5, 6], time: "14:00-15:40" },
  { label: "第7-8节", value: [7, 8], time: "16:00-17:40" },
  { label: "晚间", value: [9, 10], time: "19:00-21:00" },
];

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return `${formatDate(dateStr)} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return formatDate(dateStr);
}

export function generateId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
