import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, FileText, Users, Key, BarChart3, Plus, Edit, Trash2, Loader2, Check, Volume2, Megaphone, Eye, EyeOff } from "lucide-react";
import { supabase, type Novel, type InviteCode, type Announcement } from "@/lib/supabase";
import ReadersAdmin from "./admin/ReadersAdmin";
import ChaptersAdmin from "./admin/ChaptersAdmin";

type Tab = "dashboard" | "novels" | "chapters" | "announcements" | "readers" | "invites";

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<Tab>("dashboard");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user?.email) {
        supabase.from("admins").select("*").eq("email", data.user.email).limit(1).then(({ data: admins }) => {
          setIsAdmin(!!admins && admins.length > 0);
          setChecking(false);
        });
      } else { setChecking(false); }
    });
  }, []);

  if (checking) return <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-[#555]" /></div>;
  if (!isAdmin) return <div className="max-w-4xl mx-auto px-4 py-20 text-center"><p className="text-[#555] mb-4">无权访问</p><Link to="/" className="text-[#888] text-sm hover:text-white transition-colors">返回首页</Link></div>;

  const tabs = [
    { key: "dashboard" as Tab, label: "概览", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "novels" as Tab, label: "作品", icon: <BookOpen className="w-4 h-4" /> },
    { key: "chapters" as Tab, label: "章节", icon: <FileText className="w-4 h-4" /> },
    { key: "announcements" as Tab, label: "公告", icon: <Megaphone className="w-4 h-4" /> },
    { key: "readers" as Tab, label: "读者", icon: <Users className="w-4 h-4" /> },
    { key: "invites" as Tab, label: "邀请码", icon: <Key className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold text-white">管理后台</h1>
        <span className="text-xs text-[#555]">{user?.user_metadata?.name ?? user?.email ?? "管理员"}</span>
      </div>
      <div className="flex gap-1 mb-8 border-b border-[#1a1a1a] overflow-x-auto">
        {tabs.map(t => <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors whitespace-nowrap ${tab===t.key?"border-white text-white":"border-transparent text-[#555] hover:text-[#888]"}`}>{t.icon}{t.label}</button>)}
      </div>
      {tab === "dashboard" && <DashboardTab />}
      {tab === "novels" && <NovelsAdmin />}
      {tab === "chapters" && <ChaptersAdmin />}
      {tab === "announcements" && <AnnouncementsAdmin />}
      {tab === "readers" && <ReadersAdmin />}
      {tab === "invites" && <InvitesAdmin />}
    </div>
  );
}

function DashboardTab() {
  const [stats, setStats] = useState({ novels: 0, chapters: 0, users: 0, announcements: 0 });
  const [recentCh, setRecentCh] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("novels").select("*", { count: "exact", head: true }).then(({ count }) => setStats(s => ({ ...s, novels: count ?? 0 })));
    supabase.from("chapters").select("*", { count: "exact", head: true }).then(({ count }) => setStats(s => ({ ...s, chapters: count ?? 0 })));
    supabase.from("profiles").select("*", { count: "exact", head: true }).then(({ count }) => setStats(s => ({ ...s, users: count ?? 0 })));
    supabase.from("announcements").select("*", { count: "exact", head: true }).then(({ count }) => setStats(s => ({ ...s, announcements: count ?? 0 })));
    supabase.from("chapters").select("*, novels(title)").order("created_at", { ascending: false }).limit(5).then(({ data }) => { if (data) setRecentCh(data); });
  }, []);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[{label:"作品",icon:<BookOpen className="w-4 h-4 text-[#555]"/>,v:stats.novels},{label:"章节",icon:<FileText className="w-4 h-4 text-[#555]"/>,v:stats.chapters},{label:"读者",icon:<Users className="w-4 h-4 text-[#555]"/>,v:stats.users},{label:"公告",icon:<Volume2 className="w-4 h-4 text-[#555]"/>,v:stats.announcements}].map((s,i) => (
          <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4"><div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-[#555]">{s.label}</span></div><p className="text-2xl font-semibold text-white">{s.v}</p></div>
        ))}
      </div>
      <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4">
        <h3 className="text-sm font-medium text-white mb-4">最新章节</h3>
        {recentCh.length > 0 ? <div className="space-y-3">{recentCh.map(ch => <div key={ch.id} className="flex items-center justify-between text-sm"><div className="min-w-0"><p className="text-[#aaa] truncate">第{ch.order_num}章 · {ch.title}</p><p className="text-[#555] text-xs">{ch.novels?.title}</p></div><span className="text-[#444] text-xs flex-shrink-0">{new Date(ch.created_at).toLocaleDateString("zh-CN")}</span></div>)}</div> : <p className="text-[#555] text-sm">暂无章节</p>}
      </div>
    </div>
  );
}

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, "-").replace(/^-+|$/g, "") || "untitled";
}

function NovelsAdmin() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Novel | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"ongoing"|"completed"|"paused">("ongoing");
  const [publishNow, setPublishNow] = useState(true);
  const [error, setError] = useState("");

  const load = () => supabase.from("novels").select("*").order("updated_at", { ascending: false }).then(({ data }) => { if (data) setNovels(data); });
  useEffect(() => { load(); }, []);

  const reset = () => { setTitle(""); setDescription(""); setCategory(""); setStatus("ongoing"); setPublishNow(true); setEditing(null); setError(""); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("请输入作品标题"); return; }
    const slug = generateSlug(title.trim());
    const now = new Date().toISOString();
    setError("");
    try {
      if (editing) {
        const { error: updErr } = await supabase.from("novels").update({ title: title.trim(), description: description || null, category: category || null, status, updated_at: now }).eq("id", editing.id);
        if (updErr) { setError(updErr.message); return; }
      } else {
        const { error: insErr } = await supabase.from("novels").insert({ title: title.trim(), slug, description: description || null, category: category || null, status, word_count: 0, chapter_count: 0, is_published: publishNow, updated_at: now });
        if (insErr) { setError("创建失败: " + insErr.message); return; }
      }
      reset(); setShowForm(false); load();
    } catch (err: any) { setError(err.message || "操作失败"); }
  };

  const del = async (id: number) => { if (!confirm("确定删除？")) return; await supabase.from("novels").delete().eq("id", id); load(); };
  const togglePublish = async (n: Novel) => { await supabase.from("novels").update({ is_published: !n.is_published, updated_at: new Date().toISOString() }).eq("id", n.id); load(); };

  return (
    <div>
      <div className="flex justify-between mb-4"><span className="text-sm text-[#555]">{novels.length} 部作品</span><button onClick={() => { reset(); setShowForm(!showForm); }} className="flex items-center gap-1 px-3 py-1.5 bg-white text-[#0a0a0a] rounded-md text-xs font-medium hover:opacity-85 transition-opacity"><Plus className="w-3.5 h-3.5" />新增作品</button></div>
      {showForm && (
        <form onSubmit={submit} className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4 mb-6 space-y-3">
          <input placeholder="作品标题 *" value={title} onChange={e => { setTitle(e.target.value); setError(""); }} required className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444]" />
          <textarea placeholder="简介（可选）" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444] resize-none" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="分类（如：科幻、言情）" value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444]" />
            <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#444]"><option value="ongoing">连载中</option><option value="completed">已完结</option><option value="paused">暂停</option></select>
          </div>
          {!editing && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="publish" checked={publishNow} onChange={e => setPublishNow(e.target.checked)} className="w-4 h-4 accent-white" />
              <label htmlFor="publish" className="text-sm text-[#aaa]">创建后立即发布（读者可见）</label>
            </div>
          )}
          {error && <p className="text-[#c44444] text-xs">{error}</p>}
          <div className="flex gap-2"><button type="submit" className="px-4 py-2 bg-white text-[#0a0a0a] rounded-md text-xs font-medium hover:opacity-85 transition-opacity">{editing ? "更新" : "创建"}</button><button type="button" onClick={() => { reset(); setShowForm(false); }} className="px-4 py-2 border border-[#333] text-[#888] rounded-md text-xs hover:border-[#555] hover:text-white transition-colors">取消</button></div>
        </form>
      )}
      <div className="space-y-2">
        {novels.map(n => <div key={n.id} className="flex items-center justify-between py-3 px-4 bg-[#111] border border-[#1a1a1a] rounded-lg"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-white text-sm font-medium truncate">{n.title}</p><span className={`text-[10px] px-1.5 py-0.5 rounded ${n.is_published?"bg-[#1a2a1a] text-[#7c9a6e]":"bg-[#2a2a2a] text-[#666]"}`}>{n.is_published?"已发布":"未发布"}</span><span className={`text-[10px] px-1.5 py-0.5 rounded ${n.status==="ongoing"?"bg-[#1a1a2a] text-[#7e8aad]":n.status==="completed"?"bg-[#2a1a1a] text-[#ad8a7e]":"bg-[#2a2a1a] text-[#9a9a6e]"}`}>{n.status==="ongoing"?"连载中":n.status==="completed"?"已完结":"暂停"}</span></div><p className="text-[#555] text-xs">{n.chapter_count}章 · {n.word_count.toLocaleString()}字 · {n.category ?? "未分类"}</p></div><div className="flex items-center gap-1 flex-shrink-0 ml-4"><button onClick={() => togglePublish(n)} className="p-1.5 text-[#555] hover:text-white transition-colors" title={n.is_published?"下架":"发布"}>{n.is_published?<EyeOff className="w-3.5 h-3.5" />:<Eye className="w-3.5 h-3.5" />}</button><button onClick={() => { setEditing(n); setTitle(n.title); setDescription(n.description??""); setCategory(n.category??""); setStatus(n.status); setShowForm(true); }} className="p-1.5 text-[#555] hover:text-white transition-colors"><Edit className="w-3.5 h-3.5" /></button><button onClick={() => del(n.id)} className="p-1.5 text-[#555] hover:text-[#c44444] transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></div></div>)}
      </div>
    </div>
  );
}

function AnnouncementsAdmin() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [content, setContent] = useState("");
  const [active, setActive] = useState(true);

  const load = () => supabase.from("announcements").select("*").order("created_at", { ascending: false }).then(({ data }) => { if (data) setAnnouncements(data); });
  useEffect(() => { load(); }, []);

  const reset = () => { setContent(""); setActive(true); setEditing(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    const now = new Date().toISOString();
    if (editing) {
      await supabase.from("announcements").update({ content: content.trim(), active, updated_at: now }).eq("id", editing.id);
    } else {
      await supabase.from("announcements").insert({ content: content.trim(), active, updated_at: now });
    }
    reset(); setShowForm(false); load();
  };

  const del = async (id: string) => { if (!confirm("确定删除这条公告？")) return; await supabase.from("announcements").delete().eq("id", id); load(); };
  const toggleActive = async (a: Announcement) => {
    await supabase.from("announcements").update({ active: !a.active, updated_at: new Date().toISOString() }).eq("id", a.id);
    load();
  };

  return (
    <div>
      <div className="flex justify-between mb-4"><span className="text-sm text-[#555]">{announcements.length} 条公告</span><button onClick={() => { reset(); setShowForm(!showForm); }} className="flex items-center gap-1 px-3 py-1.5 bg-white text-[#0a0a0a] rounded-md text-xs font-medium hover:opacity-85 transition-opacity"><Plus className="w-3.5 h-3.5" />发布公告</button></div>
      {showForm && (
        <form onSubmit={submit} className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4 mb-6 space-y-3">
          <textarea placeholder="公告内容 *" value={content} onChange={e => setContent(e.target.value)} rows={4} required className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444] resize-none" />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={active} onChange={e => setActive(e.target.checked)} className="w-4 h-4 accent-white" />
            <label htmlFor="active" className="text-sm text-[#aaa]">立即显示</label>
          </div>
          <div className="flex gap-2"><button type="submit" className="px-4 py-2 bg-white text-[#0a0a0a] rounded-md text-xs font-medium hover:opacity-85 transition-opacity">{editing ? "更新" : "发布"}</button><button type="button" onClick={() => { reset(); setShowForm(false); }} className="px-4 py-2 border border-[#333] text-[#888] rounded-md text-xs hover:border-[#555] hover:text-white transition-colors">取消</button></div>
        </form>
      )}
      <div className="space-y-2">
        {announcements.map(a => <div key={a.id} className="flex items-center justify-between py-3 px-4 bg-[#111] border border-[#1a1a1a] rounded-lg"><div className="min-w-0 flex-1"><div className="flex items-center gap-2 mb-1"><span className={`text-[10px] px-1.5 py-0.5 rounded ${a.active?"bg-[#1a2a1a] text-[#7c9a6e]":"bg-[#2a2a2a] text-[#666]"}`}>{a.active?"显示中":"已隐藏"}</span><span className="text-[#444] text-xs">{new Date(a.created_at).toLocaleDateString("zh-CN")}</span></div><p className="text-[#aaa] text-sm">{a.content}</p></div><div className="flex items-center gap-1 flex-shrink-0 ml-4"><button onClick={() => toggleActive(a)} className="p-1.5 text-[#555] hover:text-white transition-colors" title={a.active?"隐藏":"显示"}><Volume2 className="w-3.5 h-3.5" /></button><button onClick={() => { setEditing(a); setContent(a.content); setActive(a.active); setShowForm(true); }} className="p-1.5 text-[#555] hover:text-white transition-colors"><Edit className="w-3.5 h-3.5" /></button><button onClick={() => del(a.id)} className="p-1.5 text-[#555] hover:text-[#c44444] transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></div></div>)}
        {announcements.length === 0 && <div className="text-center py-12 text-[#555] text-sm">暂无公告</div>}
      </div>
    </div>
  );
}

function InvitesAdmin() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [count, setCount] = useState(5);
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const load = () => supabase.from("invite_codes").select("*").order("created_at", { ascending: false }).then(({ data }) => { if (data) setCodes(data); });
  useEffect(() => { load(); }, []);

  const gen = async () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const items = Array.from({ length: count }, () => {
      let c = ""; for (let i = 0; i < 12; i++) { if (i > 0 && i % 4 === 0) c += "-"; c += chars[Math.floor(Math.random() * chars.length)]; }
      return { code: c, note: note || null };
    });
    await supabase.from("invite_codes").insert(items);
    load();
  };

  const copy = (code: string) => { navigator.clipboard.writeText(code).then(() => { setCopied(code); setTimeout(() => setCopied(null), 2000); }); };

  return (
    <div>
      <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-white mb-3">生成邀请码</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1"><label className="text-xs text-[#555] block mb-1">数量</label><input type="number" value={count} onChange={e => setCount(Number(e.target.value))} min={1} max={50} className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#444]" /></div>
          <div className="flex-[2]"><label className="text-xs text-[#555] block mb-1">备注</label><input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="备注" className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444]" /></div>
          <button onClick={gen} className="px-4 py-2 bg-white text-[#0a0a0a] rounded-md text-xs font-medium hover:opacity-85 transition-opacity flex-shrink-0">生成</button>
        </div>
      </div>
      <div className="flex justify-between items-center mb-4"><span className="text-sm text-[#555]">共 {codes.length} 个</span><span className="text-xs text-[#555]">已用: {codes.filter(c => c.used).length} / {codes.length}</span></div>
      <div className="space-y-2">{codes.map(code => <div key={code.id} className={`flex items-center justify-between py-3 px-4 border rounded-lg ${code.used ? "bg-[#0a0a0a] border-[#111] opacity-60" : "bg-[#111] border-[#1a1a1a]"}`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">{code.used ? <Check className="w-4 h-4 text-[#4caa4c] flex-shrink-0" /> : <Key className="w-4 h-4 text-[#555] flex-shrink-0" />}<div className="min-w-0"><p className="text-sm font-mono" style={{ color: code.used ? "#555" : "#aaa" }}>{code.code}</p>{code.note && <p className="text-[#555] text-xs">{code.note}</p>}</div></div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">{code.used && code.used_at && <span className="text-[#555] text-xs">{new Date(code.used_at).toLocaleDateString("zh-CN")}</span>}{!code.used && <button onClick={() => copy(code.code)} className="text-xs px-3 py-1 bg-[#1a1a1a] rounded hover:bg-[#222] transition-colors" style={{ color: copied === code.code ? "#4caa4c" : "#888" }}>{copied === code.code ? "已复制" : "复制"}</button>}</div>
      </div>)}</div>
      {codes.length === 0 && <div className="text-center py-12 text-[#555] text-sm">暂无邀请码</div>}
    </div>
  );
}
