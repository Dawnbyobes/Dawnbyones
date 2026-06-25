import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, FileText, Users, MessageSquare, Key, BarChart3, Plus, Edit, Trash2, Loader2, Check } from "lucide-react";
import { supabase, type Novel, type Chapter, type InviteCode } from "@/lib/supabase";

type Tab = "dashboard" | "novels" | "chapters" | "readers" | "invites";

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
      {tab === "dashboard" && <Dashboard />}
      {tab === "novels" && <NovelsAdmin />}
      {tab === "chapters" && <ChaptersAdmin />}
      {tab === "readers" && <ReadersAdmin />}
      {tab === "invites" && <InvitesAdmin />}
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({ novels: 0, chapters: 0, users: 0, comments: 0 });
  const [recentCh, setRecentCh] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("novels").select("*", { count: "exact", head: true }).then(({ count }) => setStats(s => ({ ...s, novels: count ?? 0 })));
    supabase.from("chapters").select("*", { count: "exact", head: true }).then(({ count }) => setStats(s => ({ ...s, chapters: count ?? 0 })));
    supabase.from("comments").select("*", { count: "exact", head: true }).then(({ count }) => setStats(s => ({ ...s, comments: count ?? 0 })));
    // 修复：添加读者数量统计
    supabase.from("profiles").select("*", { count: "exact", head: true }).then(({ count }) => setStats(s => ({ ...s, users: count ?? 0 })));
    supabase.from("chapters").select("*, novels(title)").order("created_at", { ascending: false }).limit(5).then(({ data }) => { if (data) setRecentCh(data); });
  }, []);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[{label:"作品",icon:<BookOpen className="w-4 h-4 text-[#555]"/>,v:stats.novels},{label:"章节",icon:<FileText className="w-4 h-4 text-[#555]"/>,v:stats.chapters},{label:"评论",icon:<MessageSquare className="w-4 h-4 text-[#555]"/>,v:stats.comments},{label:"读者",icon:<Users className="w-4 h-4 text-[#555]"/>,v:stats.users}].map((s,i) => (
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

function NovelsAdmin() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Novel | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", description: "", cover: "", category: "", tags: "", status: "ongoing" as "ongoing"|"completed"|"paused", author_note: "" });

  const load = () => supabase.from("novels").select("*").order("updated_at", { ascending: false }).then(({ data }) => { if (data) setNovels(data); });
  useEffect(() => { load(); }, []);

  const reset = () => { setForm({ title: "", slug: "", description: "", cover: "", category: "", tags: "", status: "ongoing", author_note: "" }); setEditing(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug) return;
    const now = new Date().toISOString();
    if (editing) {
      // 修复：更新时包含 updated_at 字段
      await supabase.from("novels").update({ ...form, updated_at: now }).eq("id", editing.id);
    } else {
      await supabase.from("novels").insert({ ...form, word_count: 0, chapter_count: 0, is_published: false, updated_at: now });
    }
    reset(); setShowForm(false); load();
  };

  const del = async (id: number) => { if (!confirm("确定删除？")) return; await supabase.from("novels").delete().eq("id", id); load(); };

  return (
    <div>
      <div className="flex justify-between mb-4"><span className="text-sm text-[#555]">{novels.length} 部作品</span><button onClick={() => { reset(); setShowForm(!showForm); }} className="flex items-center gap-1 px-3 py-1.5 bg-white text-[#0a0a0a] rounded-md text-xs font-medium hover:opacity-85 transition-opacity"><Plus className="w-3.5 h-3.5" />新增作品</button></div>
      {showForm && (
        <form onSubmit={submit} className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4 mb-6 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="作品标题 *" value={form.title} onChange={e => setForm({...form,title:e.target.value})} required className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444]" />
            <input placeholder="URL标识 *" value={form.slug} onChange={e => setForm({...form,slug:e.target.value})} required className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444]" />
          </div>
          <textarea placeholder="简介" value={form.description} onChange={e => setForm({...form,description:e.target.value})} rows={2} className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444] resize-none" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="封面 URL" value={form.cover} onChange={e => setForm({...form,cover:e.target.value})} className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444]" />
            <input placeholder="分类" value={form.category} onChange={e => setForm({...form,category:e.target.value})} className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444]" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="标签（逗号分隔）" value={form.tags} onChange={e => setForm({...form,tags:e.target.value})} className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444]" />
            <select value={form.status} onChange={e => setForm({...form,status:e.target.value as any})} className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#444]"><option value="ongoing">连载中</option><option value="completed">已完结</option><option value="paused">暂停</option></select>
          </div>
          <textarea placeholder="作者的话" value={form.author_note} onChange={e => setForm({...form,author_note:e.target.value})} rows={2} className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444] resize-none" />
          <div className="flex gap-2"><button type="submit" className="px-4 py-2 bg-white text-[#0a0a0a] rounded-md text-xs font-medium hover:opacity-85 transition-opacity">{editing ? "更新" : "创建"}</button><button type="button" onClick={() => { reset(); setShowForm(false); }} className="px-4 py-2 border border-[#333] text-[#888] rounded-md text-xs hover:border-[#555] hover:text-white transition-colors">取消</button></div>
        </form>
      )}
      <div className="space-y-2">
        {novels.map(n => <div key={n.id} className="flex items-center justify-between py-3 px-4 bg-[#111] border border-[#1a1a1a] rounded-lg"><div className="min-w-0 flex-1"><p className="text-white text-sm font-medium truncate">{n.title}</p><p className="text-[#555] text-xs">/{n.slug} · {n.chapter_count}章</p></div><div className="flex items-center gap-1 flex-shrink-0 ml-4"><button onClick={() => { setEditing(n); setForm({ title: n.title, slug: n.slug, description: n.description??"", cover: n.cover??"", category: n.category??"", tags: n.tags??"", status: n.status, author_note: n.author_note??"" }); setShowForm(true); }} className="p-1.5 text-[#555] hover:text-white transition-colors"><Edit className="w-3.5 h-3.5" /></button><button onClick={() => del(n.id)} className="p-1.5 text-[#555] hover:text-[#c44444] transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></div></div>)}
      </div>
    </div>
  );
}

function ChaptersAdmin() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [selNovel, setSelNovel] = useState<number | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Chapter | null>(null);
  const [form, setForm] = useState({ novel_id: 0, title: "", order_num: 1, content: "", status: "published" as "draft"|"published" });

  useEffect(() => { supabase.from("novels").select("*").then(({ data }) => { if (data) setNovels(data); }); }, []);

  const loadCh = () => {
    if (!selNovel) return;
    supabase.from("chapters").select("*").eq("novel_id", selNovel).order("order_num").then(({ data }) => { if (data) setChapters(data); });
  };
  useEffect(() => { loadCh(); }, [selNovel]);

  const sel = novels.find(n => n.id === selNovel);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content || !selNovel) return;
    const wordCount = form.content.length;
    const now = new Date().toISOString();
    if (editing) {
      // 修复：更新时包含 updated_at 字段
      await supabase.from("chapters").update({ title: form.title, order_num: form.order_num, content: form.content, status: form.status, word_count: wordCount, updated_at: now }).eq("id", editing.id);
    } else {
      const id = crypto.randomUUID();
      await supabase.from("chapters").insert({ id, novel_id: selNovel, title: form.title, order_num: form.order_num, content: form.content, status: form.status, word_count: wordCount, updated_at: now });
    }
    setShowForm(false); setEditing(null); setForm({ novel_id: 0, title: "", order_num: 1, content: "", status: "published" }); loadCh();
  };

  const del = async (id: string) => { if (!confirm("确定删除？")) return; await supabase.from("chapters").delete().eq("id", id); loadCh(); };

  return (
    <div>
      <div className="mb-4">
        <select value={selNovel ?? ""} onChange={e => setSelNovel(Number(e.target.value) || null)} className="w-full sm:w-auto bg-[#111] border border-[#1a1a1a] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#444]">
          <option value="">选择作品...</option>{novels.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
        </select>
      </div>
      {sel && <>
        <div className="flex justify-between items-center mb-4"><span className="text-sm text-[#555]">{chapters.length} 章 · {sel.title}</span><button onClick={() => { setEditing(null); setForm({ novel_id: selNovel!, title: "", order_num: chapters.length + 1, content: "", status: "published" }); setShowForm(!showForm); }} className="flex items-center gap-1 px-3 py-1.5 bg-white text-[#0a0a0a] rounded-md text-xs font-medium hover:opacity-85 transition-opacity"><Plus className="w-3.5 h-3.5" />新增章节</button></div>
        {showForm && (
          <form onSubmit={submit} className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4 mb-6 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3"><input placeholder="章节标题 *" value={form.title} onChange={e => setForm({...form,title:e.target.value})} required className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444]" /><input type="number" placeholder="序号" value={form.order_num} onChange={e => setForm({...form,order_num:Number(e.target.value)})} min={1} className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444]" /></div>
            <select value={form.status} onChange={e => setForm({...form,status:e.target.value as any})} className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#444]"><option value="published">已发布</option><option value="draft">草稿</option></select>
            <textarea placeholder="章节内容 *" value={form.content} onChange={e => setForm({...form,content:e.target.value})} rows={12} required className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444] resize-y leading-relaxed" />
            <div className="flex gap-2"><button type="submit" className="px-4 py-2 bg-white text-[#0a0a0a] rounded-md text-xs font-medium hover:opacity-85 transition-opacity">{editing ? "更新" : "发布"}</button><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-[#333] text-[#888] rounded-md text-xs hover:border-[#555] hover:text-white transition-colors">取消</button></div>
          </form>
        )}
        <div className="space-y-2">{chapters.map(ch => <div key={ch.id} className="flex items-center justify-between py-3 px-4 bg-[#111] border border-[#1a1a1a] rounded-lg"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-[#555] text-xs">第{ch.order_num}章</span><span className="text-white text-sm">{ch.title}</span><span className={`text-[10px] px-1.5 py-0.5 rounded ${ch.status==="published"?"bg-[#1a2a1a] text-[#7c9a6e]":"bg-[#2a2a1a] text-[#9a9a6e]"}`}>{ch.status==="published"?"已发布":"草稿"}</span></div><p className="text-[#555] text-xs mt-0.5">{ch.word_count?.toLocaleString() ?? 0} 字</p></div><div className="flex items-center gap-1 flex-shrink-0 ml-4"><button onClick={() => { setEditing(ch); setForm({ novel_id: selNovel!, title: ch.title, order_num: ch.order_num, content: ch.content, status: ch.status }); setShowForm(true); }} className="p-1.5 text-[#555] hover:text-white transition-colors"><Edit className="w-3.5 h-3.5" /></button><button onClick={() => del(ch.id)} className="p-1.5 text-[#555] hover:text-[#c44444] transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></div></div>)}</div>
      </>}
      {!selNovel && <div className="text-center py-20 text-[#555] text-sm">请先选择一个作品</div>}
    </div>
  );
}

// 修复：ReadersAdmin 现在显示真正的读者列表
function ReadersAdmin() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [codes, setCodes] = useState<InviteCode[]>([]);

  useEffect(() => {
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).then(({ data }) => { if (data) setProfiles(data); });
    supabase.from("invite_codes").select("*").order("created_at", { ascending: false }).then(({ data }) => { if (data) setCodes(data); });
  }, []);

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <div className="bg-[#111] border border-[#1a1a1a] rounded-lg px-4 py-3"><p className="text-[#555] text-xs">总读者</p><p className="text-xl font-semibold text-white">{profiles.length}</p></div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-lg px-4 py-3"><p className="text-[#555] text-xs">已用邀请码</p><p className="text-xl font-semibold text-white">{codes.filter(c => c.used).length}</p></div>
        <div className="bg-[#111] border border-[#1a1a1a] rounded-lg px-4 py-3"><p className="text-[#555] text-xs">剩余邀请码</p><p className="text-xl font-semibold text-white">{codes.filter(c => !c.used).length}</p></div>
      </div>
      <h3 className="text-sm font-medium text-white mb-4">读者列表</h3>
      <div className="space-y-2">
        {profiles.map(p => <div key={p.id} className="flex items-center justify-between py-3 px-4 bg-[#111] border border-[#1a1a1a] rounded-lg">
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{p.display_name ?? "未命名读者"}</p>
            <p className="text-[#555] text-xs">ID: {p.reader_id}</p>
          </div>
          <span className="text-[#444] text-xs flex-shrink-0">{new Date(p.created_at).toLocaleDateString("zh-CN")}</span>
        </div>)}
      </div>
      {profiles.length === 0 && <div className="text-center py-12 text-[#555] text-sm">暂无读者</div>}
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
