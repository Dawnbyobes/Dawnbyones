import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [user, setUser] = useState<any>(null);
  const [isInvited, setIsInvited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user?.id) {
        supabase.from("invite_codes").select("*").eq("used_by", data.user.id).limit(1).then(({ data: codes }) => {
          setIsInvited(!!codes && codes.length > 0);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, []);

  const handleVerify = async () => {
    if (!inviteCode.trim()) { setError("请输入邀请码"); return; }
    if (!user) { setError("请先登录"); return; }
    setError(""); setSuccess("");
    const { data: record } = await supabase.from("invite_codes").select("*").eq("code", inviteCode.trim()).single();
    if (!record) { setError("邀请码不存在"); return; }
    if (record.used) { setError("邀请码已被使用"); return; }
    const { error: updErr } = await supabase.from("invite_codes").update({ used: true, used_by: user.id, used_at: new Date().toISOString() }).eq("id", record.id);
    if (updErr) { setError("验证失败: " + updErr.message); return; }
    setSuccess("验证成功！");
    setIsInvited(true);
  };

  const handleOAuth = async () => {
    const redirectTo = `${window.location.origin}/login`;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#555]" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-white mb-2">冰箱里的世界</h1>
          <p className="text-[#666] text-sm">{user && isInvited ? "欢迎回来" : "会员制阅读空间"}</p>
        </div>

        <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-6">
          {!user ? (
            <>
              <p className="text-[#888] text-sm text-center mb-6">使用邮箱或社交账号登录</p>
              <button onClick={handleOAuth} className="w-full py-2.5 bg-white text-[#0a0a0a] rounded-md text-sm font-medium hover:opacity-85 transition-opacity">
                使用 Google 登录
              </button>
              <div className="mt-4 text-center">
                <Link to="/" className="text-[#555] text-xs hover:text-[#888] transition-colors">返回首页</Link>
              </div>
            </>
          ) : !isInvited ? (
            <>
              <p className="text-[#888] text-sm text-center mb-6">请输入你的邀请码以继续</p>
              <div className="space-y-3">
                <input type="text" value={inviteCode} onChange={(e) => { setInviteCode(e.target.value); setError(""); }}
                  placeholder="如：INVC45D2070"
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-4 py-2.5 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444] transition-colors" />
                {error && <p className="text-[#c44444] text-xs">{error}</p>}
                {success && <p className="text-[#4caa4c] text-xs">{success}</p>}
                <button onClick={handleVerify} disabled={!inviteCode.trim()}
                  className="w-full py-2.5 bg-white text-[#0a0a0a] rounded-md text-sm font-medium hover:opacity-85 transition-opacity disabled:opacity-40">
                  验证邀请码
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-[#1a1a1a] text-center">
                <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
                  className="text-[#555] text-xs hover:text-[#888] transition-colors">退出登录</button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-5 h-5 text-[#888]" />
                </div>
                <p className="text-white text-sm font-medium">{user.user_metadata?.name ?? user.email ?? "读者"}</p>
                <p className="text-[#555] text-xs mt-1">已通过邀请验证</p>
              </div>
              <div className="space-y-2">
                <Link to="/" className="block w-full py-2.5 bg-white text-[#0a0a0a] rounded-md text-sm font-medium text-center hover:opacity-85 transition-opacity">
                  进入首页
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
