import { Link, useNavigate } from "react-router-dom";
import { BookOpen, ArrowRight, Loader2 } from "lucide-react";
import { supabase, type Novel } from "@/lib/supabase";
import { useState, useEffect } from "react";

export default function Novels() {
  const navigate = useNavigate();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate("/login");
        return;
      }
      supabase.from("invite_codes").select("*").eq("used_by", data.user.id).limit(1).then(({ data: codes }) => {
        if (!codes || codes.length === 0) {
          navigate("/login");
          return;
        }
        setAuthChecked(true);
      });
    });
  }, [navigate]);

  useEffect(() => {
    if (!authChecked) return;
    supabase.from("novels").select("*").eq("is_published", true).order("updated_at", { ascending: false })
      .then(({ data }) => { if (data) setNovels(data); setLoading(false); });
  }, [authChecked]);

  if (!authChecked) {
    return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#555]" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-12">
        <h1 className="text-2xl font-semibold text-white mb-2">全部作品</h1>
        <p className="text-[#666] text-sm">{novels.length} 部作品</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => <div key={i} className="animate-pulse"><div className="h-6 bg-[#1a1a1a] rounded w-1/3 mb-3" /><div className="h-4 bg-[#111] rounded w-2/3" /></div>)}
        </div>
      ) : novels.length > 0 ? (
        <div className="grid gap-6">
          {novels.map(novel => (
            <Link key={novel.id} to={`/novel/${novel.slug}`} className="group block bg-[#111] border border-[#1a1a1a] rounded-lg p-5 sm:p-6 hover:border-[#333] transition-colors">
              <div className="flex items-start gap-5">
                {novel.cover ? (
                  <img src={novel.cover} alt={novel.title} className="w-20 h-28 object-cover rounded-md flex-shrink-0 bg-[#0a0a0a]" />
                ) : (
                  <div className="w-20 h-28 bg-[#0a0a0a] rounded-md flex items-center justify-center flex-shrink-0"><BookOpen className="w-8 h-8 text-[#333]" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-white text-lg font-medium group-hover:opacity-80 transition-opacity">{novel.title}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${novel.status === "ongoing" ? "bg-[#1a2a1a] text-[#7c9a6e]" : novel.status === "completed" ? "bg-[#1a1a2a] text-[#7e8aad]" : "bg-[#2a1a1a] text-[#ad8a7e]"}`}>
                      {novel.status === "ongoing" ? "连载中" : novel.status === "completed" ? "已完结" : "暂停"}
                    </span>
                  </div>
                  <p className="text-[#666] text-sm line-clamp-2 mb-3 leading-relaxed">{novel.description ?? "暂无简介"}</p>
                  <div className="flex items-center gap-4 text-[#555] text-xs">
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{novel.chapter_count} 章</span>
                    {(novel.word_count ?? 0) > 0 && <span>{(novel.word_count ?? 0).toLocaleString()} 字</span>}
                    {novel.category && <span>{novel.category}</span>}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#333] group-hover:text-[#666] transition-colors flex-shrink-0 self-center" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20"><BookOpen className="w-12 h-12 text-[#222] mx-auto mb-4" /><p className="text-[#555] text-sm">暂无作品</p></div>
      )}
    </div>
  );
}
