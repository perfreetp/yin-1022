import { useState, useEffect, useMemo } from "react";
import {
  Gavel,
  Star,
  MessageSquare,
  Award,
  CheckCircle,
  Clock,
  Send,
  Users,
  Quote,
  ThumbsUp,
  AlertCircle,
  Eye,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { useMatchStore } from "../store/useMatchStore";
import { useUserStore } from "../store/useUserStore";
import {
  judgingStatusLabels,
  scoreCategoryLabels,
  formatDate,
  positionLabels,
  cn,
} from "../utils";
import type { JudgingTask, Score, MatchParticipant, Match } from "../types";

type ScoreCategory = keyof typeof scoreCategoryLabels;

export default function Judging() {
  const currentUserId = useUserStore((s) => s.currentUserId);
  const currentUser = useUserStore((s) => s.getUserById(currentUserId));
  const users = useUserStore((s) => s.users);
  const matches = useMatchStore((s) => s.matches);
  const participants = useMatchStore((s) => s.participants);
  const submitJudging = useMatchStore((s) => s.submitJudging);
  const saveDraftJudging = useMatchStore((s) => s.saveDraftJudging);
  const updateMatch = useMatchStore((s) => s.updateMatch);
  const allTasks = useMatchStore((s) => s.judgingTasks);

  const tasks = useMemo(() => {
    if (currentUser?.role === "admin") return allTasks;
    return allTasks.filter((t) => t.judgeId === currentUserId);
  }, [allTasks, currentUserId, currentUser?.role]);

  const [selectedTask, setSelectedTask] = useState<JudgingTask | null>(
    tasks.find((t) => t.status !== "completed") || tasks[0] || null
  );
  const [proScores, setProScores] = useState<Record<string, number>>({});
  const [conScores, setConScores] = useState<Record<string, number>>({});
  const [proNotes, setProNotes] = useState<Record<string, string>>({});
  const [conNotes, setConNotes] = useState<Record<string, string>>({});
  const [comment, setComment] = useState("");
  const [bestSpeakerId, setBestSpeakerId] = useState("");
  const [peerReviews, setPeerReviews] = useState<Record<string, number>>({});
  const [peerComment, setPeerComment] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "info"; message: string } | null>(null);

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizeMatchId, setFinalizeMatchId] = useState<string | null>(null);
  const [finalProScore, setFinalProScore] = useState<string>("");
  const [finalConScore, setFinalConScore] = useState<string>("");
  const [finalBestSpeakerId, setFinalBestSpeakerId] = useState("");
  const [finalSummary, setFinalSummary] = useState("");

  const showToast = (type: "success" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const match = selectedTask
    ? matches.find((m) => m.id === selectedTask.matchId)
    : null;

  // 获取 match 的正反方 teamId
  const matchParticipants = useMemo<MatchParticipant[]>(() => {
    if (!match) return [];
    return participants.filter((p) => p.matchId === match.id);
  }, [participants, match]);

  const proTeamId = matchParticipants.find((p) => p.side === "pro")?.teamId || "pro";
  const conTeamId = matchParticipants.find((p) => p.side === "con")?.teamId || "con";

  // 该场比赛的辩手列表
  const speakers = useMemo(() => {
    if (!match) return [];
    const list: {
      id: string;
      name: string;
      position: string;
      side: "pro" | "con";
      teamName?: string;
    }[] = [];
    matchParticipants.forEach((p) => {
      const team = teamsFromParticipant(p.teamId);
      p.speakers.forEach((sp) => {
        const u = users.find((x) => x.id === sp.userId);
        if (!u) return;
        list.push({
          id: u.id,
          name: u.name,
          position: positionLabels[sp.position] || sp.position,
          side: p.side,
          teamName: team,
        });
      });
    });
    // fallback: 如果没有 participant 数据，用默认
    if (list.length === 0) {
      [
        { id: "u001", name: "张子墨", position: "二辩", side: "pro" as const },
        { id: "u002", name: "李思源", position: "一辩/四辩", side: "pro" as const },
        { id: "u004", name: "陈浩然", position: "三辩", side: "con" as const },
        { id: "u005", name: "刘雅婷", position: "二辩/四辩", side: "con" as const },
      ].forEach((s) => list.push(s));
    }
    return list;
  }, [match, matchParticipants, users]);

  function teamsFromParticipant(teamId: string): string | undefined {
    return undefined; // teamStore 在另一模块，不需要
  }

  const categories: ScoreCategory[] = [
    "opening_statement",
    "cross_examination",
    "free_debate",
    "closing_statement",
  ];

  // **核心：当 selectedTask 变化时，从已保存的 scores 回显**
  useEffect(() => {
    if (!selectedTask) {
      setProScores({});
      setConScores({});
      setProNotes({});
      setConNotes({});
      setComment("");
      setBestSpeakerId("");
      return;
    }

    const nextPro: Record<string, number> = {};
    const nextCon: Record<string, number> = {};
    const nextProNote: Record<string, string> = {};
    const nextConNote: Record<string, string> = {};

    // 把 scores 数组按 teamId 映射到 pro / con
    selectedTask.scores.forEach((s: Score) => {
      // teamId 可能是真实队伍 id（t001/t002）或 字符串 pro/con
      let side: "pro" | "con" | null = null;
      if (s.teamId === "pro" || s.teamId === proTeamId) side = "pro";
      else if (s.teamId === "con" || s.teamId === conTeamId) side = "con";

      if (!side) {
        // fallback：如果没法判断，就按顺序第一个 pro，第二个 con
        side =
          selectedTask.scores.findIndex((x) => x.id === s.id) <
          selectedTask.scores.length / 2
            ? "pro"
            : "con";
      }
      if (side === "pro") {
        nextPro[s.category] = s.score;
        if (s.note) nextProNote[s.category] = s.note;
      } else {
        nextCon[s.category] = s.score;
        if (s.note) nextConNote[s.category] = s.note;
      }
    });

    setProScores(nextPro);
    setConScores(nextCon);
    setProNotes(nextProNote);
    setConNotes(nextConNote);
    setComment(selectedTask.comment || "");
    setBestSpeakerId(selectedTask.bestSpeakerId || "");
  }, [selectedTask, proTeamId, conTeamId]);

  const calcTotal = (scores: Record<string, number>) => {
    return categories.reduce((sum, cat) => {
      const weight = scoreCategoryLabels[cat].weight;
      return sum + (scores[cat] || 0) * weight;
    }, 0);
  };

  const proTotal = calcTotal(proScores);
  const conTotal = calcTotal(conScores);

  const handleScoreChange = (side: "pro" | "con", category: string, value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    if (side === "pro") {
      setProScores((prev) => ({ ...prev, [category]: clamped }));
    } else {
      setConScores((prev) => ({ ...prev, [category]: clamped }));
    }
  };

  const handleNoteChange = (side: "pro" | "con", category: string, value: string) => {
    if (side === "pro") {
      setProNotes((prev) => ({ ...prev, [category]: value }));
    } else {
      setConNotes((prev) => ({ ...prev, [category]: value }));
    }
  };

  const handleSubmit = () => {
    if (!selectedTask) return;
    // 保存时按真实 teamId 存（和 mock 一致）
    const allScores: Score[] = [
      ...categories.map((cat) => ({
        id: `sp-${selectedTask.id}-${proTeamId}-${cat}`,
        taskId: selectedTask.id,
        teamId: proTeamId,
        category: cat,
        score: proScores[cat] || 0,
        note: proNotes[cat],
      })),
      ...categories.map((cat) => ({
        id: `sc-${selectedTask.id}-${conTeamId}-${cat}`,
        taskId: selectedTask.id,
        teamId: conTeamId,
        category: cat,
        score: conScores[cat] || 0,
        note: conNotes[cat],
      })),
    ];
    submitJudging(selectedTask.id, allScores, comment, bestSpeakerId);
    showToast("success", "评审已提交！");
    // 切换到下一个待办任务
    const nextPending = tasks.find(
      (t) => t.id !== selectedTask.id && t.status !== "completed"
    );
    setTimeout(() => setSelectedTask(nextPending || tasks[0] || null), 300);
  };

  const handleSaveDraft = () => {
    if (!selectedTask) return;
    const allScores: Score[] = [
      ...categories.map((cat) => ({
        id: `sp-${selectedTask.id}-${proTeamId}-${cat}`,
        taskId: selectedTask.id,
        teamId: proTeamId,
        category: cat,
        score: proScores[cat] || 0,
        note: proNotes[cat],
      })),
      ...categories.map((cat) => ({
        id: `sc-${selectedTask.id}-${conTeamId}-${cat}`,
        taskId: selectedTask.id,
        teamId: conTeamId,
        category: cat,
        score: conScores[cat] || 0,
        note: conNotes[cat],
      })),
    ];
    saveDraftJudging(selectedTask.id, allScores, comment, bestSpeakerId);
    showToast("info", "草稿已保存，可随时回来继续修改");
  };

  const handleOpenFinalize = (matchId: string) => {
    const matchTasks = allTasks.filter(
      (t) => t.matchId === matchId && t.status === "completed"
    );
    if (matchTasks.length === 0) {
      showToast("info", "当前比赛还没有完成的评审，暂无法汇总");
      return;
    }

    let sumPro = 0;
    let sumCon = 0;
    const bestSpeakerVotes: Record<string, number> = {};
    const comments: string[] = [];

    matchTasks.forEach((t) => {
      let pro = 0;
      let con = 0;
      t.scores.forEach((s) => {
        const catLabel = scoreCategoryLabels[s.category as ScoreCategory];
        const weight = catLabel?.weight ?? 1;
        if (s.teamId === "pro" || s.teamId === proTeamId) pro += s.score * weight;
        else if (s.teamId === "con" || s.teamId === conTeamId) con += s.score * weight;
      });
      if (pro === 0 && con === 0) {
        const half = Math.floor(t.scores.length / 2);
        t.scores.forEach((s, idx) => {
          const weight = scoreCategoryLabels[s.category as ScoreCategory]?.weight ?? 1;
          if (idx < half) pro += s.score * weight;
          else con += s.score * weight;
        });
      }
      sumPro += pro;
      sumCon += con;
      if (t.bestSpeakerId) {
        bestSpeakerVotes[t.bestSpeakerId] = (bestSpeakerVotes[t.bestSpeakerId] || 0) + 1;
      }
      if (t.comment && t.comment.trim().length > 0) {
        comments.push(t.comment.trim().slice(0, 120));
      }
    });

    const avgPro = Math.round(sumPro / matchTasks.length);
    const avgCon = Math.round(sumCon / matchTasks.length);

    let topSpeaker = "";
    let topSpeakerVotes = 0;
    Object.entries(bestSpeakerVotes).forEach(([uid, v]) => {
      if (v > topSpeakerVotes) {
        topSpeakerVotes = v;
        topSpeaker = uid;
      }
    });

    const summary =
      comments.length > 0
        ? `评委综合意见：${comments.join("；")}`
        : `本场共收到 ${matchTasks.length} 位评委的评分`;

    setFinalizeMatchId(matchId);
    setFinalProScore(String(avgPro));
    setFinalConScore(String(avgCon));
    setFinalBestSpeakerId(topSpeaker);
    setFinalSummary(summary);
    setShowFinalizeModal(true);
  };

  const handleConfirmFinalize = () => {
    if (!finalizeMatchId) return;
    const proScore = parseInt(finalProScore, 10);
    const conScore = parseInt(finalConScore, 10);
    if (isNaN(proScore) || isNaN(conScore)) {
      showToast("info", "请输入有效的比分数字");
      return;
    }
    const winner: "pro" | "con" = proScore >= conScore ? "pro" : "con";
    updateMatch(finalizeMatchId, {
      result: {
        winner,
        proScore,
        conScore,
        bestSpeakerId: finalBestSpeakerId,
        summary: finalSummary,
      },
    });
    showToast("success", "评审结果已汇总并同步到赛程");
    setShowFinalizeModal(false);
    setFinalizeMatchId(null);
  };

  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const isCompleted = selectedTask?.status === "completed";

  // 管理员视角：按比赛聚合评委完成进度
  const matchProgress = useMemo(() => {
    if (currentUser?.role !== "admin") return [];
    const map = new Map<string, { match: Match | undefined; tasks: JudgingTask[]; completed: number }>();
    allTasks.forEach((t) => {
      const item = map.get(t.matchId) || {
        match: matches.find((m) => m.id === t.matchId),
        tasks: [],
        completed: 0,
      };
      item.tasks.push(t);
      if (t.status === "completed") item.completed++;
      map.set(t.matchId, item);
    });
    return Array.from(map.values());
  }, [allTasks, matches, currentUser?.role]);

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={cn(
            "fixed top-20 right-6 z-[100] px-5 py-3 rounded-xl shadow-lg animate-fade-in-up flex items-center gap-2",
            toast.type === "success" ? "bg-success text-white" : "bg-primary-600 text-white"
          )}
        >
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 opacity-0 animate-fade-in-up">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-800 flex items-center gap-2">
            <Gavel className="w-7 h-7 text-primary-600" />
            评审中心
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            {currentUser?.role === "admin"
              ? "管理员视图：查看所有评审任务"
              : `欢迎 ${currentUser?.name}，查看分配给你的评审任务`}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="px-4 py-2 rounded-xl bg-amber-100 text-amber-700 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">待评审 {pendingTasks.length}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-green-100 text-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">已完成 {completedTasks.length}</span>
          </div>
        </div>
      </div>

      {/* 管理员：评委完成进度面板 */}
      {currentUser?.role === "admin" && matchProgress.length > 0 && (
        <Card className="p-5 opacity-0 animate-fade-in-up animate-delay-100">
          <h2 className="font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
            <Gavel className="w-5 h-5 text-primary-600" />
            评委完成进度
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {matchProgress.map(({ match, tasks, completed }) => {
              const total = tasks.length;
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
              return (
                <div
                  key={match?.id || Math.random()}
                  className="p-4 rounded-xl bg-cream-50 border border-cream-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-ink-800 line-clamp-1">
                      {match?.title || "未知比赛"}
                    </p>
                    <Badge
                      variant={
                        completed === total
                          ? "success"
                          : completed > 0
                          ? "warning"
                          : "default"
                      }
                    >
                      {completed}/{total}
                    </Badge>
                  </div>
                  <div className="h-2 rounded-full bg-cream-200 overflow-hidden mb-2">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        completed === total
                          ? "bg-success"
                          : completed > 0
                          ? "bg-amber-500"
                          : "bg-ink-300"
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-ink-500">
                    {match ? formatDate(match.date) : ""} · {match?.venue || ""}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tasks.map((t) => {
                      const judge = users.find((u) => u.id === t.judgeId);
                      return (
                        <Badge
                          key={t.id}
                          variant={
                            t.status === "completed"
                              ? "success"
                              : t.status === "in_progress"
                              ? "warning"
                              : "default"
                          }
                          className="!text-[10px] !px-2 !py-0.5"
                        >
                          {judge?.name || "未知评委"}
                          {t.status === "completed" && (
                            <CheckCircle className="w-2.5 h-2.5 ml-1 inline" />
                          )}
                        </Badge>
                      );
                    })}
                  </div>
                  {match && (
                    <Button
                      size="sm"
                      variant={match.result ? "ghost" : "primary"}
                      className="mt-3 w-full !text-xs"
                      disabled={completed === 0}
                      onClick={() => handleOpenFinalize(match.id)}
                    >
                      {match.result ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                          已汇总
                        </>
                      ) : (
                        <>
                          <FileCheck2 className="w-3.5 h-3.5 mr-1.5" />
                          汇总评审结果
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Task List */}
        <div className="lg:col-span-1 space-y-4 opacity-0 animate-fade-in-up animate-delay-100">
          <Card className="p-4">
            <h2 className="font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              评审任务
            </h2>

            {tasks.length === 0 ? (
              <div className="text-center py-8 text-sm text-ink-400">
                <Gavel className="w-10 h-10 mx-auto text-ink-200 mb-2" />
                暂无分配给你的评审任务
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const m = matches.find((x) => x.id === task.matchId);
                  const isSel = selectedTask?.id === task.id;
                  return (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border-2 transition-all",
                        isSel
                          ? "border-primary-500 bg-primary-50 shadow-md"
                          : "border-transparent bg-cream-50 hover:bg-cream-100"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge
                          variant={
                            task.status === "completed"
                              ? "success"
                              : task.status === "in_progress"
                              ? "warning"
                              : "default"
                          }
                        >
                          {judgingStatusLabels[task.status].label}
                        </Badge>
                        {task.status === "completed" && (
                          <Eye className="w-3.5 h-3.5 text-ink-400" />
                        )}
                      </div>
                      <p className="text-sm font-semibold text-ink-800 line-clamp-1">
                        {m?.title}
                      </p>
                      <p className="text-xs text-ink-400 mt-1">
                        {m && formatDate(m.date)} · {m?.venue}
                      </p>
                      {currentUser?.role === "admin" && (
                        <p className="text-[11px] text-primary-600 mt-1.5 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          评委：{users.find((u) => u.id === task.judgeId)?.name || "未知"}
                        </p>
                      )}
                      {task.status === "completed" && task.bestSpeakerId && (
                        <p className="text-[11px] text-accent-600 mt-1.5 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          最佳辩手：{users.find((u) => u.id === task.bestSpeakerId)?.name}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Peer Review */}
          <Card className="p-4">
            <h2 className="font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-primary-600" />
              赛后互评
            </h2>
            <p className="text-xs text-ink-400 mb-4">
              对同场辩手的表现进行评价
            </p>
            <div className="space-y-3">
              {speakers.slice(0, 3).map((speaker) => (
                <div key={speaker.id} className="p-3 rounded-xl bg-cream-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={users.find((u) => u.id === speaker.id)?.avatar}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <p className="text-sm font-medium text-ink-700">
                          {speaker.name}
                        </p>
                        <p className="text-[10px] text-ink-400">{speaker.position}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() =>
                          setPeerReviews((prev) => ({
                            ...prev,
                            [speaker.id]: star,
                          }))
                        }
                        className="p-0.5"
                      >
                        <Star
                          className={cn(
                            "w-4 h-4 transition-colors",
                            (peerReviews[speaker.id] || 0) >= star
                              ? "text-amber-400 fill-amber-400"
                              : "text-ink-200"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <textarea
                value={peerComment}
                onChange={(e) => setPeerComment(e.target.value)}
                placeholder="写下你的评价建议..."
                rows={3}
                className="input resize-none !text-sm"
              />
            </div>
          </Card>
        </div>

        {/* Scoring Panel */}
        <div className="lg:col-span-2 space-y-4 opacity-0 animate-fade-in-up animate-delay-150">
          {selectedTask && match ? (
            <>
              {/* Match Info */}
              <Card className="overflow-hidden">
                <div className="p-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="font-serif text-xl font-bold">{match.title}</h2>
                      <p className="text-primary-200 text-sm mt-1">
                        {formatDate(match.date)} · {match.time} · {match.venue}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="accent" className="!bg-accent-400 !text-primary-900">
                        {match.round}
                      </Badge>
                      {isCompleted && (
                        <Badge variant="success" className="!bg-green-400 !text-green-900">
                          <Eye className="w-3 h-3 mr-1" />
                          已提交
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                    <p className="text-sm">
                      <Quote className="w-3.5 h-3.5 inline mr-1 text-accent-300" />
                      <span className="text-accent-200 font-medium">辩题：</span>
                      {match.topic}
                    </p>
                  </div>
                </div>

                {/* Teams Score Header */}
                <div className="grid grid-cols-2 border-b border-cream-200">
                  <div className="p-4 text-center border-r border-cream-200 bg-gradient-to-r from-red-50 to-transparent">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-victory" />
                      <span className="font-serif font-bold text-victory">正方</span>
                    </div>
                    <p className="text-3xl font-mono font-bold text-ink-800">
                      {proTotal.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-4 text-center bg-gradient-to-l from-blue-50 to-transparent">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-primary-600" />
                      <span className="font-serif font-bold text-primary-700">反方</span>
                    </div>
                    <p className="text-3xl font-mono font-bold text-ink-800">
                      {conTotal.toFixed(1)}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Scoring Categories */}
              <Card className="p-5">
                <h3 className="font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-accent-500" />
                  分项评分
                  {isCompleted && (
                    <Badge variant="default" className="ml-2">
                      只读模式 - 已提交数据
                    </Badge>
                  )}
                </h3>
                <div className="space-y-6">
                  {categories.map((cat) => (
                    <div key={cat} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-ink-700">
                          {scoreCategoryLabels[cat].label}
                        </span>
                        <span className="text-xs text-ink-400">
                          权重 {(scoreCategoryLabels[cat].weight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Pro */}
                        <div className="p-3 rounded-xl bg-red-50/50 border border-red-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-victory">正方</span>
                            <span className="font-mono font-bold text-victory">
                              {proScores[cat] || 0}
                            </span>
                          </div>
                          {!isCompleted ? (
                            <>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={proScores[cat] || 0}
                                onChange={(e) =>
                                  handleScoreChange("pro", cat, parseInt(e.target.value))
                                }
                                className="w-full accent-victory"
                              />
                              <div className="flex gap-1 mt-2">
                                {[60, 70, 80, 90, 100].map((v) => (
                                  <button
                                    key={v}
                                    onClick={() => handleScoreChange("pro", cat, v)}
                                    className={cn(
                                      "flex-1 py-1 text-[10px] rounded transition-colors",
                                      proScores[cat] === v
                                        ? "bg-victory text-white"
                                        : "bg-white text-ink-500 hover:bg-red-100"
                                    )}
                                  >
                                    {v}
                                  </button>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="h-2 rounded-full bg-white overflow-hidden">
                              <div
                                className="h-full bg-victory rounded-full transition-all"
                                style={{ width: `${proScores[cat] || 0}%` }}
                              />
                            </div>
                          )}
                          <input
                            type="text"
                            value={proNotes[cat] || ""}
                            onChange={(e) => handleNoteChange("pro", cat, e.target.value)}
                            placeholder={isCompleted ? "（无评语）" : "评语（可选）"}
                            className={cn(
                              "input !py-1.5 !text-xs mt-2 !bg-white",
                              isCompleted && "!bg-cream-50 !text-ink-600 cursor-default"
                            )}
                            disabled={isCompleted}
                          />
                        </div>
                        {/* Con */}
                        <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-primary-700">反方</span>
                            <span className="font-mono font-bold text-primary-700">
                              {conScores[cat] || 0}
                            </span>
                          </div>
                          {!isCompleted ? (
                            <>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                value={conScores[cat] || 0}
                                onChange={(e) =>
                                  handleScoreChange("con", cat, parseInt(e.target.value))
                                }
                                className="w-full accent-primary-600"
                              />
                              <div className="flex gap-1 mt-2">
                                {[60, 70, 80, 90, 100].map((v) => (
                                  <button
                                    key={v}
                                    onClick={() => handleScoreChange("con", cat, v)}
                                    className={cn(
                                      "flex-1 py-1 text-[10px] rounded transition-colors",
                                      conScores[cat] === v
                                        ? "bg-primary-600 text-white"
                                        : "bg-white text-ink-500 hover:bg-blue-100"
                                    )}
                                  >
                                    {v}
                                  </button>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="h-2 rounded-full bg-white overflow-hidden">
                              <div
                                className="h-full bg-primary-600 rounded-full transition-all"
                                style={{ width: `${conScores[cat] || 0}%` }}
                              />
                            </div>
                          )}
                          <input
                            type="text"
                            value={conNotes[cat] || ""}
                            onChange={(e) => handleNoteChange("con", cat, e.target.value)}
                            placeholder={isCompleted ? "（无评语）" : "评语（可选）"}
                            className={cn(
                              "input !py-1.5 !text-xs mt-2 !bg-white",
                              isCompleted && "!bg-cream-50 !text-ink-600 cursor-default"
                            )}
                            disabled={isCompleted}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Best Speaker & Comment */}
              <Card className="p-5">
                <h3 className="font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent-500" />
                  最佳辩手 & 总评
                </h3>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    评选最佳辩手
                    {isCompleted && bestSpeakerId && (
                      <Badge variant="accent" className="ml-2">
                        已选择
                      </Badge>
                    )}
                  </label>
                  {speakers.length === 0 ? (
                    <p className="text-xs text-ink-400">暂无参赛辩手数据</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {speakers.map((speaker) => {
                        const isSelected = bestSpeakerId === speaker.id;
                        return (
                          <button
                            key={speaker.id + speaker.side}
                            onClick={() =>
                              !isCompleted && setBestSpeakerId(speaker.id)
                            }
                            disabled={isCompleted}
                            className={cn(
                              "p-3 rounded-xl border-2 transition-all text-left",
                              isSelected
                                ? "border-accent-500 bg-accent-50 shadow-md"
                                : "border-cream-200 bg-white hover:border-cream-300",
                              isCompleted && "cursor-default"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <img
                                src={
                                  users.find((u) => u.id === speaker.id)?.avatar
                                }
                                alt=""
                                className="w-7 h-7 rounded-full"
                              />
                              <div className="relative">
                                <Badge
                                  variant={speaker.side === "pro" ? "danger" : "primary"}
                                  className="!text-[9px] !px-1.5 !py-0"
                                >
                                  {speaker.side === "pro" ? "正" : "反"}
                                </Badge>
                                {isSelected && (
                                  <Award className="w-4 h-4 absolute -top-2 -right-2 text-accent-500 fill-accent-200" />
                                )}
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-ink-800 truncate">
                              {speaker.name}
                            </p>
                            <p className="text-[10px] text-ink-400 truncate">
                              {speaker.position}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {isCompleted && !bestSpeakerId && (
                    <p className="text-xs text-ink-400 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      本场未标注最佳辩手
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    评审总评
                  </label>
                  <textarea
                    value={comment || ""}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                      isCompleted
                        ? "（本场无总评）"
                        : "请写下你对本场比赛的整体评价，包括双方的亮点、不足以及建议..."
                    }
                    rows={5}
                    className={cn(
                      "input resize-none",
                      isCompleted && "!bg-cream-50 !text-ink-700 cursor-default"
                    )}
                    disabled={isCompleted}
                  />
                  {isCompleted && selectedTask.submittedAt && (
                    <p className="text-xs text-ink-400 mt-2 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      评审于 {formatDate(selectedTask.submittedAt)} 提交
                    </p>
                  )}
                </div>

                {!isCompleted ? (
                  <div className="flex gap-3 mt-6 pt-5 border-t border-cream-200">
                    <Button variant="ghost" className="flex-1" onClick={handleSaveDraft}>
                      <Clock className="w-4 h-4 mr-1.5" />
                      保存草稿
                    </Button>
                    <Button
                      variant="accent"
                      className="flex-1"
                      onClick={handleSubmit}
                      disabled={!bestSpeakerId}
                    >
                      <Send className="w-4 h-4 mr-1.5" />
                      提交评审
                    </Button>
                  </div>
                ) : (
                  <div className="mt-6 pt-5 border-t border-cream-200 text-center">
                    <Badge variant="success" className="!px-4 !py-1.5 !text-xs">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      评审已提交，感谢你的认真工作
                    </Badge>
                  </div>
                )}
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center">
              <Gavel className="w-16 h-16 mx-auto text-ink-200 mb-4" />
              <p className="text-ink-400 font-medium">请从左侧选择一项评审任务</p>
              <p className="text-sm text-ink-300 mt-1">
                你有 {pendingTasks.length} 场比赛等待评审
              </p>
            </Card>
          )}
        </div>
      </div>

      {showFinalizeModal && finalizeMatchId && (
        <Modal
          open={showFinalizeModal}
          onClose={() => setShowFinalizeModal(false)}
          title="汇总评审结果"
        >
          <div className="space-y-5">
            <p className="text-sm text-ink-500">
              以下结果基于所有已完成评委的打分自动汇总，可手动调整后确认同步到赛程。
            </p>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-cream-50 to-primary-500/5 border border-cream-200">
              <div className="grid grid-cols-3 items-center gap-2">
                <div className="text-center">
                  <p className="text-[11px] text-ink-400 mb-1">正方均分</p>
                  <input
                    type="number"
                    value={finalProScore}
                    onChange={(e) => setFinalProScore(e.target.value)}
                    className="w-full text-center text-3xl font-mono font-bold text-victory bg-white border border-cream-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-victory/30"
                  />
                </div>
                <div className="text-center text-2xl text-ink-300 font-mono">VS</div>
                <div className="text-center">
                  <p className="text-[11px] text-ink-400 mb-1">反方均分</p>
                  <input
                    type="number"
                    value={finalConScore}
                    onChange={(e) => setFinalConScore(e.target.value)}
                    className="w-full text-center text-3xl font-mono font-bold text-primary-700 bg-white border border-cream-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                  />
                </div>
              </div>
              <div className="mt-4 text-center">
                <Badge variant={(parseInt(finalProScore, 10) >= parseInt(finalConScore, 10)) ? "success" : "primary"} className="!px-4 !py-1 !text-xs">
                  {parseInt(finalProScore, 10) >= parseInt(finalConScore, 10)
                    ? "正方获胜（预计）"
                    : "反方获胜（预计）"}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-ink-700 mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-accent-600" />
                全场最佳辩手
              </p>
              <select
                value={finalBestSpeakerId}
                onChange={(e) => setFinalBestSpeakerId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-cream-300 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              >
                <option value="">（暂不指定）</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-sm font-semibold text-ink-700 mb-2 flex items-center gap-1.5">
                <Quote className="w-4 h-4 text-primary-600" />
                赛后总结评语
              </p>
              <textarea
                value={finalSummary}
                onChange={(e) => setFinalSummary(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-white border border-cream-300 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
                placeholder="一句话总结本场比赛的整体表现、亮点和建议..."
              />
            </div>

            <div className="flex gap-3 pt-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowFinalizeModal(false)}>
                取消
              </Button>
              <Button variant="accent" className="flex-1" onClick={handleConfirmFinalize}>
                <Sparkles className="w-4 h-4 mr-1.5" />
                确认并同步到赛程
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
