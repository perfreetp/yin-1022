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
} from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { useTeamStore } from "../store/useTeamStore";
import { useUserStore } from "../store/useUserStore";
import { teamStatusLabels, positionLabels, generateId } from "../utils";
import type { Team, DebatePosition } from "../types";

type FilterType = "all" | "recruiting" | "my";

export default function Teams() {
  const teams = useTeamStore((s) => s.teams);
  const teamMembers = useTeamStore((s) => s.teamMembers);
  const users = useUserStore((s) => s.users);
  const currentUserId = useUserStore((s) => s.currentUserId);
  const createTeam = useTeamStore((s) => s.createTeam);
  const updateMember = useTeamStore((s) => s.updateMember);
  const removeMember = useTeamStore((s) => s.removeMember);
  const archiveTeam = useTeamStore((s) => s.archiveTeam);
  const disbandTeam = useTeamStore((s) => s.disbandTeam);

  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState({ name: "", description: "", season: "2025春季赛" });

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
    };
    const captainMember = {
      id: generateId("tm"),
      teamId,
      userId: currentUserId,
      position: null,
      status: "confirmed" as const,
      isSubstitute: false,
      joinedAt: new Date().toISOString(),
    };
    createTeam(team, [captainMember]);
    setShowCreateModal(false);
    setNewTeam({ name: "", description: "", season: "2025春季赛" });
  };

  const handleMemberAction = (memberId: string, action: "confirm" | "reject" | "remove") => {
    if (action === "confirm") {
      updateMember(memberId, { status: "confirmed" });
    } else if (action === "reject") {
      updateMember(memberId, { status: "rejected" });
    } else {
      removeMember(memberId);
    }
  };

  return (
    <div className="space-y-6">
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
          const confirmedMembers = members.filter((m) => m.status === "confirmed");
          const isCaptain = team.captainId === currentUserId;

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
                    {confirmedMembers.slice(0, 4).map((m) => {
                      const user = getUser(m.userId);
                      return (
                        <img
                          key={m.id}
                          src={user?.avatar}
                          alt=""
                          className={`w-8 h-8 rounded-full border-2 border-white ${m.isSubstitute ? "opacity-60" : ""}`}
                          title={user?.name}
                        />
                      );
                    })}
                    {confirmedMembers.length > 4 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-cream-200 flex items-center justify-center text-[10px] font-medium text-ink-500">
                        +{confirmedMembers.length - 4}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-ink-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {confirmedMembers.length}/4
                      {members.some((m) => m.isSubstitute) && " +替补"}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                {!team.archived && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-cream-200">
                    {team.status === "recruiting" && !isCaptain && (
                      <Button variant="accent" size="sm" className="flex-1">
                        <UserPlus className="w-3.5 h-3.5 mr-1" />
                        申请加入
                      </Button>
                    )}
                    {isCaptain && (
                      <>
                        <Button variant="outline" size="sm" className="flex-1">
                          <UserPlus className="w-3.5 h-3.5 mr-1" />
                          邀请成员
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            archiveTeam(team.id);
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
        {selectedTeam && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <Badge
                  variant={
                    selectedTeam.status === "recruiting"
                      ? "success"
                      : "primary"
                  }
                >
                  {teamStatusLabels[selectedTeam.status].label}
                </Badge>
                <p className="text-sm text-ink-500 mt-2">{selectedTeam.description}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                队伍成员 ({getTeamMembers(selectedTeam.id).length})
              </h4>
              <div className="space-y-2">
                {getTeamMembers(selectedTeam.id).map((member) => {
                  const user = getUser(member.userId);
                  const isCaptain = selectedTeam.captainId === member.userId;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-cream-50 border border-cream-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={user?.avatar}
                            alt=""
                            className="w-10 h-10 rounded-full"
                          />
                          {isCaptain && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center shadow-sm">
                              <Crown className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-ink-800">
                              {user?.name}
                            </p>
                            {member.isSubstitute && (
                              <Badge variant="warning">替补</Badge>
                            )}
                            {member.position && (
                              <Badge variant="primary">
                                {positionLabels[member.position]}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-ink-400">
                            {user?.grade} · {user?.major}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.status === "invited" && (
                          <>
                            <button
                              onClick={() => handleMemberAction(member.id, "confirm")}
                              className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMemberAction(member.id, "reject")}
                              className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {member.status === "confirmed" &&
                          selectedTeam.captainId === currentUserId &&
                          !isCaptain && (
                            <button
                              onClick={() => handleMemberAction(member.id, "remove")}
                              className="w-8 h-8 rounded-full bg-ink-100 text-ink-500 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          )}
                        {member.status === "rejected" && (
                          <Badge variant="danger">已拒绝</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedTeam.captainId === currentUserId && !selectedTeam.archived && (
              <div className="pt-4 border-t border-cream-200 flex gap-3">
                <Button variant="outline" className="flex-1">
                  <Shuffle className="w-4 h-4 mr-1.5" />
                  临时调人
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm("确定要解散这支队伍吗？此操作不可撤销。")) {
                      disbandTeam(selectedTeam.id);
                      setSelectedTeam(null);
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
        )}
      </Modal>
    </div>
  );
}
