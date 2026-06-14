import { useState } from "react";
import {
  BookOpen,
  Search,
  Heart,
  Download,
  Eye,
  Play,
  Share2,
  ThumbsUp,
  MessageCircle,
  FileText,
  Video,
  Mic2,
  Lightbulb,
  Filter,
  ChevronRight,
  Star,
  Clock,
  User,
  Tag,
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { useResourceStore } from "../store/useResourceStore";
import { useUserStore } from "../store/useUserStore";
import { formatRelativeTime, formatDate } from "../utils";
import type { ResourceType } from "../types";

type TabType = "all" | ResourceType;

export default function Resources() {
  const resources = useResourceStore((s) => s.resources);
  const speechClips = useResourceStore((s) => s.speechClips);
  const toggleFavorite = useResourceStore((s) => s.toggleFavorite);
  const likeSpeech = useResourceStore((s) => s.likeSpeech);
  const incrementViews = useResourceStore((s) => s.incrementViews);
  const users = useUserStore((s) => s.users);

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: "all", label: "全部", icon: BookOpen },
    { id: "topic", label: "辩题卡", icon: Lightbulb },
    { id: "template", label: "立论模板", icon: FileText },
    { id: "video", label: "训练录像", icon: Video },
    { id: "speech", label: "精彩发言", icon: Mic2 },
  ];

  const categories = [
    "科技发展",
    "人生选择",
    "社会政策",
    "价值伦理",
    "立论模板",
    "攻辩技巧",
    "比赛录像",
    "训练教程",
  ];

  const filteredResources = resources.filter((r) => {
    if (activeTab !== "all" && r.type !== activeTab) return false;
    if (selectedCategory && r.category !== selectedCategory) return false;
    if (searchQuery) {
      return (
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return true;
  });

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case "topic":
        return Lightbulb;
      case "template":
        return FileText;
      case "video":
        return Video;
      case "speech":
        return Mic2;
    }
  };

  const getResourceColor = (type: ResourceType) => {
    switch (type) {
      case "topic":
        return "bg-purple-100 text-purple-600";
      case "template":
        return "bg-blue-100 text-blue-600";
      case "video":
        return "bg-green-100 text-green-600";
      case "speech":
        return "bg-amber-100 text-amber-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 opacity-0 animate-fade-in-up">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-800 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary-600" />
            资料库
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            辩题卡、立论模板、训练录像、精彩发言
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索资料..."
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-cream-300 shadow-card w-fit overflow-x-auto opacity-0 animate-fade-in-up animate-delay-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
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

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Categories */}
        <div className="lg:col-span-1 space-y-4 opacity-0 animate-fade-in-up animate-delay-150">
          <Card className="p-5">
            <h3 className="font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary-600" />
              分类筛选
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !selectedCategory
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "text-ink-600 hover:bg-cream-100"
                }`}
              >
                全部分类
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                    selectedCategory === cat
                      ? "bg-primary-50 text-primary-700 font-medium"
                      : "text-ink-600 hover:bg-cream-100"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" />
                    {cat}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                </button>
              ))}
            </div>
          </Card>

          {/* Featured Speech Clips */}
          {(activeTab === "all" || activeTab === "speech") && (
            <Card className="p-5">
              <h3 className="font-serif font-bold text-ink-800 mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-accent-500 fill-accent-200" />
                热门精彩发言
              </h3>
              <div className="space-y-3">
                {speechClips.slice(0, 3).map((clip) => {
                  const user = users.find((u) => u.id === clip.userId);
                  return (
                    <div
                      key={clip.id}
                      className="p-3 rounded-xl bg-cream-50 border border-cream-200 hover:border-cream-300 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={user?.avatar}
                            alt=""
                            className="w-7 h-7 rounded-full"
                          />
                          <div>
                            <p className="text-xs font-medium text-ink-700">
                              {user?.name}
                            </p>
                            <p className="text-[10px] text-ink-400">
                              {formatRelativeTime(clip.createdAt)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => likeSpeech(clip.id)}
                          className={`p-1 rounded-full transition-colors ${
                            clip.likedByMe
                              ? "text-victory bg-victory/10"
                              : "text-ink-300 hover:text-victory hover:bg-victory/5"
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-ink-600 line-clamp-3 leading-relaxed italic">
                        "{clip.content}"
                      </p>
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-cream-200/50">
                        <span className="text-[10px] text-ink-400 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {clip.likes}
                        </span>
                        <span className="text-[10px] text-ink-400 flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {clip.commentsCount}
                        </span>
                        <span className="text-[10px] text-ink-400 flex items-center gap-1 ml-auto">
                          <Share2 className="w-3 h-3" />
                          分享
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Resources Grid */}
        <div className="lg:col-span-3 space-y-4 opacity-0 animate-fade-in-up animate-delay-200">
          {/* View Toggle & Stats */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-400">
              共找到 <span className="font-semibold text-ink-700">{filteredResources.length}</span> 份资料
            </p>
            <div className="flex gap-1 p-1 rounded-lg bg-cream-100">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "grid" ? "bg-white shadow-sm" : "text-ink-400"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "list" ? "bg-white shadow-sm" : "text-ink-400"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredResources.map((resource, idx) => {
                const Icon = getResourceIcon(resource.type);
                return (
                  <Card
                    key={resource.id}
                    hover
                    className={`overflow-hidden opacity-0 animate-fade-in-up animate-delay-${100 + idx * 30}`}
                    onClick={() => incrementViews(resource.id)}
                  >
                    {/* Cover */}
                    <div
                      className={`h-32 relative flex items-center justify-center ${getResourceColor(
                        resource.type
                      )}`}
                    >
                      <div className="absolute inset-0 bg-grain-overlay opacity-20" />
                      <div className="w-16 h-16 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md">
                        <Icon className="w-8 h-8" />
                      </div>
                      {resource.type === "video" && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                            <Play className="w-6 h-6 ml-1 text-ink-700" />
                          </div>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(resource.id);
                        }}
                        className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
                          resource.favorite
                            ? "bg-white text-victory"
                            : "bg-white/70 text-ink-400 hover:text-victory"
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${resource.favorite ? "fill-current" : ""}`}
                        />
                      </button>
                      <Badge
                        variant={
                          resource.type === "topic"
                            ? "warning"
                            : resource.type === "template"
                            ? "primary"
                            : resource.type === "video"
                            ? "success"
                            : "accent"
                        }
                        className="absolute top-3 left-3 !bg-white/90"
                      >
                        {resource.type === "topic"
                          ? "辩题卡"
                          : resource.type === "template"
                          ? "模板"
                          : resource.type === "video"
                          ? "录像"
                          : "发言"}
                      </Badge>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-serif font-bold text-ink-800 mb-1.5 line-clamp-1">
                        {resource.title}
                      </h3>
                      <p className="text-xs text-ink-400 line-clamp-2 mb-3 min-h-[2rem]">
                        {resource.description}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {resource.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-cream-100 text-ink-500 text-[10px]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-cream-200">
                        <div className="flex items-center gap-2">
                          {resource.authorAvatar ? (
                            <img
                              src={resource.authorAvatar}
                              alt=""
                              className="w-5 h-5 rounded-full"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-cream-200 flex items-center justify-center">
                              <User className="w-3 h-3 text-ink-400" />
                            </div>
                          )}
                          <span className="text-[11px] text-ink-500 truncate max-w-[80px]">
                            {resource.author}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-ink-400">
                          <span className="flex items-center gap-0.5 text-[10px]">
                            <Eye className="w-3.5 h-3.5" />
                            {resource.views}
                          </span>
                          <span className="flex items-center gap-0.5 text-[10px]">
                            <Download className="w-3.5 h-3.5" />
                            {resource.downloads}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredResources.map((resource, idx) => {
                const Icon = getResourceIcon(resource.type);
                return (
                  <Card
                    key={resource.id}
                    hover
                    className={`p-4 opacity-0 animate-fade-in-up animate-delay-${100 + idx * 30}`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${getResourceColor(
                          resource.type
                        )}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-serif font-bold text-ink-800 truncate">
                                {resource.title}
                              </h3>
                              <Badge
                                variant={
                                  resource.type === "topic"
                                    ? "warning"
                                    : resource.type === "template"
                                    ? "primary"
                                    : resource.type === "video"
                                    ? "success"
                                    : "accent"
                                }
                                className="!text-[10px] !py-0"
                              >
                                {resource.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-ink-500 line-clamp-1">
                              {resource.description}
                            </p>
                          </div>
                          <button
                            onClick={() => toggleFavorite(resource.id)}
                            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                              resource.favorite
                                ? "bg-red-50 text-victory"
                                : "text-ink-300 hover:text-victory hover:bg-red-50"
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${resource.favorite ? "fill-current" : ""}`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-4 text-xs text-ink-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDate(resource.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              {resource.views} 次浏览
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="w-3.5 h-3.5" />
                              {resource.downloads} 次下载
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              预览
                            </Button>
                            <Button variant="primary" size="sm">
                              <Download className="w-3.5 h-3.5 mr-1" />
                              下载
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {filteredResources.length === 0 && (
            <Card className="p-12 text-center">
              <Search className="w-16 h-16 mx-auto text-ink-200 mb-4" />
              <p className="text-ink-400 font-medium">未找到相关资料</p>
              <p className="text-sm text-ink-300 mt-1">
                试试调整筛选条件或搜索关键词
              </p>
            </Card>
          )}

          {/* Upload Speech Section */}
          {(activeTab === "all" || activeTab === "speech") && (
            <Card className="p-6 mt-8 bg-gradient-to-r from-accent-50 to-cream-50 border-accent-200">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Mic2 className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-lg font-bold text-ink-800">
                    分享你的精彩发言
                  </h3>
                  <p className="text-sm text-ink-500 mt-1">
                    把比赛中的精彩片段上传到资料库，和大家一起学习交流，还能获得点赞和评论哦！
                  </p>
                </div>
                <Button variant="accent" size="lg">
                  <Share2 className="w-4 h-4 mr-1.5" />
                  上传发言
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
