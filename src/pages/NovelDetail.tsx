import { useParams, Link } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";
import { supabase, type Novel, type Chapter } from "@/lib/supabase";
import { useState, useEffect } from "react";

export default function NovelDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase.from("novels").select("*").eq("slug", slug).single().then(({ data }) => {
      if (data) {
        setNovel(data);
        supabase.from("chapters").select("*").eq("novel_id", data.id).eq("status", "published").order("order_num").then(({ data: chs }) => {
          if (chs) setChapters(chs);
        });
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-12"><div className="animate-pulse space-y-4"><div className="h-8 bg-[#1a1a1a] rounded w-1/2" /><div className="h-4 bg-[#111] rounded w-full" /></div></div>;
  if (!novel) return <div className="max-w-4xl mx-auto px-4 py-20 text-center"><p className="text-[#555] text-lg mb-4">作品不存在</p><Link to="/novels" className="text-[#888] text-sm hover:text-white transition-colors">返回作品列表</Link></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-12">
        <div className="flex items-start gap-6 mb-8">
          {novel.cover ? (
            <img src={novel.cover} alt={novel.title} className="w-28 h-40 object-cover rounded-lg bg-[#111] flex-shrink-0" />
          ) : (
            <div className="w-28 h-40 bg-[#111] rounded-lg flex items-center justify-center flex-shrink-0"><BookOpen className="w-10 h-10 text-[#333]" /></div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl font-semibold text-white">{novel.title}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full ${novel.status === "ongoing" ? "bg-[#1a2a1a] text-[#7c9a6e]" : novel.status === "completed" ? "bg-[#1a1a2a] text-[#7e8aad]" : "bg-[#2a1a1a] text-[#ad8a7e]"}`}>
                {novel.status === "ongoing" ? "连载中" : novel.status === "completed" ? "已完结" : "暂停"}
              </span>
            </div>
            <p className="text-[#666] text-sm leading-relaxed mb-4">{novel.description ?? "暂无简介"}</p>
            <div className="flex flex-wrap items-center gap-4 text-[#555] text-xs">
              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{novel.chapter_count} 章</span>
              {(novel.word_count ?? 0) > 0 && <span>{(novel.word_count ?? 0).toLocaleString()} 字</span>}
              {novel.category && <span className="px-2 py-0.5 bg-[#1a1a1a] rounded text-[#777]">{novel.category}</span>}
              {novel.tags && novel.tags.split(",").map(t => <span key={t} className="px-2 py-0.5 bg-[#1a1a1a] rounded text-[#777]">{t.trim()}</span>)}
            </div>
          </div>
        </div>
        {novel.author_note && (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4 mb-8">
            <p className="text-[#555] text-xs mb-1.5">作者的话</p>
            <p className="text-[#888] text-sm leading-relaxed">{novel.author_note}</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-lg font-medium">章节目录</h2>
          <span className="text-[#555] text-xs">共 {chapters.length} 章</span>
        </div>
        {chapters.length > 0 ? (
          <div className="space-y-1">
            {chapters.map(ch => (
              <Link key={ch.id} to={`/read/${ch.id}`} className="group flex items-center justify-between py-3 px-4 rounded-md hover:bg-[#111] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[#333] text-xs w-12 flex-shrink-0">第{ch.order_num}章</span>
                  <span className="text-[#aaa] text-sm group-hover:text-white transition-colors truncate">{ch.title}</span>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  {(ch.word_count ?? 0) > 0 && <span className="text-[#444] text-xs hidden sm:inline">{(ch.word_count ?? 0).toLocaleString()} 字</span>}
                  <ChevronRight className="w-4 h-4 text-[#333] group-hover:text-[#666] transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-[#111] rounded-lg"><p className="text-[#555] text-sm">暂无章节</p></div>
        )}
      </div>
    </div>
  );
}
