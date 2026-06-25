import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "register";

function generateReaderId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "读者";
  for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export default function Login() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isInvited, setIsInvited] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        checkInviteStatus(data.user.id);
      } else {
        setChecking(false);
      }
    });
  }, []);

  const goDashboard = () => {
    window.location.hash = "#/dashboard";
    window.location.reload();
  };

  const checkInviteStatus = async (userId: string) => {
    const { data: codes } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("used_by", userId)
      .limit(1);
    const invited = !!codes && codes.length > 0;
    setIsInvited(invited);
    setChecking(false);
    if (invited) goDashboard();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError("请输入邮箱和密码"); return; }
    setLoading(true); setError(""); setSuccess("");

    const { data, error: loginErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (loginErr) {
      setError(loginErr.message === "Invalid login credentials" ? "邮箱或密码错误" : loginErr.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      setUser(data.user);
      await checkInviteStatus(data.user.id);
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !inviteCode.trim()) { setError("请填写所有字段"); return; }
    if (password.length < 6) { setError("密码至少6位"); return; }
    setLoading(true); setError(""); setSuccess("");

    const { data: codeRecord } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("code", inviteCode.trim())
      .single();

    if (!codeRecord) { setError("邀请码不存在"); setLoading(false); return; }
    if (codeRecord.used) { setError("邀请码已被使用"); setLoading(false); return; }

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (signUpErr) { setError(signUpErr.message); setLoading(false); return; }

    if (signUpData.user) {
      await supabase
        .from("invite_codes")
        .update({ used: true, used_by: signUpData.user.id, used_at: new Date().toISOString() })
        .eq("id", codeRecord.id);

      const readerId = generateReaderId();
      await supabase.from("profiles").upsert({
        id: signUpData.user.id,
        reader_id: readerId,
        display_name: readerId,
        email: email.trim(),
        created_at: new Date().toISOString(),
      });

      setSuccess("注册成功！正在跳转...");
      setTimeout(() => goDashboard(), 1000);
    }
    setLoading(false);
  };

  const handleOAuth = async () => {
    const redirectTo = `${window.location.origin}/login`;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  };

  const handleVerifyInvite = async () => {
    if (!inviteCode.trim()) { setError("请输入邀请码"); return; }
    if (!user) { setError("请先登录"); return; }
    setError(""); setSuccess("");
    const { data: record } = await supabase.from("invite_codes").select("*").eq("code", inviteCode.trim()).single();
    if (!record) { setError("邀请码不存在"); return; }
    if (record.used) { setError("邀请码已被使用"); return; }
    await supabase.from("invite_codes").update({ used: true, used_by: user.id, used_at: new Date().toISOString() }).eq("id", record.id);
    setSuccess("验证成功！正在跳转...");
    setTimeout(() => goDashboard(), 1000);
  };

  if (checking) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#555]" /></div>;
  }

  if (user && !isInvited) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-white mb-2">冰箱里的世界</h1>
            <p className="text-[#666] text-sm">会员制阅读空间</p>
          </div>
          <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-6">
            <p className="text-[#888] text-sm text-center mb-2">欢迎，{user.email}</p>
            <p className="text-[#888] text-sm text-center mb-6">请输入你的邀请码以继续</p>
            <div className="space-y-3">
              <input type="text" value={inviteCode} onChange={(e) => { setInviteCode(e.target.value); setError(""); }}
                placeholder="如：INVC45D2070"
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-4 py-2.5 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444] transition-colors" />
              {error && <p className="text-[#c44444] text-xs">{error}</p>}
              {success && <p className="text-[#4caa4c] text-xs">{success}</p>}
              <button onClick={handleVerifyInvite} disabled={!inviteCode.trim()}
                className="w-full py-2.5 bg-white text-[#0a0a0a] rounded-md text-sm font-medium hover:opacity-85 transition-opacity disabled:opacity-40">
                验证邀请码
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-[#1a1a1a] text-center">
              <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
                className="text-[#555] text-xs hover:text-[#888] transition-colors">退出登录</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user && isInvited) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-white mb-2">冰箱里的世界</h1>
            <p className="text-[#666] text-sm">欢迎回来</p>
          </div>
          <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-5 h-5 text-[#888]" />
              </div>
              <p className="text-white text-sm font-medium">{user.user_metadata?.name ?? user.email ?? "读者"}</p>
              <p className="text-[#555] text-xs mt-1">已通过邀请验证</p>
            </div>
            <div className="space-y-2">
              <button onClick={() => goDashboard()}
                className="block w-full py-2.5 bg-white text-[#0a0a0a] rounded-md text-sm font-medium text-center hover:opacity-85 transition-opacity">
                进入主页
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-white mb-2">冰箱里的世界</h1>
          <p className="text-[#666] text-sm">会员制阅读空间</p>
        </div>

        <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-6">
          <div className="flex mb-6 border-b border-[#1a1a1a]">
            <button onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 pb-2.5 text-sm transition-colors ${mode === "login" ? "text-white border-b-2 border-white" : "text-[#555] hover:text-[#888]"}`}>
              登录
            </button>
            <button onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 pb-2.5 text-sm transition-colors ${mode === "register" ? "text-white border-b-2 border-white" : "text-[#555] hover:text-[#888]"}`}>
              注册
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="邮箱地址" required
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-4 py-2.5 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444] transition-colors" />
              <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="密码" required
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-4 py-2.5 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444] transition-colors" />
              {error && <p className="text-[#c44444] text-xs">{error}</p>}
              {success && <p className="text-[#4caa4c] text-xs">{success}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-white text-[#0a0a0a] rounded-md text-sm font-medium hover:opacity-85 transition-opacity disabled:opacity-40">
                {loading ? "登录中..." : "登录"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="邮箱地址" required
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-4 py-2.5 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444] transition-colors" />
              <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="密码（至少6位）" required minLength={6}
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-4 py-2.5 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444] transition-colors" />
              <input type="text" value={inviteCode} onChange={(e) => { setInviteCode(e.target.value); setError(""); }}
                placeholder="邀请码（如：INVC45D2070）" required
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-4 py-2.5 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444] transition-colors" />
              {error && <p className="text-[#c44444] text-xs">{error}</p>}
              {success && <p className="text-[#4caa4c] text-xs">{success}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-white text-[#0a0a0a] rounded-md text-sm font-medium hover:opacity-85 transition-opacity disabled:opacity-40">
                {loading ? "注册中..." : "注册"}
              </button>
            </form>
          )}

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#222]" />
            <span className="text-[#555] text-xs">或</span>
            <div className="flex-1 h-px bg-[#222]" />
          </div>

          <button onClick={handleOAuth}
            className="w-full py-2.5 border border-[#333] text-[#aaa] rounded-md text-sm font-medium hover:border-[#555] hover:text-white transition-colors">
            使用 Google 登录
          </button>

          <div className="mt-4 text-center">
            <Link to="/" className="text-[#555] text-xs hover:text-[#888] transition-colors">返回首页</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
