import { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { supabase, type InviteCode } from "@/lib/supabase";

export default function ReadersAdmin() {
  const [readers, setReaders] = useState<any[]>([]);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      // 先加载读者
      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesErr) {
        setError("加载读者失败: " + profilesErr.message);
        setLoading(false);
        return;
      }

      // 再加载已使用的邀请码
      const { data: usedCodes, error: codesErr } = await supabase
        .from("invite_codes")
        .select("*")
        .not("used_by", "is", null);

      if (codesErr) {
        setError("加载邀请码失败: " + codesErr.message);
        setLoading(false);
        return;
      }

      // 关联读者和邀请码
      if (profiles) {
        const readersWithCode = profiles.map(p => {
          const usedCode = usedCodes?.find(c => c.used_by === p.id);
          return { ...p, invite_code: usedCode?.code ?? "-" };
        });
        setReaders(readersWithCode);
      }

      // 加载所有邀请码用于统计
      const { data: allCodes } = await supabase
        .from("invite_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (allCodes) setCodes(allCodes);
    } catch (e: any) {
      setError("加载失败: " + (e.message || "未知错误"));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();

    // 订阅 profiles 表的实时变更
    const profilesChannel = supabase
      .channel("profiles_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          load();
        }
      )
      .subscribe();

    // 订阅 invite_codes 表的实时变更
    const codesChannel = supabase
      .channel("invite_codes_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invite_codes" },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(codesChannel);
    };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4">
          <div className="bg-[#111] border border-[#1a1a1a] rounded-lg px-4 py-3">
            <p className="text-[#555] text-xs">总读者</p>
            <p className="text-xl font-semibold text-white">{readers.length}</p>
          </div>
          <div className="bg-[#111] border border-[#1a1a1a] rounded-lg px-4 py-3">
            <p className="text-[#555] text-xs">已用邀请码</p>
            <p className="text-xl font-semibold text-white">{codes.filter(c => c.used).length}</p>
          </div>
          <div className="bg-[#111] border border-[#1a1a1a] rounded-lg px-4 py-3">
            <p className="text-[#555] text-xs">剩余邀请码</p>
            <p className="text-xl font-semibold text-white">{codes.filter(c => !c.used).length}</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 border border-[#333] text-[#888] rounded-md text-xs hover:border-[#555] hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          刷新
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[#2a1a1a] border border-[#3a2a2a] rounded-lg text-[#c44444] text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-[#555]" />
        </div>
      ) : (
        <div className="space-y-2">
          {readers.map(r => (
            <div key={r.id} className="py-3 px-4 bg-[#111] border border-[#1a1a1a] rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white text-sm font-medium">
                  {r.display_name ?? r.reader_id ?? "未命名"}
                </p>
                <span className="text-[#444] text-xs">
                  {r.created_at
                    ? new Date(r.created_at).toLocaleDateString("zh-CN")
                    : "-"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p className="text-[#555]">
                  <span className="text-[#444]">ID:</span> {r.reader_id ?? "-"}
                </p>
                <p className="text-[#555]">
                  <span className="text-[#444]">邮箱:</span> {r.email ?? "-"}
                </p>
                <p className="text-[#555] col-span-2">
                  <span className="text-[#444]">邀请码:</span>{" "}
                  <span className="font-mono">{r.invite_code}</span>
                </p>
              </div>
            </div>
          ))}
          {readers.length === 0 && (
            <div className="text-center py-12 text-[#555] text-sm">暂无读者</div>
          )}
        </div>
      )}
    </div>
  );
}
