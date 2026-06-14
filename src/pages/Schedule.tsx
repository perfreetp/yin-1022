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
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { useMatchStore } from "../store/useMatchStore";
import { useTeamStore } from "../store/useTeamStore";
import { useUserStore } from "../store/useUserStore";
import {
  matchStatusLabels,
  registrationStatusLabels,
  formatDate,
  weekDays,
} from "../utils";
import type { Match } from "../types";

type ViewType = "list" | "calendar" | "registration" | "draw";

export default function Schedule() {
  const matches = useMatchStore((s) => s.matches);
  const registrations = useMatchStore((s) => s.registrations);
  const approveRegistration = useMatchStore((s) => s.approveRegistration);
  const rejectRegistration = useMatchStore((s) => s.rejectRegistration);
  const leaderboard = useTeamStore((s) => s.leaderboard);
  const teams = useTeamStore((s) => s.teams);
  const users = useUserStore((s) => s.users);

  const [view, setView] = useState<ViewType>("list");
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 5, 1));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());

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
  };

  const pendingRegistrations = registrations.filter(
    (r) => r.status === "pending"
  );

  return (
    <div className="space-y-6">
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
          {filteredMatches.map((match, idx) => (
            <Card
              key={match.id}
              hover
              className={`opacity-0 animate-fade-in-up animate-delay-${100 + idx * 50}`}
            >
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
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

                  <div className="flex md:flex-col gap-2 md:min-w-[120px]">
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
                    <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                      <QrCode className="w-4 h-4 mr-1" />
                      详情
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
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
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">冲突时间检测</p>
                <p className="text-xs text-amber-600 mt-1">
                  系统检测到 2 名报名者存在比赛时间冲突，请谨慎审核。
                </p>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-cream-200 flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-ink-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                待审核报名 ({pendingRegistrations.length})
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
              {registrations.map((reg) => {
                const user = users.find((u) => u.id === reg.userId);
                const match = matches.find((m) => m.id === reg.matchId);
                const hasConflict = reg.id === "r003";
                return (
                  <div
                    key={reg.id}
                    className={`p-4 flex items-center gap-4 hover:bg-cream-50 transition-colors ${
                      hasConflict ? "bg-amber-50/50" : ""
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
                        {hasConflict && (
                          <Badge variant="warning">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            时间冲突
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-ink-400 mt-1">
                        {user?.grade} · {user?.major} · 报名 {match?.title}
                      </p>
                      {match?.gradeLimit !== "无限制" && (
                        <p className="text-xs text-ink-500 mt-1">
                          比赛限制：{match.gradeLimit}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {reg.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approveRegistration(reg.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            通过
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => rejectRegistration(reg.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            拒绝
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Draw & Bracket */}
      {view === "draw" && (
        <div className="space-y-4 opacity-0 animate-fade-in">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-lg font-bold text-ink-800 flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-primary-600" />
                2025春季赛 · 半决赛对阵
              </h2>
              <Button variant="accent">
                <Shuffle className="w-4 h-4 mr-1.5" />
                重新抽签
              </Button>
            </div>

            {/* Bracket Visualization */}
            <div className="grid grid-cols-3 gap-8 items-center">
              {/* Semifinals */}
              <div className="space-y-6">
                <p className="text-xs font-semibold text-ink-400 text-center mb-2">半决赛</p>
                {[
                  { pro: "逻辑风暴", con: "新生先锋队", proScore: 0, conScore: 0, done: false },
                  { pro: "攻无不克", con: "思辩之光", proScore: 0, conScore: 0, done: false },
                ].map((m, i) => (
                  <Card key={i} className="p-3">
                    <div className="flex items-center justify-between p-2 border-b border-cream-200">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-victory" />
                        <span className="text-sm font-medium">
                          {teams.find((t) => t.name === m.pro)?.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-victory">{m.proScore}</span>
                    </div>
                    <div className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary-600" />
                        <span className="text-sm font-medium">
                          {teams.find((t) => t.name === m.con)?.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-primary-700">{m.conScore}</span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Connector */}
              <div className="flex flex-col items-center justify-center h-full py-12">
                <div className="w-12 h-px bg-primary-300" />
                <div className="w-px h-20 bg-primary-300" />
                <div className="w-px h-20 bg-primary-300" />
                <div className="w-12 h-px bg-primary-300" />
              </div>

              {/* Final */}
              <div>
                <p className="text-xs font-semibold text-ink-400 text-center mb-2">决赛</p>
                <Card className="p-4 border-accent-300 shadow-md bg-gradient-to-br from-accent-50 to-white">
                  <div className="text-center mb-3">
                    <Trophy className="w-6 h-6 mx-auto text-accent-500" />
                    <p className="text-xs font-semibold text-accent-600 mt-1">冠军争夺</p>
                  </div>
                  <div className="flex items-center justify-between p-2 border-b border-cream-200">
                    <span className="text-sm font-medium">待定</span>
                    <span className="font-mono font-bold text-ink-300">-</span>
                  </div>
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm font-medium">待定</span>
                    <span className="font-mono font-bold text-ink-300">-</span>
                  </div>
                </Card>
              </div>
            </div>

            {/* Venue Allocation */}
            <div className="mt-8 pt-6 border-t border-cream-200">
              <h3 className="font-serif font-semibold text-ink-800 mb-4">场地分配</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  { match: "逻辑风暴 VS 新生先锋队", venue: "学术报告厅A301", time: "6月20日 19:00" },
                  { match: "攻无不克 VS 思辩之光", venue: "学术报告厅A301", time: "6月21日 19:00" },
                ].map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-cream-50 border border-cream-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink-700">{v.match}</p>
                      <p className="text-xs text-ink-400 mt-1">{v.time}</p>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-100 text-primary-700 text-xs font-medium">
                      <MapPin className="w-3 h-3" />
                      {v.venue}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
