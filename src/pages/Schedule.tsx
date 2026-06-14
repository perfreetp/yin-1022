import { useState } from "react";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Check,
  X,
  Shuffle,
  Trophy,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  QrCode,
  UserCheck,
  Filter,
  BarChart3,
  Swords,
  AlertCircle,
  UserPlus,
  Loader2,
  Map as MapIcon,
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { useMatchStore, ValidationResult } from "../store/useMatchStore";
import { useTeamStore } from "../store/useTeamStore";
import { useUserStore } from "../store/useUserStore";
import {
  matchStatusLabels,
  registrationStatusLabels,
  formatDate,
  weekDays,
  cn,
  generateId,
} from "../utils";
import type { Match, BracketMatch, Team } from "../types";

type ViewType = "list" | "calendar" | "registration" | "draw";

export default function Schedule() {
  const matches = useMatchStore((s) => s.matches);
  const registrations = useMatchStore((s) => s.registrations);
  const approveRegistration = useMatchStore((s) => s.approveRegistration);
  const rejectRegistration = useMatchStore((s) => s.rejectRegistration);
  const registerMatch = useMatchStore((s) => s.registerMatch);
  const checkTimeConflict = useMatchStore((s) => s.checkTimeConflict);
  const leaderboard = useTeamStore((s) => s.leaderboard);
  const teams = useTeamStore((s) => s.teams);
  const teamMembers = useTeamStore((s) => s.teamMembers);
  const brackets = useTeamStore((s) => s.brackets);
  const setBrackets = useTeamStore((s) => s.setBrackets);
  const updateBracket = useTeamStore((s) => s.updateBracket);
  const users = useUserStore((s) => s.users);
  const currentUserId = useUserStore((s) => s.currentUserId);
  const currentUser = users.find((u) => u.id === currentUserId);

  const [view, setView] = useState<ViewType>("list");
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 5, 1));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());

  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // 报名弹窗
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerMatchId, setRegisterMatchId] = useState<string | null>(null);
  const [registerTeamId, setRegisterTeamId] = useState<string>("");
  const [registerLoading, setRegisterLoading] = useState(false);

  // 拒绝报名弹窗
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectRegId, setRejectRegId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // 录入比分弹窗
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreBracketId, setScoreBracketId] = useState<string | null>(null);
  const [scorePro, setScorePro] = useState<string>("");
  const [scoreCon, setScoreCon] = useState<string>("");

  // 抽签状态
  const [drawLoading, setDrawLoading] = useState(false);
  const [drawSeed, setDrawSeed] = useState<string>("2025春季赛半决赛");

  // 我的队伍（用于报名选择）
  const myTeams = teams.filter((t) => {
    if (t.archived) return false;
    return teamMembers.some(
      (m) => m.teamId === t.id && m.userId === currentUserId && m.status === "confirmed"
    );
  });

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3200);
  };

  const views = [
    { id: "list" as ViewType, label: "比赛列表", icon: Swords },
    { id: "calendar" as ViewType, label: "日历视图", icon: Calendar },
    { id: "registration" as ViewType, label: "报名管理", icon: Users },
    { id: "draw" as ViewType, label: "抽签编排", icon: Shuffle },
  ];

  const filteredMatches = matches.filter((m) => {
    if (searchQuery) {
      return (
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.topic.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const getMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getMatchesForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return matches.filter((m) => m.date === dateStr);
  };

  const handleCheckIn = (matchId: string) => {
    setCheckedIn((prev) => new Set([...prev, matchId]));
    showToast("success", "签到成功！");
  };

  const pendingRegistrations = registrations.filter(
    (r) => r.status === "pending"
  );

  // 处理报名
  const openRegister = (matchId: string) => {
    setRegisterMatchId(matchId);
    setRegisterTeamId(myTeams[0]?.id || "");
    setShowRegisterModal(true);
  };

  const handleRegister = () => {
    if (!registerMatchId || !currentUser) return;
    setRegisterLoading(true);
    setTimeout(() => {
      const result: ValidationResult = registerMatch(
        registerMatchId,
        currentUserId,
        currentUser.grade,
        registerTeamId || undefined
      );
      setRegisterLoading(false);
      if (result.ok) {
        showToast("success", "报名提交成功，等待审核！");
        setShowRegisterModal(false);
      } else {
        showToast("error", result.error || "报名失败");
      }
    }, 400);
  };

  // 处理审核通过
  const handleApprove = (regId: string) => {
    const reg = registrations.find((r) => r.id === regId);
    if (!reg) return;
    const user = users.find((u) => u.id === reg.userId);
    const result = approveRegistration(regId, user?.grade || "大一");
    if (result.ok) {
      showToast("success", `${user?.name} 的报名已通过`);
    } else {
      showToast("error", result.error || "审核失败");
    }
  };

  // 真实的时间冲突检测（用于报名管理）
  const hasRealConflict = (reg: { userId: string; matchId: string }) => {
    const match = matches.find((m) => m.id === reg.matchId);
    if (!match) return false;
    const conflicts = checkTimeConflict(reg.userId, match.date, match.time);
    // 要排除掉本身的 matchId
    return conflicts.some((c) => c.id !== reg.matchId);
  };

  // 抽签编排
  const getBrackets = (): BracketMatch[] => {
    if (brackets && brackets.length > 0) return brackets;
    // 默认种子
    const seed: BracketMatch[] = [
      {
        id: generateId("bm"),
        round: "半决赛",
        proTeamId: "t001",
        conTeamId: "t002",
        venue: "学术报告厅A301",
        date: "2025-06-20",
        time: "19:00-21:00",
      },
      {
        id: generateId("bm"),
        round: "半决赛",
        proTeamId: "t003",
        conTeamId: "t004",
        venue: "学术报告厅A301",
        date: "2025-06-21",
        time: "19:00-21:00",
      },
      {
        id: generateId("bm"),
        round: "决赛",
        proTeamId: null,
        conTeamId: null,
        venue: "大礼堂",
        date: "2025-06-28",
        time: "19:00-21:30",
      },
    ];
    return seed;
  };

  const venues = ["学术报告厅A301", "教学楼B201", "学术交流中心", "大礼堂"];

  const handleRedraw = () => {
    setDrawLoading(true);
    setTimeout(() => {
      // 所有非归档队伍
      const pool = teams
        .filter((t) => !t.archived)
        .map((t) => t.id);
      const shuffled = [...pool].sort(() => Math.random() - 0.5);

      const semiVenue1 = venues[Math.floor(Math.random() * 3)];
      const semiVenue2 = venues.filter((v) => v !== semiVenue1)[Math.floor(Math.random() * 3)];
      const daysDelta1 = Math.floor(Math.random() * 3);
      const daysDelta2 = daysDelta1 + 1 + Math.floor(Math.random() * 2);
      const pad = (n: number) => String(n).padStart(2, "0");

      const newBrackets: BracketMatch[] = [
        {
          id: generateId("bm"),
          round: "半决赛",
          proTeamId: shuffled[0] || null,
          conTeamId: shuffled[1] || null,
          venue: semiVenue1,
          date: `2025-06-${pad(18 + daysDelta1)}`,
          time: "19:00-21:00",
        },
        {
          id: generateId("bm"),
          round: "半决赛",
          proTeamId: shuffled[2] || null,
          conTeamId: shuffled[3] || null,
          venue: semiVenue2,
          date: `2025-06-${pad(18 + daysDelta2)}`,
          time: "19:00-21:00",
        },
        {
          id: generateId("bm"),
          round: "决赛",
          proTeamId: null,
          conTeamId: null,
          venue: "大礼堂",
          date: `2025-07-${pad(2 + Math.floor(Math.random() * 3))}`,
          time: "19:00-21:30",
        },
      ];
      setBrackets(newBrackets);
      setDrawSeed(`2025春季赛 · ${new Date().toLocaleTimeString("zh-CN")} 抽签`);
      showToast("success", "对阵和场地已重新抽签！");
      setDrawLoading(false);
    }, 650);
  };

  const handleSubmitScore = () => {
    if (!scoreBracketId) return;
    const proScore = parseInt(scorePro, 10);
    const conScore = parseInt(scoreCon, 10);
    if (isNaN(proScore) || isNaN(conScore)) {
      showToast("error", "请输入有效的比分数字");
      return;
    }
    if (proScore === conScore) {
      showToast("error", "比分不能相同，请分出胜负");
      return;
    }
    const winner: "pro" | "con" = proScore > conScore ? "pro" : "con";
    const bracket = currentBrackets.find((b) => b.id === scoreBracketId);
    if (!bracket) return;
    const winnerTeamId = winner === "pro" ? bracket.proTeamId : bracket.conTeamId;

    // 更新当前场次比分
    updateBracket(scoreBracketId, { proScore, conScore, winner });

    // 如果是半决赛，自动把胜者推进到决赛
    if (bracket.round === "半决赛") {
      const semisList = currentBrackets.filter((b) => b.round === "半决赛");
      const semiIndex = semisList.findIndex((b) => b.id === scoreBracketId);
      const finalMatch = currentBrackets.find((b) => b.round === "决赛");
      if (finalMatch) {
        if (semiIndex === 0) {
          updateBracket(finalMatch.id, { proTeamId: winnerTeamId });
        } else if (semiIndex === 1) {
          updateBracket(finalMatch.id, { conTeamId: winnerTeamId });
        }
      }
    }

    showToast("success", "比分已录入，对阵已同步更新");
    setShowScoreModal(false);
    setScoreBracketId(null);
    setScorePro("");
    setScoreCon("");
  };

  const currentBrackets = getBrackets();
  const semis = currentBrackets.filter((b) => b.round === "半决赛");
  const finals = currentBrackets.filter((b) => b.round === "决赛");
  const getTeam = (id: string | null): Team | undefined =>
    id ? teams.find((t) => t.id === id) : undefined;

  // 冲突数量提示
  const conflictCount = registrations.filter(
    (r) => r.status === "pending" && hasRealConflict(r)
  ).length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed top-20 right-6 z-[100] px-5 py-3 rounded-xl shadow-lg animate-fade-in-up flex items-center gap-2 max-w-sm",
            toast.type === "success" && "bg-success text-white",
            toast.type === "error" && "bg-victory text-white",
            toast.type === "info" && "bg-primary-600 text-white"
          )}
        >
          {toast.type === "success" && <Check className="w-4 h-4 flex-shrink-0" />}
          {toast.type === "error" && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.type === "info" && <UserCheck className="w-4 h-4 flex-shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 opacity-0 animate-fade-in-up">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-800 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary-600" />
            赛程管理
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            查看比赛、管理报名、抽签编排
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索比赛..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-cream-300 shadow-card w-fit overflow-x-auto opacity-0 animate-fade-in-up animate-delay-100">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              view === v.id
                ? "bg-primary-600 text-white shadow-sm"
                : "text-ink-600 hover:bg-cream-100"
            }`}
          >
            <v.icon className="w-4 h-4" />
            {v.label}
            {v.id === "registration" && pendingRegistrations.length > 0 && (
              <span className="bg-victory text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {pendingRegistrations.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Match List View */}
      {view === "list" && (
        <div className="space-y-4 opacity-0 animate-fade-in">
          {/* Leaderboard Summary */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold text-ink-800 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent-500" />
                赛季积分榜
              </h2>
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-1" />
                详细榜单
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {leaderboard.slice(0, 4).map((entry, idx) => (
                <div
                  key={entry.teamId}
                  className={`p-3 rounded-xl border-2 ${
                    idx === 0
                      ? "bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200"
                      : idx === 1
                      ? "bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200"
                      : idx === 2
                      ? "bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200"
                      : "bg-cream-50 border-cream-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-serif font-bold text-ink-800">
                      #{entry.rank}
                    </span>
                    <img
                      src={entry.teamAvatar}
                      alt=""
                      className="w-7 h-7 rounded-lg bg-white"
                    />
                  </div>
                  <p className="text-sm font-semibold text-ink-800 truncate">
                    {entry.teamName}
                  </p>
                  <p className="text-2xl font-mono font-bold text-primary-700 mt-1">
                    {entry.points}
                    <span className="text-sm font-normal text-ink-400 ml-1">
                      分
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Matches */}
          {filteredMatches.map((match, idx) => {
            const myReg = registrations.find(
              (r) => r.matchId === match.id && r.userId === currentUserId && r.status !== "rejected"
            );
            return (
              <Card
                key={match.id}
                hover
                className={`opacity-0 animate-fade-in-up animate-delay-${100 + idx * 50}`}
              >
                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge
                          variant={
                            match.status === "registration"
                              ? "success"
                              : match.status === "finished"
                              ? "default"
                              : match.status === "ongoing"
                              ? "warning"
                              : "primary"
                          }
                        >
                          {matchStatusLabels[match.status].label}
                        </Badge>
                        <span className="text-xs text-ink-400">
                          {match.season} · {match.round}
                        </span>
                        {match.gradeLimit !== "无限制" && (
                          <Badge variant="warning">限{match.gradeLimit}</Badge>
                        )}
                        {myReg && (
                          <Badge
                            variant={
                              myReg.status === "approved" ? "success" : "warning"
                            }
                          >
                            已{myReg.status === "approved" ? "通过" : "报名"}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-serif font-bold text-lg text-ink-800 mb-2">
                        {match.title}
                      </h3>
                      <p className="text-sm text-ink-600 mb-3">
                        <span className="text-victory font-medium">正方：</span>
                        {match.proDescription}
                        <br />
                        <span className="text-primary-700 font-medium">反方：</span>
                        {match.conDescription}
                      </p>
                      <div className="flex flex-wrap gap-4 text-xs text-ink-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(match.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {match.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {match.venue}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {match.registeredCount}/{match.maxTeams}
                        </span>
                      </div>

                      {match.result && (
                        <div className="mt-4 p-4 rounded-xl bg-cream-50 border border-cream-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-ink-700">
                              比赛结果
                            </span>
                            <Badge variant={match.result.winner === "pro" ? "success" : "primary"}>
                              {match.result.winner === "pro" ? "正方获胜" : match.result.winner === "con" ? "反方获胜" : "平局"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-center gap-6 py-2">
                            <div className="text-center">
                              <p className="text-xs text-ink-400">正方</p>
                              <p className="text-3xl font-mono font-bold text-victory">
                                {match.result.proScore}
                              </p>
                            </div>
                            <span className="text-ink-300 text-2xl font-serif">:</span>
                            <div className="text-center">
                              <p className="text-xs text-ink-400">反方</p>
                              <p className="text-3xl font-mono font-bold text-primary-700">
                                {match.result.conScore}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-ink-500 text-center mt-2">
                            最佳辩手：{users.find((u) => u.id === match.result?.bestSpeakerId)?.name}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex md:flex-col gap-2 md:min-w-[130px]">
                      {match.status === "registration" && !myReg && (
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={() => openRegister(match.id)}
                          className="flex-1 md:flex-none"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          立即报名
                        </Button>
                      )}
                      {(match.status === "pending" || match.status === "ongoing") && (
                        <Button
                          variant={checkedIn.has(match.id) ? "outline" : "accent"}
                          size="sm"
                          onClick={() => handleCheckIn(match.id)}
                          disabled={checkedIn.has(match.id)}
                          className="flex-1 md:flex-none"
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          {checkedIn.has(match.id) ? "已签到" : "到场签到"}
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="flex-1 md:flex-none" onClick={() => setSelectedMatch(match)}>
                        <QrCode className="w-4 h-4 mr-1" />
                        详情
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Calendar View */}
      {view === "calendar" && (
        <Card className="overflow-hidden opacity-0 animate-fade-in">
          <div className="flex items-center justify-between px-5 py-4 border-b border-cream-200 bg-gradient-to-r from-primary-50 to-primary-100/50">
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                )
              }
              className="p-2 rounded-lg hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-primary-700" />
            </button>
            <h2 className="font-serif text-xl font-bold text-primary-800">
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
            </h2>
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                )
              }
              className="p-2 rounded-lg hover:bg-white transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-primary-700" />
            </button>
          </div>
          <div className="grid grid-cols-7 border-b border-cream-200">
            {weekDays.map((day) => (
              <div
                key={day}
                className="px-3 py-2.5 text-center text-xs font-semibold text-ink-500 bg-cream-50"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {getMonthDays().map((day, idx) => (
              <div
                key={idx}
                className={`min-h-[100px] md:min-h-[120px] p-2 border-b border-r border-cream-100 ${
                  day ? "hover:bg-cream-50 cursor-pointer" : "bg-cream-50/50"
                }`}
                onClick={() => {
                  if (day) {
                    const dayMatches = getMatchesForDay(day);
                    if (dayMatches.length > 0) setSelectedMatch(dayMatches[0]);
                  }
                }}
              >
                {day && (
                  <>
                    <span
                      className={`text-xs font-medium ${
                        day === 15 ? "bg-primary-600 text-white px-1.5 py-0.5 rounded" : "text-ink-600"
                      }`}
                    >
                      {day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {getMatchesForDay(day).slice(0, 2).map((m) => (
                        <div
                          key={m.id}
                          className={`p-1.5 rounded text-[10px] truncate ${
                            m.status === "registration"
                              ? "bg-green-100 text-green-700"
                              : m.status === "finished"
                              ? "bg-ink-100 text-ink-600"
                              : "bg-primary-100 text-primary-700"
                          }`}
                        >
                          {m.time.split("-")[0]} {m.title.slice(0, 8)}...
                        </div>
                      ))}
                      {getMatchesForDay(day).length > 2 && (
                        <p className="text-[10px] text-ink-400 pl-1">
                          +{getMatchesForDay(day).length - 2} 场
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Registration Management */}
      {view === "registration" && (
        <div className="space-y-4 opacity-0 animate-fade-in">
          {/* Conflict Warning */}
          {conflictCount > 0 && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">冲突时间检测</p>
                  <p className="text-xs text-amber-600 mt-1">
                    系统检测到 {conflictCount} 名待审核报名者存在比赛时间冲突，审核前请仔细确认。
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-cream-200 flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-ink-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                报名审核 ({registrations.length})
                {pendingRegistrations.length > 0 && (
                  <Badge variant="warning">待审核{pendingRegistrations.length}</Badge>
                )}
              </h2>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-ink-400" />
                <select className="input !py-1.5 !text-xs !w-auto">
                  <option>全部比赛</option>
                  <option>新生杯</option>
                  <option>春季赛</option>
                </select>
              </div>
            </div>
            <div className="divide-y divide-cream-200">
              {registrations.length === 0 ? (
                <div className="p-10 text-center text-sm text-ink-400">
                  暂无报名记录
                </div>
              ) : (
                registrations.map((reg) => {
                  const user = users.find((u) => u.id === reg.userId);
                  const match = matches.find((m) => m.id === reg.matchId);
                  const conflicted = hasRealConflict(reg);
                  const gradeMismatch =
                    match &&
                    user &&
                    match.gradeLimit !== "无限制" &&
                    !(() => {
                      const gm = {
                        "大一": user.grade === "大一",
                        "大二及以上": !["大一"].includes(user.grade),
                      } as Record<string, boolean>;
                      if (match.gradeLimit in gm) return gm[match.gradeLimit];
                      return match.gradeLimit === user.grade;
                    })();
                  return (
                    <div
                      key={reg.id}
                      className={`p-4 flex items-center gap-4 hover:bg-cream-50 transition-colors ${
                        conflicted || gradeMismatch ? "bg-amber-50/50" : ""
                      }`}
                    >
                      <img
                        src={user?.avatar}
                        alt=""
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-ink-800">
                            {user?.name}
                          </span>
                          <Badge variant={
                            reg.status === "approved" ? "success" :
                            reg.status === "rejected" ? "danger" : "warning"
                          }>
                            {registrationStatusLabels[reg.status].label}
                          </Badge>
                          {conflicted && (
                            <Badge variant="warning">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              时间冲突
                            </Badge>
                          )}
                          {gradeMismatch && (
                            <Badge variant="danger">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              年级不符
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-ink-400 mt-1">
                          {user?.grade} · {user?.major} · 报名 {match?.title}
                        </p>
                        {match?.gradeLimit !== "无限制" && (
                          <p className="text-xs text-ink-500 mt-1">
                            比赛限制：{match.gradeLimit}（当前：{user?.grade}）
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {reg.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(reg.id)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              通过
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setRejectRegId(reg.id);
                                setRejectReason("");
                                setShowRejectModal(true);
                              }}
                            >
                              <X className="w-4 h-4 mr-1" />
                              拒绝
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Draw & Bracket */}
      {view === "draw" && (
        <div className="space-y-4 opacity-0 animate-fade-in">
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="font-serif text-lg font-bold text-ink-800 flex items-center gap-2">
                  <Shuffle className="w-5 h-5 text-primary-600" />
                  {drawSeed}
                </h2>
                <p className="text-xs text-ink-400 mt-1">
                  对阵和场地均保存至本地，刷新页面后仍然保留
                </p>
              </div>
              <Button variant="accent" onClick={handleRedraw} disabled={drawLoading}>
                {drawLoading ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Shuffle className="w-4 h-4 mr-1.5" />
                )}
                重新抽签
              </Button>
            </div>

            {/* Bracket Visualization */}
            <div className="grid grid-cols-3 gap-6 md:gap-10 items-center">
              {/* Semifinals */}
              <div className="space-y-5">
                <p className="text-xs font-semibold text-ink-400 text-center mb-2">半决赛</p>
                {semis.map((m, i) => {
                  const proT = getTeam(m.proTeamId);
                  const conT = getTeam(m.conTeamId);
                  const hasBothTeams = !!m.proTeamId && !!m.conTeamId;
                  return (
                    <Card key={m.id} className="p-3">
                      <div className="flex items-center justify-between p-2 border-b border-cream-200 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.winner === "pro" ? "bg-success" : "bg-victory"}`} />
                          <span className={`text-sm font-medium truncate ${m.winner === "pro" ? "text-success font-bold" : ""}`}>
                            {proT?.name || "待定"}
                          </span>
                        </div>
                        <span className={`font-mono font-bold flex-shrink-0 ml-2 ${m.winner === "pro" ? "text-success text-lg" : "text-victory"}`}>
                          {m.proScore ?? "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.winner === "con" ? "bg-success" : "bg-primary-600"}`} />
                          <span className={`text-sm font-medium truncate ${m.winner === "con" ? "text-success font-bold" : ""}`}>
                            {conT?.name || "待定"}
                          </span>
                        </div>
                        <span className={`font-mono font-bold flex-shrink-0 ml-2 ${m.winner === "con" ? "text-success text-lg" : "text-primary-700"}`}>
                          {m.conScore ?? "-"}
                        </span>
                      </div>
                      {currentUser?.role === "admin" && hasBothTeams && (
                        <div className="pt-2 border-t border-cream-100">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs"
                            onClick={() => {
                              setScoreBracketId(m.id);
                              setScorePro(m.proScore?.toString() || "");
                              setScoreCon(m.conScore?.toString() || "");
                              setShowScoreModal(true);
                            }}
                          >
                            <Trophy className="w-3 h-3 mr-1" />
                            {m.winner ? "修改比分" : "录入比分"}
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
                {semis.length === 0 && (
                  <div className="text-center text-sm text-ink-400 py-8">暂无比赛</div>
                )}
              </div>

              {/* Connector */}
              <div className="flex flex-col items-center justify-center h-full py-8 md:py-14">
                <div className="w-8 md:w-12 h-px bg-primary-300" />
                <div className="w-px h-16 md:h-24 bg-primary-300" />
                <div className="w-px h-16 md:h-24 bg-primary-300" />
                <div className="w-8 md:w-12 h-px bg-primary-300" />
              </div>

              {/* Final */}
              <div>
                <p className="text-xs font-semibold text-ink-400 text-center mb-2">决赛</p>
                {finals.map((m) => {
                  const proT = getTeam(m.proTeamId);
                  const conT = getTeam(m.conTeamId);
                  const hasBothTeams = !!m.proTeamId && !!m.conTeamId;
                  return (
                    <Card key={m.id} className="p-4 border-accent-300 shadow-md bg-gradient-to-br from-accent-50 to-white">
                      <div className="text-center mb-3">
                        <Trophy className="w-6 h-6 mx-auto text-accent-500" />
                        <p className="text-xs font-semibold text-accent-600 mt-1">冠军争夺</p>
                      </div>
                      <div className="flex items-center justify-between p-2 border-b border-cream-200 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.winner === "pro" ? "bg-success" : "bg-victory"}`} />
                          <span className={`text-sm font-medium truncate ${m.winner === "pro" ? "text-success font-bold" : ""}`}>
                            {proT?.name || "半决赛胜者1"}
                          </span>
                        </div>
                        <span className={`font-mono font-bold flex-shrink-0 ml-2 ${m.winner === "pro" ? "text-success text-lg" : m.proScore != null ? "text-ink-700" : "text-ink-300"}`}>
                          {m.proScore ?? "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.winner === "con" ? "bg-success" : "bg-primary-600"}`} />
                          <span className={`text-sm font-medium truncate ${m.winner === "con" ? "text-success font-bold" : ""}`}>
                            {conT?.name || "半决赛胜者2"}
                          </span>
                        </div>
                        <span className={`font-mono font-bold flex-shrink-0 ml-2 ${m.winner === "con" ? "text-success text-lg" : m.conScore != null ? "text-ink-700" : "text-ink-300"}`}>
                          {m.conScore ?? "-"}
                        </span>
                      </div>
                      {currentUser?.role === "admin" && hasBothTeams && (
                        <div className="pt-3 mt-2 border-t border-accent-200">
                          <Button
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => {
                              setScoreBracketId(m.id);
                              setScorePro(m.proScore?.toString() || "");
                              setScoreCon(m.conScore?.toString() || "");
                              setShowScoreModal(true);
                            }}
                          >
                            <Trophy className="w-3 h-3 mr-1" />
                            {m.winner ? "修改比分" : "录入比分"}
                          </Button>
                        </div>
                      )}
                      {!hasBothTeams && (
                        <div className="pt-3 mt-2 border-t border-accent-200">
                          <p className="text-xs text-ink-500 text-center">
                            半决赛结束后自动晋级
                          </p>
                        </div>
                      )}
                    </Card>
                  );
                })}
                {finals.length === 0 && (
                  <div className="text-center text-sm text-ink-400 py-8">待生成</div>
                )}
              </div>
            </div>

            {/* Venue Allocation */}
            <div className="mt-8 pt-6 border-t border-cream-200">
              <h3 className="font-serif font-semibold text-ink-800 mb-4 flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-primary-600" />
                场地与时间安排
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {currentBrackets.map((b) => {
                  const proT = getTeam(b.proTeamId);
                  const conT = getTeam(b.conTeamId);
                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-cream-50 border border-cream-200"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink-700">
                          {b.round}：{proT?.name || "待定"} VS {conT?.name || "待定"}
                        </p>
                        <p className="text-xs text-ink-400 mt-1">
                          {formatDate(b.date)} · {b.time}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-100 text-primary-700 text-xs font-medium flex-shrink-0 ml-2">
                        <MapPin className="w-3 h-3" />
                        {b.venue}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 报名弹窗 */}
      <Modal
        open={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="比赛报名"
        className="max-w-md"
      >
        {(() => {
          const m = matches.find((x) => x.id === registerMatchId);
          if (!m) return null;
          const gradeCheck =
            m.gradeLimit === "无限制" ||
            (currentUser?.grade && m.gradeLimit.includes(currentUser.grade)) ||
            (m.gradeLimit.includes("及以上") &&
              currentUser?.grade &&
              !["大一"].includes(currentUser.grade) &&
              m.gradeLimit === "大二及以上");

          const preConflicts =
            currentUser && m ? checkTimeConflict(currentUserId, m.date, m.time) : [];

          return (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-primary-50 border border-primary-100">
                <p className="text-sm text-primary-800">
                  报名场次：<span className="font-semibold">{m.title}</span>
                </p>
                <p className="text-xs text-primary-600 mt-1">
                  {formatDate(m.date)} · {m.time} · {m.venue}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  年级要求
                </label>
                <div
                  className={cn(
                    "p-3 rounded-xl border flex items-start gap-2",
                    gradeCheck
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  )}
                >
                  {gradeCheck ? (
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        gradeCheck ? "text-green-800" : "text-red-800"
                      )}
                    >
                      比赛要求：{m.gradeLimit}（当前：{currentUser?.grade}）
                    </p>
                    {!gradeCheck && (
                      <p className="text-xs text-red-600 mt-1">
                        你不符合该比赛的年级要求，将无法报名成功
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  时间冲突检测
                </label>
                {preConflicts.length === 0 ? (
                  <div className="p-3 rounded-xl bg-green-50 border border-green-200 flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800">
                      该时段暂无其他比赛和安排
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-2">
                    {preConflicts.map((c) => (
                      <div key={c.id} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">
                            {c.title}
                          </p>
                          <p className="text-xs text-red-600">
                            {formatDate(c.date)} · {c.time} · {c.venue}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  参赛队伍（可选）
                </label>
                <select
                  value={registerTeamId}
                  onChange={(e) => setRegisterTeamId(e.target.value)}
                  className="input"
                >
                  <option value="">— 暂不组队，个人报名 —</option>
                  {myTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}（{t.status === "full" ? "阵容完整" : "招募中"}）
                    </option>
                  ))}
                </select>
                {myTeams.length === 0 && (
                  <p className="text-xs text-ink-400 mt-1.5">
                    你还没有创建或加入任何队伍，可先个人报名，后续再组队。
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowRegisterModal(false)}
                >
                  取消
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleRegister}
                  disabled={!gradeCheck || preConflicts.length > 0 || registerLoading}
                >
                  {registerLoading ? (
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-1.5" />
                  )}
                  提交报名
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* 比赛详情 Modal */}
      <Modal
        open={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        title={selectedMatch?.title}
      >
        {selectedMatch && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="primary">{selectedMatch.season}</Badge>
              <Badge variant="warning">{selectedMatch.round}</Badge>
              <Badge variant="accent">{selectedMatch.format}</Badge>
            </div>
            <p className="text-base text-ink-700 font-serif">
              辩题：{selectedMatch.topic}
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-victory/5 border border-victory/20">
                <p className="text-xs font-semibold text-victory mb-1">正方立场</p>
                <p className="text-sm text-ink-800">{selectedMatch.proDescription}</p>
              </div>
              <div className="p-4 rounded-xl bg-primary-600/5 border border-primary-600/20">
                <p className="text-xs font-semibold text-primary-700 mb-1">反方立场</p>
                <p className="text-sm text-ink-800">{selectedMatch.conDescription}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-cream-50">
                <p className="text-xs text-ink-400">日期</p>
                <p className="font-medium text-ink-800">{formatDate(selectedMatch.date)}</p>
              </div>
              <div className="p-3 rounded-lg bg-cream-50">
                <p className="text-xs text-ink-400">时间</p>
                <p className="font-medium text-ink-800">{selectedMatch.time}</p>
              </div>
              <div className="p-3 rounded-lg bg-cream-50">
                <p className="text-xs text-ink-400">地点</p>
                <p className="font-medium text-ink-800">{selectedMatch.venue}</p>
              </div>
              <div className="p-3 rounded-lg bg-cream-50">
                <p className="text-xs text-ink-400">报名</p>
                <p className="font-medium text-ink-800">
                  {selectedMatch.registeredCount}/{selectedMatch.maxTeams}
                </p>
              </div>
            </div>
            {selectedMatch.result && (
              <div className="p-4 rounded-xl bg-cream-50 border border-cream-200">
                <div className="flex items-center justify-center gap-8 py-2">
                  <div className="text-center">
                    <p className="text-xs text-ink-400">正方</p>
                    <p className="text-3xl font-mono font-bold text-victory">
                      {selectedMatch.result.proScore}
                    </p>
                  </div>
                  <div>
                    <Badge variant={selectedMatch.result.winner === "pro" ? "success" : "primary"} className="!px-4 !py-1.5">
                      {selectedMatch.result.winner === "pro"
                        ? "正方获胜"
                        : selectedMatch.result.winner === "con"
                        ? "反方获胜"
                        : "平局"}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-ink-400">反方</p>
                    <p className="text-3xl font-mono font-bold text-primary-700">
                      {selectedMatch.result.conScore}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-ink-500 text-center mt-3">
                  最佳辩手：{users.find((u) => u.id === selectedMatch.result!.bestSpeakerId)?.name}
                </p>
                <p className="text-xs text-ink-600 text-center mt-2 pt-2 border-t border-cream-200">
                  {selectedMatch.result.summary}
                </p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setSelectedMatch(null)}>
                关闭
              </Button>
              {selectedMatch.status === "registration" && (
                <Button
                  className="flex-1"
                  onClick={() => {
                    openRegister(selectedMatch.id);
                    setSelectedMatch(null);
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  立即报名
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 录入比分弹窗 */}
      <Modal
        open={showScoreModal}
        onClose={() => setShowScoreModal(false)}
        title="录入比赛比分"
        className="max-w-md"
      >
        {(() => {
          const bm = currentBrackets.find((b) => b.id === scoreBracketId);
          if (!bm) return null;
          const proT = getTeam(bm.proTeamId);
          const conT = getTeam(bm.conTeamId);
          return (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cream-50 border border-cream-200 text-center">
                <Badge variant="primary">{bm.round}</Badge>
                <p className="font-serif font-semibold text-ink-800 mt-2">
                  {proT?.name || "待定"} VS {conT?.name || "待定"}
                </p>
                <p className="text-xs text-ink-500 mt-1">
                  {formatDate(bm.date)} · {bm.time} · {bm.venue}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2 text-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-victory mr-1.5" />
                    {proT?.name || "正方"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={scorePro}
                    onChange={(e) => setScorePro(e.target.value)}
                    className="input text-center font-mono text-2xl font-bold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2 text-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary-600 mr-1.5" />
                    {conT?.name || "反方"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={scoreCon}
                    onChange={(e) => setScoreCon(e.target.value)}
                    className="input text-center font-mono text-2xl font-bold"
                    placeholder="0"
                  />
                </div>
              </div>
              {bm.round === "半决赛" && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">
                    提交后胜方将自动晋级到决赛对阵表中。
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowScoreModal(false)}
                >
                  取消
                </Button>
                <Button className="flex-1" onClick={handleSubmitScore}>
                  <Trophy className="w-4 h-4 mr-1" />
                  确认比分
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* 拒绝报名原因弹窗 */}
      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="拒绝报名"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              请填写拒绝原因，选手将在「我的参赛卡」中看到。
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">拒绝原因</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="input resize-none"
              placeholder="如：年级不符合要求、时间冲突、队伍人数已满等..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setShowRejectModal(false)}
            >
              取消
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                if (!rejectRegId) return;
                const reg = registrations.find((r) => r.id === rejectRegId);
                const user = reg ? users.find((u) => u.id === reg.userId) : undefined;
                rejectRegistration(rejectRegId, rejectReason.trim() || "不符合报名要求");
                showToast("info", `${user?.name || "该选手"} 的报名已拒绝`);
                setShowRejectModal(false);
                setRejectRegId(null);
                setRejectReason("");
              }}
            >
              <X className="w-4 h-4 mr-1" />
              确认拒绝
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
