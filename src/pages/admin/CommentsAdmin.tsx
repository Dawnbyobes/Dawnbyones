import { useState, useEffect } from "react";
import { Trash2, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CommentsAdmin() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("comments")
      .select("*, chapters(title, order_num, novels(title, slug))")
      .order("created_at", { ascending: false });
    if (data) setComments(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    if (!confirm("确定删除这条评论？")) return;
    await supabase.from("comments").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-[#555]">{comments.length} 条评论</span>
        <button onClick={load} disabled={loading} className="flex items-center gap-1 px-3 py-1.5 border border-[#333] text-[#888] rounded-md text-xs hover:border-[#555] hover:text-white transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />刷新
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#555]" /></div>
      ) : (
        <div className="space-y-2">
          {comments.map(c => (
            <div key={c.id} className="py-3 px-4 bg-[#111] border border-[#1a1a1a] rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-white text-sm font-medium">{c.user_name ?? "匿名"}</span>
                  <span className="text-[#444] text-xs">{new Date(c.created_at).toLocaleString("zh-CN")}</span>
                </div>
                <button onClick={() => del(c.id)} className="p-1.5 text-[#555] hover:text-[#c44444] transition-colors flex-shrink-0 ml-2"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <p className="text-[#aaa] text-sm mb-1.5">{c.content}</p>
              <div className="flex items-center gap-1.5 text-xs text-[#555]">
                <span className="truncate">《{c.chapters?.novels?.title ?? "未知作品"}》</span>
                <span>·</span>
                <span>第{c.chapters?.order_num ?? "?"}章 {c.chapters?.title ?? ""}</span>
              </div>
            </div>
          ))}
          {comments.length === 0 && <div className="text-center py-12 text-[#555] text-sm">暂无评论</div>}
        </div>
      )}
    </div>
  );
}
