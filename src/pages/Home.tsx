import { Link } from "react-router-dom";
import { BookOpen, Lock, RefreshCw, MessageSquare } from "lucide-react";
import { supabase, type Novel } from "@/lib/supabase";
import { useState, useEffect } from "react";

export default function Home() {
  const [novels, setNovels] = useState<Novel[]>([]);

  useEffect(() => {
    supabase.from("novels").select("*").eq("is_published", true).order("updated_at", { ascending: false })
      .then(({ data }) => { if (data) setNovels(data); });
  }, []);

  return (
    <div>
      <section className="text-center py-24 sm:py-32 px-4">
        <h1 className="text-4xl sm:text-5xl font-semibold text-white mb-6 tracking-tight">冰箱里的世界</h1>
        <p className="text-[#666] text-base sm:text-lg max-w-md mx-auto mb-10 leading-relaxed">只有受邀者才能进入的小世界。</p>
        <Link to="/login" className="inline-block bg-white text-[#0a0a0a] px-10 py-3.5 rounded-md text-sm font-medium hover:opacity-85 transition-opacity">
          会员制登录
        </Link>
      </section>

      <div className="max-w-2xl mx-auto px-4">
        <div className="h-px bg-[#1a1a1a] mb-16" />

        <section className="mb-16">
          <h2 className="text-xs text-[#555] uppercase tracking-[0.15em] mb-8">作品</h2>
          {novels.length > 0 ? (
            <div className="space-y-4">
              {novels.map((novel) => (
                <Link key={novel.id} to={`/novel/${novel.slug}`} className="block group">
                  <div className="border-b border-[#111] pb-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white text-base font-medium mb-1.5 group-hover:opacity-80 transition-opacity">{novel.title}</h3>
                        <p className="text-[#666] text-sm line-clamp-2 leading-relaxed">{novel.description ?? "暂无简介"}</p>
                        <div className="flex items-center gap-4 mt-3 text-[#444] text-xs">
                          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{novel.chapter_count} 章</span>
                          <span>{novel.status === "ongoing" ? "连载中" : novel.status === "completed" ? "已完结" : "暂停"}</span>
                          {novel.category && <span>{novel.category}</span>}
                        </div>
                      </div>
                      {novel.cover ? (
                        <img src={novel.cover} alt={novel.title} className="w-16 h-22 object-cover rounded-md flex-shrink-0 bg-[#111]" />
                      ) : (
                        <div className="w-16 h-22 bg-[#111] rounded-md flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-6 h-6 text-[#333]" />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-[#444] text-sm">暂无作品，管理员可在后台添加。</div>
          )}
        </section>

        <div className="h-px bg-[#1a1a1a] mb-16" />

        <section className="mb-16">
          <h2 className="text-xs text-[#555] uppercase tracking-[0.15em] mb-8">关于本站</h2>
          <div className="space-y-0">
            {[
              { icon: <Lock className="w-4 h-4 text-[#666]" />, title: "纯粹体验", desc: "私密阅读，只有你和故事。" },
              { icon: <RefreshCw className="w-4 h-4 text-[#666]" />, title: "持续更新", desc: "作者不定期更新章节，敬请期待。" },
              { icon: <MessageSquare className="w-4 h-4 text-[#666]" />, title: "联系方式", desc: "不可申请，仅限受邀会员。" },
            ].map((f, i) => (
              <div key={i} className="py-5 border-b border-[#111] last:border-b-0">
                <h3 className="text-white text-base font-medium mb-1.5 flex items-center gap-2">{f.icon}{f.title}</h3>
                <p className="text-[#666] text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
