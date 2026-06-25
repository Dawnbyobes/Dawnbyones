import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LogOut, User, Shield, Menu, X, Library } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isReader = location.pathname.startsWith("/read");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user?.email) {
        supabase.from("admins").select("*").eq("email", data.user.email).limit(1).then(({ data: admins }) => {
          setIsAdmin(!!admins && admins.length > 0);
        });
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (isReader) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5]">
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#1a1a1a]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link to={user ? "/dashboard" : "/"} className="text-white text-sm font-medium tracking-wide hover:opacity-80 transition-opacity">
              冰箱里的世界
            </Link>

            <nav className="hidden sm:flex items-center gap-6">
              {user ? (
                <>
                  <Link to="/dashboard" className="text-[#888] text-sm hover:text-white transition-colors flex items-center gap-1">
                    <Library className="w-3.5 h-3.5" />主页
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="text-[#888] text-sm hover:text-white transition-colors flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />管理
                    </Link>
                  )}
                  <div className="flex items-center gap-4">
                    <span className="text-[#666] text-sm flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {user.user_metadata?.name ?? user.email ?? "读者"}
                    </span>
                    <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
                      className="text-[#555] text-sm hover:text-white transition-colors flex items-center gap-1">
                      <LogOut className="w-3.5 h-3.5" />退出
                    </button>
                  </div>
                </>
              ) : (
                <Link to="/login" className="text-[#0a0a0a] bg-white text-sm px-4 py-1.5 rounded-md hover:opacity-85 transition-opacity font-medium">
                  登录
                </Link>
              )}
            </nav>

            <button className="sm:hidden text-[#888] p-1" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {mobileOpen && (
            <div className="sm:hidden py-4 border-t border-[#1a1a1a] space-y-3">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-[#888] text-sm hover:text-white py-1 flex items-center gap-1">
                    <Library className="w-3.5 h-3.5" />主页
                  </Link>
                  {isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)} className="block text-[#888] text-sm hover:text-white py-1 flex items-center gap-1"><Shield className="w-3.5 h-3.5" />管理后台</Link>}
                  <span className="block text-[#666] text-sm py-1">{user.user_metadata?.name ?? "读者"}</span>
                  <button onClick={() => { supabase.auth.signOut(); setMobileOpen(false); }} className="block text-[#555] text-sm hover:text-white py-1">退出登录</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-white text-sm py-1">登录</Link>
              )}
            </div>
          )}
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-[#1a1a1a] py-8 mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[#333] text-xs">2026 冰箱里的世界 · 仅供会员阅读</p>
        </div>
      </footer>
    </div>
  );
}
