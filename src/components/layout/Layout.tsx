import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-cream-200 bg-grain-overlay">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <Outlet />
      </main>
      <footer className="border-t border-cream-300 bg-white/50 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm font-serif text-ink-700 font-semibold">思辨学社</p>
              <p className="text-xs text-ink-400 mt-1">
                以辩明道，以论正言 · 培养具有思辨精神的当代青年
              </p>
            </div>
            <div className="text-xs text-ink-400">
              © 2025 高校辩论社管理平台 · 本站仅作演示用途
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
