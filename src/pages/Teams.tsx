import { useState } from "react";
import {
  Users,
  Plus,
  Swords,
  Crown,
  UserPlus,
  UserMinus,
  Check,
  X,
  Archive,
  Trash2,
  Search,
  Filter,
  Shuffle,
  AlertCircle,
  ArrowLeftRight,
  Send,
  UserCheck,
  Loader2,
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { useTeamStore } from "../store/useTeamStore";
import { useUserStore } from "../store/useUserStore";
import { teamStatusLabels, positionLabels, generateId, cn } from "../utils";
import type { Team, DebatePosition, TeamMember } from "../types";

type FilterType = "all" | "recruiting" | "my";

export default function Teams() {
  const teams = useTeamStore((s) => s.teams);
  const teamMembers = useTeamStore((s) => s.teamMembers);
  const users = useUserStore((s) => s.users);
  const currentUserId = useUserStore((s) => s.currentUserId);
  const createTeam = useTeamStore((s) => s.createTeam);
  const updateMember = useTeamStore((s) => s.updateMember);
  const removeMember = useTeamStore((s) => s.removeMember);
  const addMember = useTeamStore((s) => s.addMember);
  const archiveTeam = useTeamStore((s) => s.archiveTeam);
  const disbandTeam = useTeamStore((s) => s.disbandTeam);
  const swapMembers = useTeamStore((s) => s.swapMembers);
  const updateTeam = useTeamStore((s) => s.updateTeam);

  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState({ name: "", description: "", season: "2025春季赛" });

  // 邀请成员弹窗
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTeamId, setInviteTeamId] = useState<string | null>(null);
  const [inviteSearch, setInviteSearch] = useState("");
  const [selectedInviteUser, setSelectedInviteUser] = useState<string | null>(null);
  const [invitePosition, setInvitePosition] = useState<DebatePosition | null>(null);
  const [inviteIsSub, setInviteIsSub] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  // 申请加入弹窗
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyTeamId, setApplyTeamId] = useState<string | null>(null);
  const [applyPosition, setApplyPosition] = useState<DebatePosition | null>(null);
  const [applyIsSub, setApplyIsSub] = useState(false);

  // 临时调人弹窗
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapTeamId, setSwapTeamId] = useState<string | null>(null);
  const [swapFormalId, setSwapFormalId] = useState<string | null>(null);
  const [swapSubId, setSwapSubId] = useState<string | null>(null);

  // 全局提示
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  const filteredTeams = teams.filter((t) => {
    if (t.archived && filter !== "all") return false;
    if (filter === "recruiting") return t.status === "recruiting";
    if (filter === "my") {
      return teamMembers.some(
        (m) => m.teamId === t.id && m.userId === currentUserId
      );
    }
    if (searchQuery) {
      return t.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const getTeamMembers = (teamId: string) => {
    return teamMembers.filter((m) => m.teamId === teamId);
  };

  const getUser = (userId: string) => users.find((u) => u.id === userId);

  const isUserInTeam = (teamId: string, userId: string, includeRejected = false) => {
    return teamMembers.some(
      (m) =>
        m.teamId === teamId &&
        m.userId === userId &&
        (includeRejected || m.status !== "rejected")
    );
  };

  // 自动更新队伍状态
  const recalcTeamStatus = (teamId: string) => {
    const members = getTeamMembers(teamId);
    const confirmedFormal = members.filter(
      (m) => m.status === "confirmed" && !m.isSubstitute
    );
    const team = teams.find((t) => t.id === teamId);
    if (!team || team.archived) return;
    if (confirmedFormal.length >= 4) {
      updateTeam(teamId, { status: "full" });
    } else {
      updateTeam(teamId, { status: "recruiting" });
    }
  };

  // 处理创建队伍
  const handleCreateTeam = () => {
    if (!newTeam.name.trim()) return;
    const teamId = generateId("t");
    const team: Team = {
      id: teamId,
      name: newTeam.name,
      description: newTeam.description,
      season: newTeam.season,
      status: "recruiting",
      captainId: currentUserId,
      createdAt: new Date().toISOString(),
      archived: false,
      avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${Date.now()}`,
    };
    const captainMember: TeamMember = {
      id: generateId("tm"),
      teamId,
      userId: currentUserId,
      position: null,
      status: "confirmed",
      isSubstitute: false,
      joinedAt: new Date().toISOString(),
    };
    createTeam(team, [captainMember]);
    setShowCreateModal(false);
    setNewTeam({ name: "", description: "", season: "2025春季赛" });
    showToast("success", "队伍创建成功！快去邀请队员吧");
  };

  // 处理成员操作
  const handleMemberAction = (memberId: string, action: "confirm" | "reject" | "remove") => {
    const member = teamMembers.find((m) => m.id === memberId);
    if (!member) return;
    if (action === "confirm") {
      updateMember(memberId, { status: "confirmed" });
      recalcTeamStatus(member.teamId);
      showToast("success", "已通过申请/确认加入");
    } else if (action === "reject") {
      updateMember(memberId, { status: "rejected" });
      showToast("info", "已拒绝");
    } else {
      removeMember(memberId);
      recalcTeamStatus(member.teamId);
      showToast("info", "已移除成员");
    }
  };

  // 邀请成员
  const handleInvite = () => {
    if (!inviteTeamId || !selectedInviteUser) return;
    setInviteLoading(true);
    setTimeout(() => {
      addMember(inviteTeamId, {
        id: generateId("tm"),
        teamId: inviteTeamId,
        userId: selectedInviteUser,
        position: invitePosition,
        status: "invited",
        isSubstitute: inviteIsSub,
        joinedAt: new Date().toISOString(),
      });
      setInviteLoading(false);
      setShowInviteModal(false);
      setSelectedInviteUser(null);
      setInvitePosition(null);
      setInviteIsSub(false);
      setInviteSearch("");
      showToast("success", "邀请已发送");
    }, 400);
  };

  // 申请加入
  const handleApply = () => {
    if (!applyTeamId) return;
    if (isUserInTeam(applyTeamId, currentUserId)) {
      showToast("error", "你已经在这支队伍中了");
      return;
    }
    addMember(applyTeamId, {
      id: generateId("tm"),
      teamId: applyTeamId,
      userId: currentUserId,
      position: applyPosition,
      status: "applied",
      isSubstitute: applyIsSub,
      joinedAt: new Date().toISOString(),
    });
    setShowApplyModal(false);
    setApplyPosition(null);
    setApplyIsSub(false);
    showToast("success", "申请已提交，等待队长审核");
  };

  // 点击加入申请按钮
  const openApplyModal = (teamId: string) => {
    if (isUserInTeam(teamId, currentUserId)) {
      showToast("error", "你已经在这支队伍中或等待审核中");
      return;
    }
    setApplyTeamId(teamId);
    setShowApplyModal(true);
  };

  // 点击邀请成员
  const openInviteModal = (teamId: string) => {
    setInviteTeamId(teamId);
    setShowInviteModal(true);
  };

  // 临时调人
  const openSwapModal = (teamId: string) => {
    const members = getTeamMembers(teamId).filter((m) => m.status === "confirmed");
    if (members.filter((m) => m.isSubstitute).length === 0) {
      showToast("error", "这支队伍还没有替补队员");
      return;
    }
    setSwapTeamId(teamId);
    setSwapFormalId(null);
    setSwapSubId(null);
    setShowSwapModal(true);
  };

  const handleSwap = () => {
    if (!swapTeamId || !swapFormalId || !swapSubId) return;
    swapMembers(swapTeamId, swapFormalId, swapSubId);
    setShowSwapModal(false);
    showToast("success", "已完成正式队员与替补的互换");
  };

  // 可选的邀请用户列表
  const availableUsers = inviteTeamId
    ? users.filter((u) => {
        if (u.id === currentUserId) return false;
        if (isUserInTeam(inviteTeamId, u.id)) return false;
        if (inviteSearch && !u.name.includes(inviteSearch)) return false;
        return true;
      })
    : [];

  return (
    <div className="space-y-6">
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
          {toast.type === "info" && <UserCheck className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 opacity-0 animate-fade-in-up">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-800 flex items-center gap-2">
            <Swords className="w-7 h-7 text-primary-600" />
            队伍管理
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            创建队伍、招募队友、管理阵容
          </p>
        </div>
        <Button variant="accent" size="lg" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          创建新队伍
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 opacity-0 animate-fade-in-up animate-delay-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索队伍名称..."
              className="input pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Filter className="w-5 h-5 text-ink-400 hidden sm:block my-auto mr-1" />
            {[
              { id: "all" as FilterType, label: "全部" },
              { id: "recruiting" as FilterType, label: "招募中" },
              { id: "my" as FilterType, label: "我的队伍" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f.id
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-cream-100 text-ink-600 hover:bg-cream-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Teams Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTeams.map((team, idx) => {
          const members = getTeamMembers(team.id);
          const captain = getUser(team.captainId);
          const confirmedFormal = members.filter(
            (m) => m.status === "confirmed" && !m.isSubstitute
          );
          const confirmedSubs = members.filter(
            (m) => m.status === "confirmed" && m.isSubstitute
          );
          const invites = members.filter((m) => m.status === "invited");
          const applications = members.filter((m) => m.status === "applied");
          const isCaptain = team.captainId === currentUserId;
          const myMembership = members.find(
            (m) => m.userId === currentUserId && m.status !== "rejected"
          );

          return (
            <Card
              key={team.id}
              hover
              className={`overflow-hidden opacity-0 animate-fade-in-up animate-delay-${100 + idx * 50}`}
              onClick={() => setSelectedTeam(team)}
            >
              <div className="h-2 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                      <img
                        src={team.avatar}
                        alt=""
                        className="w-8 h-8"
                      />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-ink-800">
                        {team.name}
                      </h3>
                      <p className="text-xs text-ink-400">{team.season}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={
                        team.status === "recruiting"
                          ? "success"
                          : team.status === "confirmed"
                          ? "primary"
                          : team.status === "archived"
                          ? "default"
                          : "warning"
                      }
                    >
                      {teamStatusLabels[team.status].label}
                    </Badge>
                    {(invites.length > 0 || applications.length > 0) && (
                      <div className="flex gap-1">
                        {invites.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                            {invites.length}邀请
                          </span>
                        )}
                        {applications.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                            {applications.length}申请
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-ink-500 line-clamp-2 mb-4 min-h-[2.5rem]">
                  {team.description}
                </p>

                {/* Captain */}
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-cream-200">
                  <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center">
                    <Crown className="w-3.5 h-3.5 text-accent-600" />
                  </div>
                  <img
                    src={captain?.avatar}
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-xs text-ink-600 font-medium">
                    {captain?.name}
                  </span>
                  <span className="text-xs text-ink-400">（队长）</span>
                </div>

                {/* Members */}
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {confirmedFormal.slice(0, 4).map((m) => {
                      const user = getUser(m.userId);
                      return (
                        <img
                          key={m.id}
                          src={user?.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full border-2 border-white"
                          title={`${user?.name}${m.position ? "（" + positionLabels[m.position] + "）" : ""}`}
                        />
                      );
                    })}
                    {confirmedFormal.length > 4 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-cream-200 flex items-center justify-center text-[10px] font-medium text-ink-500">
                        +{confirmedFormal.length - 4}
                      </div>
                    )}
                    {confirmedSubs.slice(0, 2).map((m) => {
                      const user = getUser(m.userId);
                      return (
                        <img
                          key={m.id}
                          src={user?.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full border-2 border-dashed border-ink-300 opacity-70"
                          title={`${user?.name}（替补）`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-ink-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {confirmedFormal.length}/4
                      {confirmedSubs.length > 0 && ` +${confirmedSubs.length}替补`}
                    </span>
                  </div>
                </div>

                {/* 我的状态标签 */}
                {myMembership && !isCaptain && (
                  <div className="mt-3 pt-3 border-t border-cream-100">
                    <Badge
                      variant={
                        myMembership.status === "confirmed"
                          ? "success"
                          : myMembership.status === "invited"
                          ? "primary"
                          : "warning"
                      }
                      className="w-full justify-center !rounded-lg !py-1"
                    >
                      {myMembership.status === "confirmed" && "我是队员"}
                      {myMembership.status === "invited" && "等待我确认邀请"}
                      {myMembership.status === "applied" && "等待队长审核申请"}
                    </Badge>
                  </div>
                )}

                {/* Action buttons */}
                {!team.archived && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-cream-200">
                    {team.status === "recruiting" && !isCaptain && !myMembership && (
                      <Button
                        variant="accent"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e?.stopPropagation?.();
                          openApplyModal(team.id);
                        }}
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1" />
                        申请加入
                      </Button>
                    )}
                    {team.status === "recruiting" && !isCaptain && myMembership?.status === "invited" && (
                      <>
                        <Button
                          variant="accent"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e?.stopPropagation?.();
                            handleMemberAction(myMembership.id, "confirm");
                          }}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          接受邀请
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e?.stopPropagation?.();
                            handleMemberAction(myMembership.id, "reject");
                          }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                    {isCaptain && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e?.stopPropagation?.();
                            openInviteModal(team.id);
                          }}
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1" />
                          邀请成员
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e?.stopPropagation?.();
                            archiveTeam(team.id);
                            showToast("info", "队伍已归档");
                          }}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create Team Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建新队伍"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">
              队伍名称 *
            </label>
            <input
              type="text"
              value={newTeam.name}
              onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
              placeholder="给自己的队伍起个响亮的名字"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">
              参赛赛季
            </label>
            <select
              value={newTeam.season}
              onChange={(e) => setNewTeam({ ...newTeam, season: e.target.value })}
              className="input"
            >
              <option>2025春季赛</option>
              <option>2025新生杯</option>
              <option>2025精英邀请赛</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">
              队伍介绍
            </label>
            <textarea
              value={newTeam.description}
              onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
              placeholder="介绍一下队伍的风格、招募要求等..."
              rows={4}
              className="input resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setShowCreateModal(false)}
            >
              取消
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreateTeam}
              disabled={!newTeam.name.trim()}
            >
              创建队伍
            </Button>
          </div>
        </div>
      </Modal>

      {/* Team Detail Modal */}
      <Modal
        open={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
        title={selectedTeam?.name}
        className="max-w-2xl"
      >
        {selectedTeam && (() => {
          const detailMembers = getTeamMembers(selectedTeam.id);
          const applied = detailMembers.filter((m) => m.status === "applied");
          const invited = detailMembers.filter((m) => m.status === "invited");
          const confirmed = detailMembers.filter((m) => m.status === "confirmed");
          const rejected = detailMembers.filter((m) => m.status === "rejected");
          const isDetailCaptain = selectedTeam.captainId === currentUserId;
          const myDetailMembership = detailMembers.find(
            (m) => m.userId === currentUserId
          );

          return (
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={
                        selectedTeam.status === "recruiting"
                          ? "success"
                          : selectedTeam.status === "confirmed"
                          ? "primary"
                          : selectedTeam.status === "archived"
                          ? "default"
                          : "warning"
                      }
                    >
                      {teamStatusLabels[selectedTeam.status].label}
                    </Badge>
                    <Badge variant="accent">{selectedTeam.season}</Badge>
                  </div>
                  <p className="text-sm text-ink-500 mt-2">{selectedTeam.description}</p>
                </div>
              </div>

              {/* 我收到的邀请 */}
              {myDetailMembership?.status === "invited" && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <Send className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">你收到了这支队伍的邀请</p>
                      <p className="text-xs text-blue-600 mt-0.5">
                        位置：{myDetailMembership.position ? positionLabels[myDetailMembership.position] : "待安排"}
                        {myDetailMembership.isSubstitute && "（替补）"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="accent" onClick={() => {
                      handleMemberAction(myDetailMembership.id, "confirm");
                    }}>
                      <Check className="w-4 h-4 mr-1" />接受
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      handleMemberAction(myDetailMembership.id, "reject");
                    }}>
                      <X className="w-4 h-4 mr-1" />拒绝
                    </Button>
                  </div>
                </div>
              )}

              {/* 申请列表（队长可见） */}
              {isDetailCaptain && applied.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-600" />
                    待审核申请 ({applied.length})
                  </h4>
                  <div className="space-y-2">
                    {applied.map((member) => {
                      const user = getUser(member.userId);
                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200"
                        >
                          <div className="flex items-center gap-3">
                            <img src={user?.avatar} alt="" className="w-10 h-10 rounded-full" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-ink-800">{user?.name}</p>
                                {member.isSubstitute && <Badge variant="warning">替补</Badge>}
                                {member.position && (
                                  <Badge variant="primary">{positionLabels[member.position]}</Badge>
                                )}
                              </div>
                              <p className="text-xs text-ink-400">
                                {user?.grade} · {user?.major}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleMemberAction(member.id, "confirm")}
                              className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMemberAction(member.id, "reject")}
                              className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 邀请中（队长可见） */}
              {isDetailCaptain && invited.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-600" />
                    等待对方确认 ({invited.length})
                  </h4>
                  <div className="space-y-2">
                    {invited.filter(m => m.userId !== currentUserId).map((member) => {
                      const user = getUser(member.userId);
                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-100"
                        >
                          <div className="flex items-center gap-3">
                            <img src={user?.avatar} alt="" className="w-10 h-10 rounded-full" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-ink-800">{user?.name}</p>
                                {member.isSubstitute && <Badge variant="warning">替补</Badge>}
                                {member.position && (
                                  <Badge variant="primary">{positionLabels[member.position]}</Badge>
                                )}
                              </div>
                              <p className="text-xs text-blue-500">邀请已发送，等待确认...</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleMemberAction(member.id, "remove")}
                            className="w-8 h-8 rounded-full bg-ink-100 text-ink-500 flex items-center justify-center hover:bg-red-100 hover:text-red-600"
                            title="撤回邀请"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 确认的成员 */}
              <div>
                <h4 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  阵容成员 ({confirmed.length})
                </h4>
                <div className="space-y-2">
                  {confirmed.map((member) => {
                    const user = getUser(member.userId);
                    const isCaptain = selectedTeam.captainId === member.userId;
                    return (
                      <div
                        key={member.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border",
                          member.isSubstitute
                            ? "bg-cream-50 border-dashed border-ink-200"
                            : "bg-white border-cream-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img src={user?.avatar} alt="" className="w-10 h-10 rounded-full" />
                            {isCaptain && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center shadow-sm">
                                <Crown className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-ink-800">{user?.name}</p>
                              {member.isSubstitute && <Badge variant="warning">替补</Badge>}
                              {member.position && (
                                <Badge variant="primary">{positionLabels[member.position]}</Badge>
                              )}
                              {isCaptain && <Badge variant="accent">队长</Badge>}
                            </div>
                            <p className="text-xs text-ink-400">
                              {user?.grade} · {user?.major}
                            </p>
                          </div>
                        </div>
                        {isDetailCaptain && !isCaptain && (
                          <button
                            onClick={() => {
                              if (confirm(`确定要移除 ${user?.name} 吗？`)) {
                                handleMemberAction(member.id, "remove");
                              }
                            }}
                            className="w-8 h-8 rounded-full bg-ink-100 text-ink-500 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
                            title="移除成员"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {confirmed.length === 0 && (
                    <div className="text-center py-8 text-sm text-ink-400">
                      暂无确认成员
                    </div>
                  )}
                </div>
              </div>

              {/* 已拒绝 */}
              {rejected.length > 0 && (
                <div className="pt-4 border-t border-cream-100">
                  <details className="text-xs">
                    <summary className="cursor-pointer text-ink-400 hover:text-ink-600">
                      查看已拒绝（{rejected.length}）
                    </summary>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {rejected.map((m) => (
                        <span key={m.id} className="px-2 py-1 rounded bg-red-50 text-red-500">
                          {getUser(m.userId)?.name}
                        </span>
                      ))}
                    </div>
                  </details>
                </div>
              )}

              {/* 队长操作区 */}
              {isDetailCaptain && !selectedTeam.archived && (
                <div className="pt-4 border-t border-cream-200 flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => openInviteModal(selectedTeam.id)}
                  >
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    继续邀请成员
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => openSwapModal(selectedTeam.id)}
                  >
                    <ArrowLeftRight className="w-4 h-4 mr-1.5" />
                    临时调人（替补互换）
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (confirm("确定要解散这支队伍吗？此操作不可撤销。")) {
                        disbandTeam(selectedTeam.id);
                        setSelectedTeam(null);
                        showToast("info", "队伍已解散");
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    解散队伍
                  </Button>
                </div>
              )}

              {selectedTeam.archived && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">队伍已归档</p>
                    <p className="text-xs text-amber-600 mt-1">
                      归档的队伍将不再显示在招募列表中，但比赛记录会被保留。
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* 邀请成员 Modal */}
      <Modal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="邀请成员加入"
        className="max-w-xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">搜索成员</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                type="text"
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                placeholder="输入姓名搜索..."
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              选择邀请对象
            </label>
            <div className="max-h-48 overflow-y-auto border border-cream-200 rounded-xl p-1 scrollbar-thin space-y-1">
              {availableUsers.length === 0 ? (
                <div className="text-center py-8 text-sm text-ink-400">
                  {inviteSearch ? "没有找到匹配的成员" : "暂无可邀请的成员"}
                </div>
              ) : (
                availableUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedInviteUser(u.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all",
                      selectedInviteUser === u.id
                        ? "bg-primary-50 border border-primary-300"
                        : "hover:bg-cream-50"
                    )}
                  >
                    <img src={u.avatar} alt="" className="w-9 h-9 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-800 truncate">{u.name}</p>
                      <p className="text-[11px] text-ink-400">
                        {u.grade} · {u.major}
                        {u.preferredPositions.length > 0 &&
                          ` · 擅长${u.preferredPositions.map(p => positionLabels[p]).join("、")}`}
                      </p>
                    </div>
                    {selectedInviteUser === u.id && (
                      <Check className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                指定辩位（可选）
              </label>
              <select
                value={invitePosition || ""}
                onChange={(e) =>
                  setInvitePosition(e.target.value ? (e.target.value as DebatePosition) : null)
                }
                className="input"
              >
                <option value="">不指定</option>
                <option value="first">一辩</option>
                <option value="second">二辩</option>
                <option value="third">三辩</option>
                <option value="fourth">四辩</option>
              </select>
            </div>
            <div className="flex items-center gap-2 sm:pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inviteIsSub}
                  onChange={(e) => setInviteIsSub(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-ink-600">作为替补队员</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setShowInviteModal(false)}
            >
              取消
            </Button>
            <Button
              className="flex-1"
              onClick={handleInvite}
              disabled={!selectedInviteUser || inviteLoading}
            >
              {inviteLoading ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-1.5" />
              )}
              发送邀请
            </Button>
          </div>
        </div>
      </Modal>

      {/* 申请加入 Modal */}
      <Modal
        open={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="申请加入队伍"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-primary-50 border border-primary-100">
            <p className="text-sm text-primary-700">
              你正在申请加入：
              <span className="font-semibold ml-1">
                {teams.find((t) => t.id === applyTeamId)?.name}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              申请辩位（可选）
            </label>
            <select
              value={applyPosition || ""}
              onChange={(e) =>
                setApplyPosition(e.target.value ? (e.target.value as DebatePosition) : null)
              }
              className="input"
            >
              <option value="">服从安排</option>
              <option value="first">一辩</option>
              <option value="second">二辩</option>
              <option value="third">三辩</option>
              <option value="fourth">四辩</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={applyIsSub}
                onChange={(e) => setApplyIsSub(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-ink-600">愿意担任替补</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setShowApplyModal(false)}
            >
              取消
            </Button>
            <Button className="flex-1" onClick={handleApply}>
              <Send className="w-4 h-4 mr-1.5" />
              提交申请
            </Button>
          </div>
        </div>
      </Modal>

      {/* 临时调人 Modal */}
      <Modal
        open={showSwapModal}
        onClose={() => setShowSwapModal(false)}
        title="临时调人：正式 ↔ 替补"
        className="max-w-xl"
      >
        {swapTeamId && (
          <div className="space-y-5">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                先选择一名正式队员，再选择一名替补队员，确认后两人的身份将互换。
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-ink-700 mb-2">1. 选择要换下的正式队员</h4>
              <div className="grid sm:grid-cols-2 gap-2">
                {getTeamMembers(swapTeamId)
                  .filter((m) => m.status === "confirmed" && !m.isSubstitute && m.teamId !== teams.find(t=>t.id===swapTeamId)?.captainId)
                  .map((m) => {
                    const u = getUser(m.userId);
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSwapFormalId(m.id)}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border-2 text-left transition-all",
                          swapFormalId === m.id
                            ? "border-victory bg-red-50"
                            : "border-cream-200 hover:border-cream-300 bg-white"
                        )}
                      >
                        <img src={u?.avatar} alt="" className="w-8 h-8 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-800 truncate">{u?.name}</p>
                          <p className="text-[10px] text-ink-400">
                            {m.position ? positionLabels[m.position] : "未指定辩位"}
                          </p>
                        </div>
                        {swapFormalId === m.id && <Check className="w-4 h-4 text-victory" />}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-ink-700 mb-2">2. 选择要换上的替补队员</h4>
              <div className="grid sm:grid-cols-2 gap-2">
                {getTeamMembers(swapTeamId)
                  .filter((m) => m.status === "confirmed" && m.isSubstitute)
                  .map((m) => {
                    const u = getUser(m.userId);
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSwapSubId(m.id)}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border-2 text-left transition-all",
                          swapSubId === m.id
                            ? "border-success bg-green-50"
                            : "border-cream-200 hover:border-cream-300 bg-white"
                        )}
                      >
                        <img src={u?.avatar} alt="" className="w-8 h-8 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-800 truncate">{u?.name}</p>
                          <p className="text-[10px] text-ink-400">替补队员</p>
                        </div>
                        {swapSubId === m.id && <Check className="w-4 h-4 text-success" />}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* 预览 */}
            {swapFormalId && swapSubId && (() => {
              const f = teamMembers.find((m) => m.id === swapFormalId);
              const s = teamMembers.find((m) => m.id === swapSubId);
              const fu = f ? getUser(f.userId) : null;
              const su = s ? getUser(s.userId) : null;
              return (
                <div className="p-4 rounded-xl bg-cream-50 border border-cream-200">
                  <p className="text-xs font-medium text-ink-500 mb-3 text-center">调整效果预览</p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 text-center p-2 rounded-lg bg-red-50 border border-red-100">
                      <img src={fu?.avatar} alt="" className="w-10 h-10 mx-auto rounded-full mb-1" />
                      <p className="text-xs font-medium text-ink-800">{fu?.name}</p>
                      <p className="text-[10px] text-victory">→ 转为替补</p>
                    </div>
                    <ArrowLeftRight className="w-6 h-6 text-ink-400 flex-shrink-0" />
                    <div className="flex-1 text-center p-2 rounded-lg bg-green-50 border border-green-100">
                      <img src={su?.avatar} alt="" className="w-10 h-10 mx-auto rounded-full mb-1" />
                      <p className="text-xs font-medium text-ink-800">{su?.name}</p>
                      <p className="text-[10px] text-success">→ 升入正式</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowSwapModal(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1"
                onClick={handleSwap}
                disabled={!swapFormalId || !swapSubId}
              >
                <Shuffle className="w-4 h-4 mr-1.5" />
                确认互换
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
