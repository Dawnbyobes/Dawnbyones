import { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { supabase, type InviteCode } from "@/lib/supabase";

export default function ReadersAdmin() {
  const [readers, setReaders] = useState<any[]>([]);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (profiles) {
      const { data: usedCodes } = await supabase.from("invite_codes").select("*").not("used_by", "is", null);
      const readersWithCode = profiles.map(p => {
        const usedCode = usedCodes?.find(c => c.used_by === p.id);
        return { ...p, invite_code: usedCode?.code ?? "-" };
      });
      setReaders(readersWithCode);
    }
    const { data } = await supabase.from("invite_codes").select("*").order("created_at", { ascending: false });
    if (data) setCodes(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4">
          <div className="bg-[#111] border border-[#1a1a1a] rounded-lg px-4 py-3"><p className="text-[#555] text-xs">总读者</p><p className="text-xl font-semibold text-white">{readers.length}</p></div>
          <div className="bg-[#111] border border-[#1a1a1a] rounded-lg px-4 py-3"><p className="text-[#555] text-xs">已用邀请码</p><p className="text-xl font-semibold text-white">{codes.filter(c => c.used).length}</p></div>
          <div className="bg-[#111] border border-[#1a1a1a] rounded-lg px-4 py-3"><p className="text-[#555] text-xs">剩余邀请码</p><p className="text-xl font-semibold text-white">{codes.filter(c => !c.used).length}</p></div>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1 px-3 py-1.5 border border-[#333] text-[#888] rounded-md text-xs hover:border-[#555] hover:text-white transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />刷新
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#555]" /></div>
      ) : (
        <div className="space-y-2">
          {readers.map(r => (
            <div key={r.id} className="py-3 px-4 bg-[#111] border border-[#1a1a1a] rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white text-sm font-medium">{r.display_name ?? r.reader_id}</p>
                <span className="text-[#444] text-xs">{new Date(r.created_at).toLocaleDateString("zh-CN")}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p className="text-[#555]"><span className="text-[#444]">ID:</span> {r.reader_id}</p>
                <p className="text-[#555]"><span className="text-[#444]">邮箱:</span> {r.email ?? "-"}</p>
                <p className="text-[#555] col-span-2"><span className="text-[#444]">邀请码:</span> <span className="font-mono">{r.invite_code}</span></p>
              </div>
            </div>
          ))}
          {readers.length === 0 && <div className="text-center py-12 text-[#555] text-sm">暂无读者</div>}
        </div>
      )}
    </div>
  );
}
