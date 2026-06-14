import { NavLink } from "react-router-dom";
import {
  Home,
  Users,
  Swords,
  Calendar,
  Gavel,
  BookOpen,
  Trophy,
  User,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useUserStore } from "../../store/useUserStore";
import { cn } from "../../utils";

const navItems = [
  { to: "/", label: "首页", icon: Home },
  { to: "/members", label: "成员", icon: Users },
  { to: "/teams", label: "组队", icon: Swords },
  { to: "/schedule", label: "赛程", icon: Calendar },
  { to: "/judging", label: "评审", icon: Gavel },
  { to: "/resources", label: "资料", icon: BookOpen },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentUser = useUserStore((s) => s.getCurrentUser());

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-cream-300">
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <Trophy className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <h1 className="font-serif text-lg font-bold text-primary-800 leading-none">
                  思辨学社
                </h1>
                <p className="text-[10px] text-ink-400 tracking-widest">DEBATE SOCIETY</p>
              </div>
            </NavLink>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary-50 text-primary-700 shadow-sm"
                        : "text-ink-600 hover:text-primary-700 hover:bg-cream-100"
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-full hover:bg-cream-100 transition-colors">
              <Bell className="w-5 h-5 text-ink-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-victory rounded-full" />
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-cream-300">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                className="w-9 h-9 rounded-full border-2 border-cream-300"
              />
              <div className="leading-tight">
                <p className="text-sm font-medium text-ink-800">{currentUser?.name}</p>
                <p className="text-[10px] text-ink-400">
                  {currentUser?.role === "admin"
                    ? "社团干部"
                    : currentUser?.role === "judge"
                    ? "评委"
                    : "参赛学生"}
                </p>
              </div>
              <User className="w-4 h-4 text-ink-400 ml-1" />
            </div>

            <button
              className="md:hidden p-2 rounded-lg hover:bg-cream-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-ink-700" />
              ) : (
                <Menu className="w-5 h-5 text-ink-700" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-cream-300 bg-white animate-fade-in">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-ink-600 hover:bg-cream-100"
                    )
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
