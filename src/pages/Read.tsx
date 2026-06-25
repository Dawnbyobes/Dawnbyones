import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Settings, MessageSquare, List, X, Send, BookOpen, LogOut, Loader2 } from "lucide-react";
import { supabase, type Chapter, type Novel, type Comment } from "@/lib/supabase";

type Theme = "dark" | "light" | "sepia" | "green";
type Font = "sans" | "serif" | "kai";

const TC: Record<Theme, { bg: string; text: string; heading: string; border: string; nav: string; navHover: string; panel: string }> = {
  dark: { bg: "#0a0a0a", text: "#cccccc", heading: "#ffffff", border: "#1a1a1a", nav: "#555", navHover: "#fff", panel: "#111" },
  light: { bg: "#faf8f5", text: "#333", heading: "#1a1a1a", border: "#e5e0d8", nav: "#999", navHover: "#333", panel: "#f5f3ef" },
  sepia: { bg: "#f4ecd8", text: "#5c4b37", heading: "#3d3226", border: "#e0d5c0", nav: "#8c7b6b", navHover: "#3d3226", panel: "#ebe3d0" },
  green: { bg: "#c8e6c9", text: "#2e4a31", heading: "#1b3a1e", border: "#a5d6a7", nav: "#5a7d5e", navHover: "#1b3a1e", panel: "#b8dcb9" },
};

const FF: Record<Font, string> = {
  sans: '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif',
  serif: '"Noto Serif SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",serif',
  kai: '"KaiTi","STKaiti","楷体","Noto Serif SC",serif',
};

export default function Read() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [allChapters, setAllChapters] = useState<Pick<Chapter, "id" | "title" | "order_num">[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("rt") as Theme) ?? "dark");
  const [font, setFont] = useState<Font>(() => (localStorage.getItem("rf") as Font) ?? "serif");
  const [fontSize, setFontSize] = useState(() => parseFloat(localStorage.getItem("rfs") ?? "1.125"));
  const [lineHeight, setLineHeight] = useState(() => parseFloat(localStorage.getItem("rlh") ?? "2"));
  const [showSet, setShowSet] = useState(false);
  const [showCmt, setShowCmt] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [cmtText, setCmtText] = useState("");
  const [cmtError, setCmtError] = useState("");
  const [currentIdx, setCurrentIdx] = useState(0);

  const c = TC[theme];

  useEffect(() => {
    localStorage.setItem("rt", theme); localStorage.setItem("rf", font);
    localStorage.setItem("rfs", fontSize.toString()); localStorage.setItem("rlh", lineHeight.toString());
  }, [theme, font, fontSize, lineHeight]);

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
        setUser(data.user);
        setAuthChecked(true);
      });
    });
  }, [navigate]);

  useEffect(() => {
    if (!authChecked || !chapterId) return;
    supabase.from("chapters").select("*").eq("id", chapterId).single().then(({ data: ch }) => {
      if (!ch) return;
      setChapter(ch);
      document.title = `${ch.title} - 冰箱里的世界`;
      supabase.from("novels").select("*").eq("id", ch.novel_id).single().then(({ data: n }) => {
        if (n) setNovel(n);
      });
      supabase.from("chapters").select("id,title,order_num").eq("novel_id", ch.novel_id).eq("status", "published").order("order_num").then(({ data: chs }) => {
        if (chs) { setAllChapters(chs); setCurrentIdx(chs.findIndex(x => x.id === chapterId)); }
      });
      loadComments(chapterId);
    });
    return () => { document.title = "冰箱里的世界"; };
  }, [chapterId, authChecked]);

  const loadComments = (cid: string) => {
    supabase.from("comments").select("*").eq("chapter_id", cid).order("created_at", { ascending: false }).then(({ data: cms }) => {
      if (cms) setComments(cms);
    });
  };

  const prev = currentIdx > 0 ? allChapters[currentIdx - 1] : null;
  const next = currentIdx < allChapters.length - 1 ? allChapters[currentIdx + 1] : null;

  const goPrev = useCallback(() => { if (prev) navigate(`/read/${prev.id}`); }, [prev, navigate]);
  const goNext = useCallback(() => { if (next) navigate(`/read/${next.id}`); }, [next, navigate]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.target instanceof HTMLTextAreaElement) return; if (e.key === "ArrowLeft") goPrev(); if (e.key === "ArrowRight") goNext(); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [goPrev, goNext]);

  const sendCmt = async () => {
    if (!cmtText.trim() || !user || !chapterId) return;
    setCmtError("");
    const { error: insErr } = await supabase.from("comments").insert({
      chapter_id: chapterId,
      user_id: user.id,
      user_name: user.user_metadata?.name ?? user.email ?? "匿名",
      content: cmtText.trim(),
    });
    if (insErr) {
      setCmtError("发送失败: " + insErr.message);
      return;
    }
    setCmtText("");
    loadComments(chapterId);
  };

  if (!authChecked) return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><Loader2 className="w-5 h-5 animate-spin text-[#555]" /></div>;
  if (!chapter) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: c.bg }}><div className="animate-pulse text-[#555]">加载中...</div></div>;
  const paragraphs = chapter.content.split("\n").filter(p => p.trim());

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: c.bg, color: c.text }}>
      <header className="sticky top-0 z-40 border-b transition-colors duration-300" style={{ backgroundColor: c.bg, borderColor: c.border }}>
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link to={`/novel/${novel?.slug ?? ""}`} className="text-sm flex items-center gap-1 transition-colors" style={{ color: c.nav }} onMouseEnter={e => e.currentTarget.style.color = c.navHover} onMouseLeave={e => e.currentTarget.style.color = c.nav}><ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">{novel?.title ?? "目录"}</span></Link>
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowTOC(true); setShowSet(false); setShowCmt(false); }} className="p-2 rounded-md transition-colors" style={{ color: c.nav }} title="目录"><List className="w-4 h-4" /></button>
            <button onClick={() => { setShowCmt(!showCmt); setShowSet(false); setShowTOC(false); }} className="p-2 rounded-md transition-colors relative" style={{ color: c.nav }} title="评论">
              <MessageSquare className="w-4 h-4" />
              {comments.length > 0 && <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-white text-[#0a0a0a] text-[10px] rounded-full flex items-center justify-center font-medium">{comments.length}</span>}
            </button>
            <button onClick={() => { setShowSet(!showSet); setShowCmt(false); setShowTOC(false); }} className="p-2 rounded-md transition-colors" style={{ color: c.nav }} title="设置"><Settings className="w-4 h-4" /></button>
            {user ? <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="p-2 rounded-md transition-colors" style={{ color: c.nav }} title="退出"><LogOut className="w-4 h-4" /></button>
              : <Link to="/login" className="p-2 rounded-md transition-colors" style={{ color: c.nav }} title="登录"><BookOpen className="w-4 h-4" /></Link>}
          </div>
        </div>
      </header>

      {showSet && (
        <div className="sticky top-12 z-30 border-b transition-colors duration-300" style={{ backgroundColor: c.panel, borderColor: c.border }}>
          <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
            <div className="flex items-center gap-3"><span className="text-xs flex-shrink-0 w-10" style={{ color: c.nav }}>主题</span>
              <div className="flex gap-2">{(["dark","light","sepia","green"] as Theme[]).map(t => <button key={t} onClick={() => setTheme(t)} className={`w-7 h-7 rounded-full border-2 transition-all ${theme===t?"border-white scale-110":"border-transparent"}`} style={{ backgroundColor: TC[t].bg, outline: `1px solid ${c.border}` }} />)}</div>
            </div>
            <div className="flex items-center gap-3"><span className="text-xs flex-shrink-0 w-10" style={{ color: c.nav }}>字体</span>
              <div className="flex gap-2">{[{k:"sans",l:"黑体"},{k:"serif",l:"宋体"},{k:"kai",l:"楷体"}].map(f => <button key={f.k} onClick={() => setFont(f.k as Font)} className={`px-3 py-1 rounded text-xs transition-all border ${font===f.k?"bg-white/10 border-white/30":"border-transparent"}`} style={{ color: font===f.k?c.heading:c.nav }}>{f.l}</button>)}</div>
            </div>
            <div className="flex items-center gap-3"><span className="text-xs flex-shrink-0 w-10" style={{ color: c.nav }}>字号</span>
              <button onClick={() => setFontSize(s => Math.max(0.875, s-0.125))} className="px-2 py-0.5 rounded border text-xs" style={{ borderColor: c.border, color: c.nav }}>小</button>
              <span className="text-xs w-12 text-center" style={{ color: c.heading }}>{Math.round(fontSize*16)}px</span>
              <button onClick={() => setFontSize(s => Math.min(1.5, s+0.125))} className="px-2 py-0.5 rounded border text-xs" style={{ borderColor: c.border, color: c.nav }}>大</button>
            </div>
            <div className="flex items-center gap-3"><span className="text-xs flex-shrink-0 w-10" style={{ color: c.nav }}>行距</span>
              <button onClick={() => setLineHeight(h => Math.max(1.5, h-0.2))} className="px-2 py-0.5 rounded border text-xs" style={{ borderColor: c.border, color: c.nav }}>窄</button>
              <span className="text-xs w-12 text-center" style={{ color: c.heading }}>{lineHeight.toFixed(1)}</span>
              <button onClick={() => setLineHeight(h => Math.min(3, h+0.2))} className="px-2 py-0.5 rounded border text-xs" style={{ borderColor: c.border, color: c.nav }}>宽</button>
            </div>
          </div>
        </div>
      )}

      {showTOC && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setShowTOC(false)}>
          <div className="w-80 max-w-[80vw] h-full overflow-y-auto border-r p-4" style={{ backgroundColor: c.panel, borderColor: c.border }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-medium" style={{ color: c.heading }}>{novel?.title}</h3><button onClick={() => setShowTOC(false)} className="p-1" style={{ color: c.nav }}><X className="w-4 h-4" /></button></div>
            <div className="space-y-0.5">
              {allChapters.map(ch => <Link key={ch.id} to={`/read/${ch.id}`} onClick={() => setShowTOC(false)} className="block py-2 px-3 rounded text-xs transition-colors" style={{ color: ch.id===chapterId?c.heading:c.nav, backgroundColor: ch.id===chapterId?"rgba(255,255,255,0.05)":"transparent" }}>第{ch.order_num}章 · {ch.title}</Link>)}
            </div>
          </div>
          <div className="flex-1" />
        </div>
      )}

      {showCmt && (
        <div className="fixed right-0 top-0 bottom-0 w-80 max-w-[80vw] z-50 border-l overflow-y-auto" style={{ backgroundColor: c.panel, borderColor: c.border }}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-medium" style={{ color: c.heading }}>评论 ({comments.length})</h3><button onClick={() => setShowCmt(false)} className="p-1" style={{ color: c.nav }}><X className="w-4 h-4" /></button></div>
            {user && (
              <div className="mb-4">
                <textarea value={cmtText} onChange={e => { setCmtText(e.target.value); setCmtError(""); }} placeholder="写下你的想法..." className="w-full rounded-md border p-2.5 text-sm resize-none focus:outline-none" style={{ backgroundColor: c.bg, borderColor: c.border, color: c.text }} rows={3} />
                {cmtError && <p className="text-[#c44444] text-xs mt-1.5">{cmtError}</p>}
                <button onClick={sendCmt} disabled={!cmtText.trim()} className="mt-2 w-full py-2 bg-white text-[#0a0a0a] rounded-md text-xs font-medium hover:opacity-85 transition-opacity disabled:opacity-40 flex items-center justify-center gap-1"><Send className="w-3 h-3" />发送</button>
              </div>
            )}
            <div className="space-y-3">
              {comments.length > 0 ? comments.map(cm => (
                <div key={cm.id} className="py-3 border-b" style={{ borderColor: c.border }}>
                  <div className="flex items-center gap-2 mb-1.5"><span className="text-xs font-medium" style={{ color: c.heading }}>{cm.user_name}</span><span className="text-[10px]" style={{ color: c.nav }}>{new Date(cm.created_at).toLocaleDateString("zh-CN")}</span></div>
                  <p className="text-sm leading-relaxed" style={{ color: c.text }}>{cm.content}</p>
                </div>
              )) : <p className="text-center text-xs py-8" style={{ color: c.nav }}>暂无评论</p>}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-10 pb-8 border-b" style={{ borderColor: c.border }}>
          <h1 className="text-xl font-semibold mb-2" style={{ color: c.heading }}>第{chapter.order_num}章 {chapter.title}</h1>
          <span className="text-xs" style={{ color: c.nav }}>{new Date(chapter.created_at).toLocaleDateString("zh-CN")}</span>
        </div>
        <div className="pb-16" style={{ fontSize: `${fontSize}rem`, lineHeight, fontFamily: FF[font] }}>
          {paragraphs.map((p, i) => <p key={i} className="mb-6" style={{ textIndent: "2em" }}>{p}</p>)}
        </div>
        <div className="flex items-center justify-between py-6 border-t" style={{ borderColor: c.border }}>
          {prev ? <button onClick={goPrev} className="flex items-center gap-1 text-sm transition-colors" style={{ color: c.nav }} onMouseEnter={e => e.currentTarget.style.color = c.navHover} onMouseLeave={e => e.currentTarget.style.color = c.nav}><ChevronLeft className="w-4 h-4" />上一章</button> : <span className="text-sm" style={{ color: c.border }}>已是第一章</span>}
          <span className="text-xs" style={{ color: c.nav }}>{currentIdx + 1} / {allChapters.length}</span>
          {next ? <button onClick={goNext} className="flex items-center gap-1 text-sm transition-colors" style={{ color: c.nav }} onMouseEnter={e => e.currentTarget.style.color = c.navHover} onMouseLeave={e => e.currentTarget.style.color = c.nav}>下一章<ChevronRight className="w-4 h-4" /></button> : <span className="text-sm" style={{ color: c.border }}>已是最后一章</span>}
        </div>
      </main>

      <footer className="border-t py-6" style={{ borderColor: c.border, backgroundColor: c.bg }}>
        <div className="max-w-2xl mx-auto px-4 text-center"><p className="text-xs" style={{ color: c.nav }}>冰箱里的世界 · 仅供会员阅读</p></div>
      </footer>
    </div>
  );
}
