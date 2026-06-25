import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Bell, Clock, ChevronRight, Library, Volume2 } from "lucide-react";
import { supabase, type Novel, type Announcement } from "@/lib/supabase";

export default function Dashboard() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载已发布的作品
    supabase
      .from("novels")
      .select("*")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        if (data) setNovels(data);
      });

    // 加载公告
    supabase
      .from("announcements")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setAnnouncements(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#1a1a1a] rounded w-1/4" />
          <div className="h-32 bg-[#111] rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* 欢迎标题 */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
          <Library className="w-6 h-6 text-[#555]" />
          我的书架
        </h1>
        <p className="text-[#555] text-sm">{novels.length} 部作品 · 随时续读</p>
      </div>

      {/* 公告栏 */}
      {announcements.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="w-4 h-4 text-[#555]" />
            <h2 className="text-xs text-[#555] uppercase tracking-[0.15em]">公告</h2>
          </div>
          <div className="space-y-2">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="bg-[#111] border border-[#1a1a1a] rounded-lg px-4 py-3 flex items-start gap-3"
              >
                <Bell className="w-4 h-4 text-[#555] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[#aaa] text-sm leading-relaxed">{a.content}</p>
                  <p className="text-[#444] text-xs mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(a.created_at).toLocaleDateString("zh-CN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 作品书架 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-[#555]" />
          <h2 className="text-xs text-[#555] uppercase tracking-[0.15em]">全部作品</h2>
        </div>

        {novels.length === 0 ? (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-8 text-center">
            <BookOpen className="w-10 h-10 text-[#222] mx-auto mb-3" />
            <p className="text-[#555] text-sm">暂无作品</p>
            <p className="text-[#444] text-xs mt-1">管理员可在后台添加</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {novels.map((novel) => (
              <Link
                key={novel.id}
                to={`/novel/${novel.slug}`}
                className="group bg-[#111] border border-[#1a1a1a] rounded-lg p-4 hover:border-[#333] transition-colors flex gap-4"
              >
                {/* 封面 */}
                {novel.cover ? (
                  <img
                    src={novel.cover}
                    alt={novel.title}
                    className="w-20 h-28 object-cover rounded-md flex-shrink-0 bg-[#0a0a0a]"
                  />
                ) : (
                  <div className="w-20 h-28 bg-[#0a0a0a] rounded-md flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-8 h-8 text-[#333]" />
                  </div>
                )}

                {/* 信息 */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-white text-sm font-medium truncate group-hover:opacity-80 transition-opacity">
                        {novel.title}
                      </h3>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                          novel.status === "ongoing"
                            ? "bg-[#1a2a1a] text-[#7c9a6e]"
                            : novel.status === "completed"
                            ? "bg-[#1a1a2a] text-[#7e8aad]"
                            : "bg-[#2a1a1a] text-[#ad8a7e]"
                        }`}
                      >
                        {novel.status === "ongoing"
                          ? "连载中"
                          : novel.status === "completed"
                          ? "已完结"
                          : "暂停"}
                      </span>
                    </div>
                    <p className="text-[#666] text-xs line-clamp-2 leading-relaxed mb-2">
                      {novel.description ?? "暂无简介"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[#444] text-xs">
                      <span>{novel.chapter_count} 章</span>
                      {novel.word_count > 0 && (
                        <span>{novel.word_count.toLocaleString()} 字</span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#333] group-hover:text-[#666] transition-colors flex-shrink-0" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
