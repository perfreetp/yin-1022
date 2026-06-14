import { useState } from "react";
import {
  User as UserIcon,
  Mail,
  Phone,
  GraduationCap,
  Award,
  Edit3,
  Save,
  X,
  Trophy,
  Medal,
  Target,
  CalendarDays,
  Star,
  Crown,
  Ticket,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Swords,
  ClipboardList,
  FileText,
  Shield,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Quote,
  Check,
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { useUserStore } from "../store/useUserStore";
import { useMatchStore } from "../store/useMatchStore";
import { useTeamStore } from "../store/useTeamStore";
import { positionLabels, weekDays, dayPeriods, formatDate, formatDateTime } from "../utils";
import type { DebatePosition, User, MatchRegistration, Match } from "../types";

type TabType = "profile" | "ability" | "registrations" | "history";

export default function Members() {
  const currentUser = useUserStore((s) => s.getCurrentUser());
  const updateUser = useUserStore((s) => s.updateUser);
  const matches = useMatchStore((s) => s.matches);
  const participants = useMatchStore((s) => s.participants);
  const registrations = useMatchStore((s) => s.registrations);
  const getMatchesByUser = useMatchStore((s) => s.getMatchesByUser);
  const getTeamById = useTeamStore((s) => s.getTeamById);
  const teams = useTeamStore((s) => s.teams);
  const users = useUserStore((s) => s.users);

  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>(currentUser || {});
  const [showSeasonResult, setShowSeasonResult] = useState(false);

  if (!currentUser) return null;

  const handleSave = () => {
    updateUser(currentUser.id, editData);
    setIsEditing(false);
  };

  const togglePosition = (pos: DebatePosition) => {
    const current = editData.preferredPositions || [];
    const updated = current.includes(pos)
      ? current.filter((p) => p !== pos)
      : [...current, pos];
    setEditData({ ...editData, preferredPositions: updated });
  };

  const toggleSlot = (day: number, period: number) => {
    const current = editData.availableSlots || [];
    const dayIndex = current.findIndex((s) => s.day === day);
    if (dayIndex >= 0) {
      const daySlots = [...current];
      const periods = daySlots[dayIndex].periods.includes(period)
        ? daySlots[dayIndex].periods.filter((p) => p !== period)
        : [...daySlots[dayIndex].periods, period];
      if (periods.length === 0) {
        daySlots.splice(dayIndex, 1);
      } else {
        daySlots[dayIndex] = { ...daySlots[dayIndex], periods };
      }
      setEditData({ ...editData, availableSlots: daySlots });
    } else {
      setEditData({
        ...editData,
        availableSlots: [...current, { day, periods: [period] }],
      });
    }
  };

  const isSlotAvailable = (day: number, period: number) => {
    const slots = isEditing ? editData.availableSlots : currentUser.availableSlots;
    return slots?.some((s) => s.day === day && s.periods.includes(period));
  };

  const tabs = [
    { id: "profile" as TabType, label: "个人资料", icon: UserIcon },
    { id: "ability" as TabType, label: "辩论能力", icon: Target },
    { id: "registrations" as TabType, label: "我的参赛", icon: Ticket },
    { id: "history" as TabType, label: "历史战绩", icon: Trophy },
  ];

  // 我的报名记录 + 真实参赛场次
  const myRegistrations = currentUser
    ? registrations.filter((r) => r.userId === currentUser.id)
    : [];

  const getRegStatusInfo = (status: MatchRegistration["status"]) => {
    switch (status) {
      case "pending":
        return { label: "待审核", variant: "warning" as const, icon: Clock };
      case "approved":
        return { label: "已通过", variant: "success" as const, icon: CheckCircle2 };
      case "rejected":
        return { label: "未通过", variant: "danger" as const, icon: XCircle };
    }
  };

  const userMatches = currentUser ? getMatchesByUser(currentUser.id) : [];
  const finishedMatches = userMatches.filter(
    (m) => m.status === "finished" && m.result
  );

  const getUserSideInMatch = (matchId: string, userId: string): "pro" | "con" | null => {
    const participant = participants.find(
      (p) => p.matchId === matchId && p.speakers.some((s) => s.userId === userId)
    );
    return participant ? participant.side : null;
  };

  const isWinner = (match: (typeof finishedMatches)[number], userId: string): boolean | null => {
    if (!match.result) return null;
    const side = getUserSideInMatch(match.id, userId);
    if (!side) return null;
    return match.result.winner === side;
  };

  // 基于真实参赛记录计算统计
  const realMatchCount = finishedMatches.length;
  const realWinCount = finishedMatches.reduce((acc, m) => {
    const won = isWinner(m, currentUser.id);
    return acc + (won === true ? 1 : 0);
  }, 0);
  const realBestSpeakerCount = finishedMatches.filter(
    (m) => m.result?.bestSpeakerId === currentUser.id
  ).length;
  const realWinRate =
    realMatchCount > 0 ? Math.round((realWinCount / realMatchCount) * 100) : 0;

  const finalMatch = matches.find((m) => m.id === "m004");
  const semiMatches = matches.filter((m) => m.id === "m001" || m.id === "m002");
  const hasSeasonResult = Boolean(finalMatch?.result);

  const seasonData = (() => {
    if (!finalMatch?.result) return null;
    const winner = finalMatch.result.winner;
    const championTeamId = winner === "pro" ? finalMatch.proTeamId : finalMatch.conTeamId;
    const runnerUpTeamId = winner === "pro" ? finalMatch.conTeamId : finalMatch.proTeamId;
    const champion = teams.find((t) => t.id === championTeamId);
    const runnerUp = teams.find((t) => t.id === runnerUpTeamId);
    const bestSpeaker = users.find((u) => u.id === finalMatch.result!.bestSpeakerId);

    const matchList = [...semiMatches, finalMatch].filter(Boolean) as Match[];

    const summaries: string[] = [];
    if (finalMatch.result.summary) summaries.push(finalMatch.result.summary);
    semiMatches.forEach((m) => m.result?.summary && summaries.push(m.result.summary));
    const overallSummary =
      summaries.length > 0
        ? summaries.join(" ")
        : "感谢所有参赛队伍、评委和工作人员的精彩呈现！";

    return {
      champion,
      runnerUp,
      bestSpeaker,
      matchList,
      overallSummary,
      finalMatch,
    };
  })();

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="overflow-hidden opacity-0 animate-fade-in-up">
        <div className="relative h-32 md:h-40 bg-gradient-to-r from-primary-700 via-primary-600 to-primary-800">
          <div className="absolute inset-0 bg-grain-overlay opacity-30" />
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-accent-500/20 blur-2xl" />
        </div>
        <div className="px-6 md:px-8 pb-6 -mt-14 md:-mt-16 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border-4 border-white bg-white shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center shadow-md">
                <Crown className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-800">
                    {currentUser.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge
                      variant={
                        currentUser.role === "admin"
                          ? "accent"
                          : currentUser.role === "judge"
                          ? "primary"
                          : "default"
                      }
                    >
                      {currentUser.role === "admin"
                        ? "社团干部"
                        : currentUser.role === "judge"
                        ? "评委"
                        : "参赛学生"}
                    </Badge>
                    <span className="text-sm text-ink-500 flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      {currentUser.grade} · {currentUser.major}
                    </span>
                  </div>
                </div>
                {!isEditing ? (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit3 className="w-4 h-4 mr-1.5" />
                    编辑资料
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave}>
                      <Save className="w-4 h-4 mr-1.5" />
                      保存
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditData(currentUser);
                        setIsEditing(false);
                      }}
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      取消
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-6 pt-6 border-t border-cream-200">
            {[
              { label: "参赛场次", value: realMatchCount, icon: Trophy, color: "text-primary-600 bg-primary-50" },
              { label: "胜利场次", value: realWinCount, icon: Medal, color: "text-success bg-green-50" },
              { label: "最佳辩手", value: realBestSpeakerCount, icon: Star, color: "text-amber-600 bg-amber-50" },
              { label: "胜率", value: `${realWinRate}%`, icon: Target, color: "text-victory bg-red-50" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center p-3 md:p-4 rounded-xl bg-cream-50"
              >
                <div
                  className={`w-10 h-10 mx-auto rounded-xl ${stat.color} flex items-center justify-center mb-2`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="font-serif text-xl md:text-2xl font-bold text-ink-800">
                  {stat.value}
                </p>
                <p className="text-xs text-ink-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {hasSeasonResult && seasonData && (
        <Card className="p-0 overflow-hidden opacity-0 animate-fade-in-up animate-delay-100 !bg-gradient-to-br !from-amber-50 via-white !to-primary-500/5 !border-amber-200/70">
          <button
            onClick={() => setShowSeasonResult(true)}
            className="w-full text-left p-4 md:p-5 flex flex-col sm:flex-row items-center gap-4 transition-all hover:bg-white/40"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="accent" className="!bg-amber-500 !text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  2025春季赛结果已出炉
                </Badge>
              </div>
              <p className="font-serif font-semibold text-ink-800 text-sm">
                {seasonData.champion?.name || "冠军队"}夺冠
                {seasonData.bestSpeaker && seasonData.bestSpeaker.id === currentUser.id && (
                  <span className="text-accent-600 ml-2 flex items-center gap-1 inline-flex">
                    <Award className="w-3.5 h-3.5" />
                    你获得最佳辩手！
                  </span>
                )}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-ink-400 flex-shrink-0" />
          </button>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-cream-300 shadow-card w-fit opacity-0 animate-fade-in-up animate-delay-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-primary-600 text-white shadow-sm"
                : "text-ink-600 hover:bg-cream-100"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <div className="grid md:grid-cols-2 gap-6 opacity-0 animate-fade-in">
          <Card className="p-6">
            <h2 className="font-serif text-lg font-bold text-ink-800 mb-4">
              基本信息
            </h2>
            <div className="space-y-4">
              {[
                { label: "姓名", key: "name", icon: UserIcon, type: "text" },
                { label: "年级", key: "grade", icon: GraduationCap, type: "text" },
                { label: "专业", key: "major", icon: GraduationCap, type: "text" },
                { label: "邮箱", key: "email", icon: Mail, type: "email" },
                { label: "电话", key: "phone", icon: Phone, type: "tel" },
              ].map((field) => (
                <div key={field.key} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <field.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs text-ink-400 block mb-1">
                      {field.label}
                    </label>
                    {isEditing ? (
                      <input
                        type={field.type}
                        value={(editData as any)[field.key] || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, [field.key]: e.target.value })
                        }
                        className="input"
                      />
                    ) : (
                      <p className="text-sm font-medium text-ink-700">
                        {(currentUser as any)[field.key]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-serif text-lg font-bold text-ink-800 mb-4">
              个人简介
            </h2>
            {isEditing ? (
              <textarea
                value={editData.bio || ""}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                rows={6}
                className="input resize-none"
                placeholder="介绍一下你自己..."
              />
            ) : (
              <p className="text-sm text-ink-600 leading-relaxed">
                {currentUser.bio || "还没有个人简介，点击编辑来介绍一下自己吧~"}
              </p>
            )}

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-ink-700 mb-3">荣誉徽章</h3>
              <div className="flex flex-wrap gap-2">
                {currentUser.badges.length > 0 ? (
                  currentUser.badges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-accent-100 to-accent-50 text-accent-700 text-xs font-medium border border-accent-200"
                    >
                      <Award className="w-3 h-3" />
                      {badge}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-ink-400">暂无徽章，加油获得更多荣誉吧！</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "ability" && (
        <div className="space-y-6 opacity-0 animate-fade-in">
          <Card className="p-6">
            <h2 className="font-serif text-lg font-bold text-ink-800 mb-2">
              擅长立场
            </h2>
            <p className="text-sm text-ink-400 mb-4">
              选择你擅长或希望担任的辩位（可多选）
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(Object.keys(positionLabels) as DebatePosition[]).map((pos) => {
                const selected = isEditing
                  ? editData.preferredPositions?.includes(pos)
                  : currentUser.preferredPositions.includes(pos);
                return (
                  <button
                    key={pos}
                    onClick={() => isEditing && togglePosition(pos)}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      selected
                        ? "border-primary-500 bg-primary-50 shadow-md"
                        : "border-cream-200 bg-white hover:border-cream-300"
                    } ${!isEditing && "cursor-default"}`}
                  >
                    <div
                      className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 ${
                        selected ? "bg-primary-600 text-white" : "bg-cream-100 text-ink-400"
                      }`}
                    >
                      <span className="font-serif font-bold text-lg">
                        {positionLabels[pos][0]}
                      </span>
                    </div>
                    <p
                      className={`text-center font-semibold ${
                        selected ? "text-primary-700" : "text-ink-600"
                      }`}
                    >
                      {positionLabels[pos]}
                    </p>
                    <p className="text-xs text-ink-400 mt-1 text-center">
                      {pos === "first" && "开篇立论"}
                      {pos === "second" && "攻辩+小结"}
                      {pos === "third" && "攻辩+自由辩"}
                      {pos === "fourth" && "总结陈词"}
                    </p>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-serif text-lg font-bold text-ink-800 mb-2">
              可参赛时段
            </h2>
            <p className="text-sm text-ink-400 mb-4">
              {isEditing ? "点击方格设置你可以参加比赛的时段" : "绿色表示你当前标记的可参赛时段"}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-xs font-medium text-ink-400 w-24">
                      时段
                    </th>
                    {weekDays.map((day) => (
                      <th
                        key={day}
                        className="p-2 text-center text-xs font-medium text-ink-400 min-w-[80px]"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dayPeriods.map((period) => (
                    <tr key={period.label} className="border-t border-cream-200">
                      <td className="p-2">
                        <p className="text-xs font-medium text-ink-600">{period.label}</p>
                        <p className="text-[10px] text-ink-400">{period.time}</p>
                      </td>
                      {weekDays.map((_, dayIdx) => {
                        const available = isSlotAvailable(dayIdx, period.value[0]);
                        return (
                          <td key={dayIdx} className="p-1.5">
                            <button
                              onClick={() => isEditing && toggleSlot(dayIdx, period.value[0])}
                              className={`w-full h-10 rounded-lg transition-all ${
                                available
                                  ? "bg-success/20 border-2 border-success hover:bg-success/30"
                                  : "bg-cream-100 border-2 border-transparent hover:bg-cream-200"
                              } ${!isEditing && "cursor-default"}`}
                            >
                              {available && (
                                <CalendarDays className="w-4 h-4 mx-auto text-success" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-serif text-lg font-bold text-ink-800 mb-4">
              辩论风格标签
            </h2>
            <div className="flex flex-wrap gap-2">
              {["逻辑流", "价值流", "数据流", "政策流", "情感流", "文学流", "攻击流", "防守流"].map(
                (style) => {
                  const hasStyle = currentUser.debateStyles.includes(style);
                  return (
                    <span
                      key={style}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                        hasStyle
                          ? "bg-primary-600 text-white shadow-md"
                          : "bg-cream-100 text-ink-500 hover:bg-cream-200"
                      }`}
                    >
                      {style}
                    </span>
                  );
                }
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "registrations" && (
        <div className="space-y-6 opacity-0 animate-fade-in">
          <Card className="p-6">
            <h2 className="font-serif text-lg font-bold text-ink-800 mb-4">
              我的参赛卡
            </h2>
            <p className="text-sm text-ink-500 mb-5">
              查看你报名的所有比赛，包括报名状态、比赛信息、审核进度和拒绝原因。
            </p>
            {myRegistrations.length > 0 ? (
              <div className="space-y-4">
                {myRegistrations.map((reg) => {
                  const match = matches.find((m) => m.id === reg.matchId);
                  const team = reg.teamId ? getTeamById(reg.teamId) : undefined;
                  const statusInfo = getRegStatusInfo(reg.status);
                  if (!match) return null;
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div
                      key={reg.id}
                      className={`rounded-xl border overflow-hidden ${
                        reg.status === "rejected"
                          ? "border-red-200"
                          : reg.status === "approved"
                          ? "border-green-200"
                          : "border-amber-200"
                      }`}
                    >
                      {/* 头部色带 */}
                      <div
                        className={`h-2 ${
                          reg.status === "rejected"
                            ? "bg-gradient-to-r from-red-400 to-red-500"
                            : reg.status === "approved"
                            ? "bg-gradient-to-r from-green-400 to-green-500"
                            : "bg-gradient-to-r from-amber-400 to-amber-500"
                        }`}
                      />
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h3 className="font-serif font-semibold text-ink-800">
                                {match.title}
                              </h3>
                              <Badge variant={statusInfo.variant}>
                                <StatusIcon className="w-3 h-3 mr-1 inline" />
                                {statusInfo.label}
                              </Badge>
                              <Badge variant="default">{match.season}</Badge>
                            </div>
                            <p className="text-sm text-ink-600 line-clamp-1">
                              <Ticket className="w-3.5 h-3.5 inline mr-1 text-accent-600" />
                              {match.topic}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-md">
                            <Ticket className="w-6 h-6 text-white" />
                          </div>
                        </div>

                        {/* 比赛信息 */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                          <div className="p-3 rounded-lg bg-cream-50 border border-cream-200">
                            <p className="text-[11px] text-ink-400 mb-1 flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              比赛时间
                            </p>
                            <p className="text-sm font-medium text-ink-800">
                              {formatDate(match.date)}
                            </p>
                            <p className="text-xs text-ink-500">{match.time}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-cream-50 border border-cream-200">
                            <p className="text-[11px] text-ink-400 mb-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              比赛地点
                            </p>
                            <p className="text-sm font-medium text-ink-800">
                              {match.venue}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-cream-50 border border-cream-200">
                            <p className="text-[11px] text-ink-400 mb-1 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              所属队伍
                            </p>
                            <p className="text-sm font-medium text-ink-800">
                              {team?.name || "个人报名"}
                            </p>
                          </div>
                        </div>

                        {reg.status === "approved" && (() => {
                          const participant = participants.find(
                            (p) => p.matchId === reg.matchId && p.teamId === reg.teamId
                          );
                          const mySpeaker = participant?.speakers.find(
                            (s) => s.userId === currentUser?.id
                          );
                          const sideLabel =
                            match.proTeamId === reg.teamId
                              ? "正方"
                              : match.conTeamId === reg.teamId
                              ? "反方"
                              : participant?.side === "pro"
                              ? "正方"
                              : participant?.side === "con"
                              ? "反方"
                              : "待定";
                          const sideBadge =
                            sideLabel === "正方" ? "success" : sideLabel === "反方" ? "primary" : "default";
                          return (
                            <div className="space-y-3 mb-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl border-2 border-victory/20 bg-victory/5">
                                  <p className="text-[11px] text-ink-400 mb-1.5 flex items-center gap-1">
                                    <Swords className="w-3 h-3" />
                                    持方安排
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={sideBadge as any}>
                                      <Shield className="w-3 h-3 mr-1 inline" />
                                      {sideLabel}
                                    </Badge>
                                    {mySpeaker && (
                                      <Badge variant="accent">
                                        {positionLabels[mySpeaker.position] || "待安排"}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="p-3 rounded-xl border-2 border-primary-500/20 bg-primary-500/5">
                                  <p className="text-[11px] text-ink-400 mb-1.5 flex items-center gap-1">
                                    <ClipboardList className="w-3 h-3" />
                                    赛前待办
                                  </p>
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                                      <span className="text-ink-700">
                                        赛前 30 分钟到场签到
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                                      <span className="text-ink-700">
                                        提交立论稿/论据清单
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                                      <span className="text-ink-700">
                                        统一队服，提前熟悉规则
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 审核记录 */}
                        <div className="border-t border-cream-200 pt-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                              </div>
                              <span className="text-ink-600">
                                提交报名
                                <span className="text-ink-400 ml-2">
                                  {formatDateTime(reg.registeredAt)}
                                </span>
                              </span>
                            </div>
                            {reg.status !== "pending" && (
                              <div className="flex items-center gap-2 text-xs">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    reg.status === "approved"
                                      ? "bg-green-100"
                                      : "bg-red-100"
                                  }`}
                                >
                                  {reg.status === "approved" ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5 text-red-600" />
                                  )}
                                </div>
                                <span className="text-ink-600">
                                  {reg.status === "approved" ? "审核通过" : "审核未通过"}
                                  {reg.reviewedAt && (
                                    <span className="text-ink-400 ml-2">
                                      {formatDateTime(reg.reviewedAt)}
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                            {reg.status === "pending" && (
                              <div className="flex items-center gap-2 text-xs">
                                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                                </div>
                                <span className="text-ink-600">
                                  等待管理员审核中...
                                </span>
                              </div>
                            )}
                          </div>

                          {/* 拒绝原因 */}
                          {reg.status === "rejected" && reg.rejectReason && (
                            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-red-700 mb-1">
                                  拒绝原因
                                </p>
                                <p className="text-sm text-red-800 leading-relaxed">
                                  {reg.rejectReason}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Ticket className="w-16 h-16 mx-auto text-ink-200 mb-4" />
                <p className="text-ink-400">还没有报名记录</p>
                <p className="text-sm text-ink-300 mt-1">
                  去赛程页看看有哪些可以报名的比赛吧~
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-6 opacity-0 animate-fade-in">
          <Card className="p-6">
            <h2 className="font-serif text-lg font-bold text-ink-800 mb-4">
              比赛记录
            </h2>
            {finishedMatches.length > 0 ? (
              <div className="space-y-3">
                {finishedMatches.map((match) => {
                  const userSide = getUserSideInMatch(match.id, currentUser.id);
                  const won = isWinner(match, currentUser.id);
                  const sideLabel = userSide === "pro" ? "正方" : userSide === "con" ? "反方" : "参与";
                  const sideDesc = userSide === "pro" ? match.proDescription : userSide === "con" ? match.conDescription : "";
                  return (
                    <div
                      key={match.id}
                      className="p-4 rounded-xl bg-cream-50 border border-cream-200 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-serif font-semibold text-ink-800">
                            {match.title}
                          </h3>
                          <Badge variant={userSide === "pro" ? "primary" : "default"}>
                            {sideLabel}
                          </Badge>
                        </div>
                        {sideDesc && (
                          <p className="text-xs text-ink-500 mt-1 truncate">
                            {sideDesc}
                          </p>
                        )}
                        <p className="text-sm text-ink-500 mt-1">
                          {formatDate(match.date)} · {match.venue}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="font-mono font-bold text-lg text-ink-800">
                            {match.result?.proScore} : {match.result?.conScore}
                          </p>
                          {won === true ? (
                            <p className="text-xs text-success font-medium">获胜</p>
                          ) : won === false ? (
                            <p className="text-xs text-defeat font-medium">惜败</p>
                          ) : (
                            <p className="text-xs text-ink-400 font-medium">参与</p>
                          )}
                        </div>
                        {match.result?.bestSpeakerId === currentUser.id && (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                            <Star className="w-5 h-5 text-white fill-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto text-ink-200 mb-4" />
                <p className="text-ink-400">暂无比赛记录</p>
                <p className="text-sm text-ink-300 mt-1">
                  快去报名参加比赛吧！
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {showSeasonResult && seasonData && (
        <Modal
          open={showSeasonResult}
          onClose={() => setShowSeasonResult(false)}
          title="2025春季辩论赛 · 赛季总结"
          className="!max-w-4xl"
        >
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl p-8 md:p-10 text-center bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white">
              <div className="absolute inset-0 bg-grain-overlay opacity-30" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  2025春季赛 · 圆满落幕
                </div>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Crown className="w-10 h-10" />
                </div>
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2">
                  {seasonData.champion?.name || "冠军队伍"}
                </h2>
                <p className="text-white/90">
                  {seasonData.champion?.description || "恭喜获得冠军！"}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-100 to-white border-2 border-gray-200 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-500">2</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">亚军</p>
                <p className="font-serif font-bold text-lg text-ink-800">
                  {seasonData.runnerUp?.name || "亚军队"}
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-white border-2 border-amber-300 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-amber-100 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-xs text-amber-600 mb-1">冠军</p>
                <p className="font-serif font-bold text-lg text-ink-800">
                  {seasonData.champion?.name || "冠军队"}
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-accent-50 to-white border-2 border-accent-300 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-accent-100 flex items-center justify-center">
                  <Award className="w-6 h-6 text-accent-600" />
                </div>
                <p className="text-xs text-accent-600 mb-1">全程最佳辩手</p>
                <p className="font-serif font-bold text-lg text-ink-800">
                  {seasonData.bestSpeaker?.name || "待定"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-serif font-bold text-lg text-ink-800 mb-3 flex items-center gap-2">
                <Swords className="w-5 h-5 text-primary-600" />
                淘汰赛赛程与比分
              </h3>
              <div className="space-y-2">
                {seasonData.matchList.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl border border-cream-200 bg-cream-50 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={m.round === "决赛" ? "accent" : "primary"}>
                          {m.round}
                        </Badge>
                        <span className="text-xs text-ink-400">
                          {formatDate(m.date)} · {m.venue}
                        </span>
                      </div>
                      <p className="text-sm text-ink-600 line-clamp-1">{m.title}</p>
                    </div>
                    {m.result ? (
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-center">
                          <p className="text-[10px] text-ink-400">正方</p>
                          <p
                            className={`font-mono font-bold text-xl ${
                              m.result.winner === "pro" ? "text-victory" : "text-ink-600"
                            }`}
                          >
                            {m.result.proScore}
                          </p>
                        </div>
                        <div className="text-ink-300 font-mono">VS</div>
                        <div className="text-center">
                          <p className="text-[10px] text-ink-400">反方</p>
                          <p
                            className={`font-mono font-bold text-xl ${
                              m.result.winner === "con" ? "text-primary-700" : "text-ink-600"
                            }`}
                          >
                            {m.result.conScore}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Badge variant="default">待进行</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-500/5 via-white to-primary-500/5 border border-primary-300/50">
              <p className="text-xs text-primary-700 font-semibold mb-2 flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5" />
                赛后总结
              </p>
              <p className="text-sm text-ink-700 leading-relaxed">
                {seasonData.overallSummary}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={() => setShowSeasonResult(false)}>
                <Check className="w-4 h-4 mr-1.5" />
                太棒了！
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
