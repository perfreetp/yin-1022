import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageCircle,
  Pin,
  Quote,
  ArrowRight,
  Megaphone,
  Flame,
  AlertCircle,
  Check,
  X,
  Sparkles,
  Award,
  Crown,
  Swords,
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { useMatchStore } from "../store/useMatchStore";
import { useTeamStore } from "../store/useTeamStore";
import { useResourceStore } from "../store/useResourceStore";
import { useUserStore } from "../store/useUserStore";
import {
  matchStatusLabels,
  formatDate,
  formatRelativeTime,
  generateId,
  cn,
} from "../utils";
import type { Match } from "../types";

export default function Home() {
  const matches = useMatchStore((s) => s.matches);
  const teams = useTeamStore((s) => s.teams);
  const leaderboard = useTeamStore((s) => s.leaderboard);
  const announcements = useResourceStore((s) => s.announcements);
  const comments = useResourceStore((s) => s.comments);
  const users = useUserStore((s) => s.users);
  const addComment = useResourceStore((s) => s.addComment);
  const currentUserId = useUserStore((s) => s.currentUserId);
  const registerMatch = useMatchStore((s) => s.registerMatch);

  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [registeredMatches, setRegisteredMatches] = useState<Set<string>>(new Set());

  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [errorModal, setErrorModal] = useState<{
    title: string;
    message: string;
    conflicts?: Match[];
  } | null>(null);
  const [showSeasonResult, setShowSeasonResult] = useState(false);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const upcomingMatches = [...matches]
    .filter((m) => m.status !== "finished" && m.status !== "cancelled")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  const handleRegister = (matchId: string) => {
    if (registeredMatches.has(matchId)) return;
    const currentUser = users.find((u) => u.id === currentUserId);
    const result = registerMatch(matchId, currentUserId, currentUser?.grade || "大一");
    if (result.ok) {
      setRegisteredMatches((prev) => new Set([...prev, matchId]));
      showToast("success", "报名成功！等待审核");
    } else {
      const match = matches.find((m) => m.id === matchId);
      setErrorModal({
        title: match ? `无法报名「${match.title}」` : "无法报名",
        message: result.error || "报名失败，请稍后再试",
        conflicts: result.conflictMatches,
      });
    }
  };

  const handleAddComment = (announcementId: string) => {
    const content = commentInput[announcementId]?.trim();
    if (!content) return;
    addComment({
      id: generateId("c"),
      announcementId,
      userId: currentUserId,
      content,
      createdAt: new Date().toISOString(),
    });
    setCommentInput((prev) => ({ ...prev, [announcementId]: "" }));
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-amber-100 to-amber-50 border-amber-300";
    if (rank === 2) return "bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300";
    if (rank === 3) return "bg-gradient-to-r from-orange-100 to-orange-50 border-orange-300";
    return "bg-white";
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-4 h-4 text-amber-500" />;
    if (rank === 2) return <span className="text-sm font-bold text-gray-500">2</span>;
    if (rank === 3) return <span className="text-sm font-bold text-orange-600">3</span>;
    return <span className="text-sm font-medium text-ink-500">{rank}</span>;
  };

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
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl animate-fade-in-up">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800" />
        <div className="absolute inset-0 bg-grain-overlay opacity-30" />
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="absolute -left-10 -bottom-20 w-60 h-60 rounded-full bg-primary-400/30 blur-3xl" />

        <div className="relative px-6 md:px-12 py-12 md:py-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4 opacity-0 animate-fade-in-up animate-delay-100">
              <Flame className="w-5 h-5 text-accent-400 animate-float" />
              <span className="text-accent-300 text-sm font-medium tracking-wide">
                2025 春季辩论赛火热进行中
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white leading-tight mb-4 opacity-0 animate-fade-in-up animate-delay-150 text-balance">
              以辩明道，
              <br />
              <span className="text-accent-400">以论正言</span>
            </h1>
            <p className="text-primary-100 text-base md:text-lg mb-8 opacity-0 animate-fade-in-up animate-delay-200 leading-relaxed">
              加入思辨学社，在这里你将遇见志同道合的伙伴，
              参与精彩的辩论赛，磨砺思维，锻炼口才，
              成为更好的自己。
            </p>
            <div className="flex flex-wrap gap-3 opacity-0 animate-fade-in-up animate-delay-250">
              <Link to="/schedule">
                <Button variant="accent" size="lg">
                  <Megaphone className="w-4 h-4 mr-2" />
                  立即报名参赛
                </Button>
              </Link>
              <Link to="/teams">
                <Button
                  variant="outline"
                  size="lg"
                  className="!bg-white/10 !border-white/30 !text-white hover:!bg-white/20"
                >
                  <Users className="w-4 h-4 mr-2" />
                  浏览招募队伍
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 mt-12 max-w-lg opacity-0 animate-fade-in-up animate-delay-300">
            {[
              { value: "128+", label: "注册成员" },
              { value: "36", label: "本赛季场次" },
              { value: "24", label: "参赛队伍" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-serif text-2xl md:text-3xl font-bold text-white">
                  {stat.value}
                </p>
                <p className="text-xs md:text-sm text-primary-200 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {hasSeasonResult && seasonData && (
        <Card className="p-0 overflow-hidden opacity-0 animate-fade-in-up animate-delay-100 !bg-gradient-to-br !from-amber-50 via-white !to-primary-500/5 !border-amber-200/70 shadow-lg">
          <button
            onClick={() => setShowSeasonResult(true)}
            className="w-full text-left p-5 md:p-6 flex flex-col sm:flex-row items-center gap-5 transition-all hover:bg-white/40"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
              <Trophy className="w-10 h-10 text-white animate-float" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="accent" className="!bg-amber-500">
                  <Sparkles className="w-3 h-3 mr-1" />
                  赛季结果已出炉
                </Badge>
                <span className="text-xs text-ink-400">2025春季赛</span>
              </div>
              <h3 className="font-serif font-bold text-xl text-ink-800 mb-1.5">
                恭喜 {seasonData.champion?.name || "冠军队"} 夺冠！
              </h3>
              <p className="text-sm text-ink-500 line-clamp-1">
                决赛比分 {seasonData.finalMatch.result?.proScore} : {seasonData.finalMatch.result?.conScore}
                {seasonData.bestSpeaker && ` · 最佳辩手：${seasonData.bestSpeaker.name}`}
              </p>
            </div>
            <div className="flex-shrink-0">
              <Button variant="accent" size="sm">
                查看赛季总结 <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </button>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左侧主内容 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 近期比赛 */}
          <section className="opacity-0 animate-fade-in-up animate-delay-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-ink-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                近期比赛
              </h2>
              <Link
                to="/schedule"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingMatches.map((match, idx) => (
                <Card
                  key={match.id}
                  hover
                  className={`opacity-0 animate-fade-in-up animate-delay-${150 + idx * 50}`}
                >
                  <div className="p-4 md:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant={
                              match.status === "registration"
                                ? "success"
                                : match.status === "ongoing"
                                ? "warning"
                                : "primary"
                            }
                          >
                            {matchStatusLabels[match.status].label}
                          </Badge>
                          <span className="text-xs text-ink-400">{match.season}</span>
                        </div>
                        <h3 className="font-serif font-semibold text-ink-800 mb-2">
                          {match.title}
                        </h3>
                        <p className="text-sm text-ink-600 line-clamp-1 mb-3">
                          <Quote className="w-3 h-3 inline mr-1 text-accent-600" />
                          {match.topic}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-ink-500">
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
                            {match.registeredCount}/{match.maxTeams} 队
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {match.status === "registration" ? (
                          <Button
                            variant={registeredMatches.has(match.id) ? "outline" : "accent"}
                            size="sm"
                            onClick={() => handleRegister(match.id)}
                            disabled={registeredMatches.has(match.id)}
                          >
                            {registeredMatches.has(match.id) ? "已报名" : "立即报名"}
                          </Button>
                        ) : (
                          <Link to={`/schedule`}>
                            <Button variant="outline" size="sm">
                              详情
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* 公告栏 */}
          <section className="opacity-0 animate-fade-in-up animate-delay-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-ink-800 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary-600" />
                社团公告
              </h2>
            </div>

            <div className="space-y-3">
              {announcements.slice(0, 3).map((ann, idx) => {
                const annComments = comments.filter((c) => c.announcementId === ann.id);
                const author = users.find((u) => u.id === ann.authorId);

                return (
                  <Card key={ann.id} className={`opacity-0 animate-fade-in-up animate-delay-${350 + idx * 50}`}>
                    <div className="p-4 md:p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          {ann.pinned && (
                            <Pin className="w-4 h-4 text-victory fill-victory/20" />
                          )}
                          <h3 className="font-serif font-semibold text-ink-800">
                            {ann.title}
                          </h3>
                        </div>
                        <span className="text-xs text-ink-400 flex-shrink-0">
                          {formatRelativeTime(ann.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-ink-600 whitespace-pre-line mb-4 leading-relaxed">
                        {ann.content}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-cream-200">
                        <div className="flex items-center gap-2">
                          <img
                            src={author?.avatar}
                            alt=""
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-xs text-ink-500">{author?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-ink-400">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-xs">{ann.commentsCount + annComments.length - ann.commentsCount > 0 ? annComments.length : ann.commentsCount}</span>
                        </div>
                      </div>

                      {/* Comments */}
                      {annComments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-cream-200 space-y-3">
                          {annComments.slice(-3).map((c) => {
                            const commenter = users.find((u) => u.id === c.userId);
                            return (
                              <div key={c.id} className="flex gap-3">
                                <img
                                  src={commenter?.avatar}
                                  alt=""
                                  className="w-7 h-7 rounded-full flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-ink-700">
                                      {commenter?.name}
                                    </span>
                                    <span className="text-[10px] text-ink-400">
                                      {formatRelativeTime(c.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-ink-600">{c.content}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Comment input */}
                      <div className="mt-4 flex gap-2">
                        <input
                          type="text"
                          value={commentInput[ann.id] || ""}
                          onChange={(e) =>
                            setCommentInput((prev) => ({
                              ...prev,
                              [ann.id]: e.target.value,
                            }))
                          }
                          placeholder="写下你的评论..."
                          className="input flex-1 !py-1.5 !text-sm"
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleAddComment(ann.id)
                          }
                        />
                        <Button size="sm" onClick={() => handleAddComment(ann.id)}>
                          发送
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>

        {/* 右侧边栏 */}
        <div className="space-y-6">
          {/* 积分榜 */}
          <Card className="opacity-0 animate-fade-in-up animate-delay-150 overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-primary-600 to-primary-700">
              <h2 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent-400" />
                赛季积分榜
              </h2>
              <p className="text-xs text-primary-200 mt-1">2025春季赛 · 实时更新</p>
            </div>
            <div className="divide-y divide-cream-200">
              {leaderboard.slice(0, 6).map((entry, idx) => (
                <div
                  key={entry.teamId}
                  className={`px-4 py-3 flex items-center gap-3 transition-colors ${getRankStyle(
                    entry.rank
                  )} ${idx < 3 ? "border-l-4" : ""} ${
                    idx === 0
                      ? "border-l-amber-400"
                      : idx === 1
                      ? "border-l-gray-400"
                      : idx === 2
                      ? "border-l-orange-400"
                      : ""
                  }`}
                >
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    {getRankBadge(entry.rank)}
                  </div>
                  <img
                    src={entry.teamAvatar}
                    alt=""
                    className="w-8 h-8 rounded-lg bg-cream-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-800 truncate">
                      {entry.teamName}
                    </p>
                    <p className="text-[11px] text-ink-400">
                      {entry.wins}胜 {entry.losses}负
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary-700">
                      {entry.points}
                    </span>
                    {entry.trend === "up" && (
                      <TrendingUp className="w-4 h-4 text-success" />
                    )}
                    {entry.trend === "down" && (
                      <TrendingDown className="w-4 h-4 text-victory" />
                    )}
                    {entry.trend === "same" && (
                      <Minus className="w-4 h-4 text-ink-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/schedule"
              className="block px-5 py-3 text-center text-sm text-primary-600 hover:bg-cream-50 transition-colors border-t border-cream-200 font-medium"
            >
              查看完整榜单 <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
          </Card>

          {/* 快速入口 */}
          <Card className="opacity-0 animate-fade-in-up animate-delay-250">
            <div className="p-5">
              <h2 className="font-serif text-lg font-bold text-ink-800 mb-4">快捷入口</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "完善资料", to: "/members", icon: Users, color: "bg-blue-50 text-blue-600" },
                  { label: "创建队伍", to: "/teams", icon: Trophy, color: "bg-amber-50 text-amber-600" },
                  { label: "查看赛程", to: "/schedule", icon: Calendar, color: "bg-green-50 text-green-600" },
                  { label: "学习资料", to: "/resources", icon: Quote, color: "bg-purple-50 text-purple-600" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-cream-50 transition-colors group"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center group-hover:scale-105 transition-transform`}
                    >
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-ink-700">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "fixed top-20 right-6 z-[100] px-5 py-3 rounded-xl shadow-lg animate-fade-in-up flex items-center gap-2",
            toast.type === "success" && "bg-success text-white",
            toast.type === "error" && "bg-victory text-white",
            toast.type === "info" && "bg-primary-600 text-white"
          )}
        >
          {toast.type === "success" && <Check className="w-4 h-4" />}
          {toast.type === "error" && <AlertCircle className="w-4 h-4" />}
          {toast.type === "info" && <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* 错误提示弹窗 */}
      <Modal
        open={!!errorModal}
        onClose={() => setErrorModal(null)}
        title={errorModal?.title || "提示"}
      >
        {errorModal && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-victory flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 leading-relaxed">{errorModal.message}</p>
            </div>
            {errorModal.conflicts && errorModal.conflicts.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-ink-700 mb-2">冲突场次：</p>
                <div className="space-y-2">
                  {errorModal.conflicts.map((cm) => (
                    <div
                      key={cm.id}
                      className="p-3 rounded-lg bg-cream-50 border border-cream-200"
                    >
                      <p className="text-sm font-medium text-ink-800">{cm.title}</p>
                      <p className="text-xs text-ink-500 mt-1">
                        {formatDate(cm.date)} · {cm.time} · {cm.venue}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button onClick={() => setErrorModal(null)}>
                我知道了
              </Button>
            </div>
          </div>
        )}
      </Modal>

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
