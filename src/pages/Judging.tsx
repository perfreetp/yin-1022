import { useState } from "react";
import {
  Gavel,
  Star,
  MessageSquare,
  Award,
  CheckCircle,
  Clock,
  Send,
  User,
  Users,
  Quote,
  ChevronRight,
  ThumbsUp,
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { useMatchStore } from "../store/useMatchStore";
import { useUserStore } from "../store/useUserStore";
import { judgingStatusLabels, scoreCategoryLabels, formatDate } from "../utils";
import type { JudgingTask, Score } from "../types";

type ScoreCategory = keyof typeof scoreCategoryLabels;

export default function Judging() {
  const currentUser = useUserStore((s) => s.getCurrentUser());
  const users = useUserStore((s) => s.users);
  const matches = useMatchStore((s) => s.matches);
  const submitJudging = useMatchStore((s) => s.submitJudging);
  const tasks = useMatchStore((s) =>
    s.judgingTasks.filter((t) => t.judgeId === currentUser?.id || currentUser?.role === "judge")
  );

  const [selectedTask, setSelectedTask] = useState<JudgingTask | null>(tasks.find(t => t.status !== "completed") || null);
  const [proScores, setProScores] = useState<Record<string, number>>({});
  const [conScores, setConScores] = useState<Record<string, number>>({});
  const [proNotes, setProNotes] = useState<Record<string, string>>({});
  const [conNotes, setConNotes] = useState<Record<string, string>>({});
  const [comment, setComment] = useState("");
  const [bestSpeakerId, setBestSpeakerId] = useState("");
  const [peerReviews, setPeerReviews] = useState<Record<string, number>>({});
  const [peerComment, setPeerComment] = useState("");

  const match = selectedTask
    ? matches.find((m) => m.id === selectedTask.matchId)
    : null;

  const categories: ScoreCategory[] = [
    "opening_statement",
    "cross_examination",
    "free_debate",
    "closing_statement",
  ];

  const calcTotal = (scores: Record<string, number>) => {
    return categories.reduce((sum, cat) => {
      const weight = scoreCategoryLabels[cat].weight;
      return sum + (scores[cat] || 0) * weight / 100 * 100;
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
    const allScores: Score[] = [
      ...categories.map((cat) => ({
        id: `s-pro-${cat}`,
        taskId: selectedTask.id,
        teamId: "pro",
        category: cat,
        score: proScores[cat] || 0,
        note: proNotes[cat],
      })),
      ...categories.map((cat) => ({
        id: `s-con-${cat}`,
        taskId: selectedTask.id,
        teamId: "con",
        category: cat,
        score: conScores[cat] || 0,
        note: conNotes[cat],
      })),
    ];
    submitJudging(selectedTask.id, allScores, comment, bestSpeakerId);
    setSelectedTask(null);
  };

  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const speakers = [
    { id: "u001", name: "张子墨", position: "二辩" },
    { id: "u002", name: "李思源", position: "一辩/四辩" },
    { id: "u004", name: "陈浩然", position: "三辩" },
    { id: "u005", name: "刘雅婷", position: "二辩/四辩" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 opacity-0 animate-fade-in-up">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-800 flex items-center gap-2">
            <Gavel className="w-7 h-7 text-primary-600" />
            评审中心
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            在线打分、撰写评语、评选最佳辩手
          </p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-xl bg-amber-100 text-amber-700">
            <Clock className="w-4 h-4 inline mr-1.5" />
            <span className="text-sm font-medium">待评审 {pendingTasks.length}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-green-100 text-green-700">
            <CheckCircle className="w-4 h-4 inline mr-1.5" />
            <span className="text-sm font-medium">已完成 {completedTasks.length}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Task List */}
        <div className="lg:col-span-1 space-y-4 opacity-0 animate-fade-in-up animate-delay-100">
          <Card className="p-4">
            <h2 className="font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              评审任务
            </h2>
            <div className="space-y-2">
              {tasks.map((task) => {
                const m = matches.find((x) => x.id === task.matchId);
                return (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      selectedTask?.id === task.id
                        ? "border-primary-500 bg-primary-50 shadow-md"
                        : "border-transparent bg-cream-50 hover:bg-cream-100"
                    }`}
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
                    </div>
                    <p className="text-sm font-semibold text-ink-800 line-clamp-1">
                      {m?.title}
                    </p>
                    <p className="text-xs text-ink-400 mt-1">
                      {m && formatDate(m.date)} · {m?.venue}
                    </p>
                  </button>
                );
              })}
            </div>
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
                          className={`w-4 h-4 ${
                            (peerReviews[speaker.id] || 0) >= star
                              ? "text-amber-400 fill-amber-400"
                              : "text-ink-200"
                          }`}
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-serif text-xl font-bold">{match.title}</h2>
                      <p className="text-primary-200 text-sm mt-1">
                        {formatDate(match.date)} · {match.time} · {match.venue}
                      </p>
                    </div>
                    <Badge variant="accent" className="!bg-accent-400 !text-primary-900">
                      {match.round}
                    </Badge>
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
                          {selectedTask.status !== "completed" ? (
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
                                    className={`flex-1 py-1 text-[10px] rounded transition-colors ${
                                      proScores[cat] === v
                                        ? "bg-victory text-white"
                                        : "bg-white text-ink-500 hover:bg-red-100"
                                    }`}
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
                            placeholder="评语（可选）"
                            className="input !py-1.5 !text-xs mt-2 !bg-white"
                            disabled={selectedTask.status === "completed"}
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
                          {selectedTask.status !== "completed" ? (
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
                                    className={`flex-1 py-1 text-[10px] rounded transition-colors ${
                                      conScores[cat] === v
                                        ? "bg-primary-600 text-white"
                                        : "bg-white text-ink-500 hover:bg-blue-100"
                                    }`}
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
                            placeholder="评语（可选）"
                            className="input !py-1.5 !text-xs mt-2 !bg-white"
                            disabled={selectedTask.status === "completed"}
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
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {speakers.map((speaker) => (
                      <button
                        key={speaker.id}
                        onClick={() =>
                          selectedTask.status !== "completed" &&
                          setBestSpeakerId(speaker.id)
                        }
                        disabled={selectedTask.status === "completed"}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          bestSpeakerId === speaker.id
                            ? "border-accent-500 bg-accent-50 shadow-md"
                            : "border-cream-200 bg-white hover:border-cream-300"
                        } ${selectedTask.status === "completed" && "cursor-default"}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <img
                            src={users.find((u) => u.id === speaker.id)?.avatar}
                            alt=""
                            className="w-7 h-7 rounded-full"
                          />
                          <div className="relative">
                            {bestSpeakerId === speaker.id && (
                              <Award className="w-4 h-4 absolute -top-2 -right-2 text-accent-500 fill-accent-200" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-ink-800">
                          {speaker.name}
                        </p>
                        <p className="text-[10px] text-ink-400">{speaker.position}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    评审总评
                  </label>
                  <textarea
                    value={comment || selectedTask.comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="请写下你对本场比赛的整体评价，包括双方的亮点、不足以及建议..."
                    rows={5}
                    className="input resize-none"
                    disabled={selectedTask.status === "completed"}
                  />
                  {selectedTask.status === "completed" && (
                    <p className="text-xs text-ink-400 mt-2">
                      本场评审已于 {selectedTask.submittedAt && formatDate(selectedTask.submittedAt)} 提交
                    </p>
                  )}
                </div>

                {selectedTask.status !== "completed" && (
                  <div className="flex gap-3 mt-6 pt-5 border-t border-cream-200">
                    <Button variant="ghost" className="flex-1">
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
    </div>
  );
}
