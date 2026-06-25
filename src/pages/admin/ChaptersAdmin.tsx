import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Upload, Loader2, ChevronDown, ChevronUp, X } from "lucide-react";
import { supabase, type Novel, type Chapter } from "@/lib/supabase";

export default function ChaptersAdmin() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [selNovel, setSelNovel] = useState<number | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Chapter | null>(null);
  const [form, setForm] = useState({ novel_id: 0, title: "", order_num: 1, content: "", status: "published" as "draft"|"published" });

  // 批量导入状态
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<{ order_num: number; title: string; content: string }[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importCount, setImportCount] = useState(0);

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
      await supabase.from("chapters").update({ title: form.title, order_num: form.order_num, content: form.content, status: form.status, word_count: wordCount, updated_at: now }).eq("id", editing.id);
    } else {
      const id = crypto.randomUUID();
      await supabase.from("chapters").insert({ id, novel_id: selNovel, title: form.title, order_num: form.order_num, content: form.content, status: form.status, word_count: wordCount, updated_at: now });
    }
    setShowForm(false); setEditing(null); setForm({ novel_id: 0, title: "", order_num: 1, content: "", status: "published" }); loadCh();
  };

  const del = async (id: string) => { if (!confirm("确定删除？")) return; await supabase.from("chapters").delete().eq("id", id); loadCh(); };

  // ============ 批量导入 ============

  // 解析章节标题行，返回 [order_num, title] 或 null
  const parseChapterLine = (line: string): [number, string] | null => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // 格式1: "1 标题" / "1  标题"（用户格式，最优先）
    let m = trimmed.match(/^\d+\s+(.+)$/);
    if (m) {
      const num = parseInt(trimmed.match(/^(\d+)/)![1], 10);
      return [num, m[1].trim()];
    }

    // 格式2: "第1章 标题" / "第1章：标题" / "第1章 - 标题"
    m = trimmed.match(/^第\s*(\d+)\s*章\s*[：:\-—\s]*(.+)$/);
    if (m) return [parseInt(m[1], 10), m[2].trim()];

    // 格式3: "Chapter 1 标题" / "Chapter 1: 标题"
    m = trimmed.match(/^Chapter\s*(\d+)\s*[：:\-—\s]*(.+)$/i);
    if (m) return [parseInt(m[1], 10), m[2].trim()];

    // 格式4: "1. 标题" / "1、标题"
    m = trimmed.match(/^(\d+)\s*[.、]\s*(.+)$/);
    if (m) return [parseInt(m[1], 10), m[2].trim()];

    return null;
  };

  const handleParse = () => {
    setImportError("");
    if (!importText.trim()) { setImportError("请先粘贴小说内容"); return; }

    const lines = importText.split("\n");
    const chapters: { order_num: number; title: string; content_lines: string[] }[] = [];
    let current: { order_num: number; title: string; content_lines: string[] } | null = null;

    for (const line of lines) {
      const parsed = parseChapterLine(line);
      if (parsed) {
        // 新章节开始
        const [num, title] = parsed;
        if (current) chapters.push(current);
        current = { order_num: num, title, content_lines: [] };
      } else if (current) {
        // 正文内容
        current.content_lines.push(line);
      }
    }
    if (current) chapters.push(current);

    if (chapters.length === 0) {
      setImportError("未识别到任何章节。请确保每章标题格式正确，如：1 初入仙门");
      return;
    }

    // 去重：如果章节号重复，保留第一个
    const seen = new Set<number>();
    const unique = chapters.filter(ch => {
      if (seen.has(ch.order_num)) return false;
      seen.add(ch.order_num);
      return true;
    });

    setImportPreview(unique.map(ch => ({
      order_num: ch.order_num,
      title: ch.title,
      content: ch.content_lines.join("\n").trim(),
    })));
    setImportCount(unique.length);
  };

  const handleConfirmImport = async () => {
    if (!selNovel || importPreview.length === 0 || !sel) return;
    if (!confirm(`确认导入 ${importPreview.length} 章到《${sel.title}》？`)) return;

    setImportLoading(true);
    setImportError("");

    // 批量插入，每批50条
    const batchSize = 50;
    const items = importPreview.map(ch => ({
      id: crypto.randomUUID(),
      novel_id: selNovel,
      title: ch.title,
      order_num: ch.order_num,
      content: ch.content,
      status: "published",
      word_count: ch.content.length,
      updated_at: new Date().toISOString(),
    }));

    try {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const { error } = await supabase.from("chapters").insert(batch);
        if (error) {
          setImportError(`第 ${i + 1}-${Math.min(i + batchSize, items.length)} 章导入失败: ${error.message}`);
          setImportLoading(false);
          loadCh();
          return;
        }
      }
      setImportPreview([]);
      setImportText("");
      setImportCount(0);
      loadCh();
    } catch (e: any) {
      setImportError("导入异常: " + (e.message || "未知错误"));
    }

    setImportLoading(false);
  };

  const removePreviewItem = (idx: number) => {
    setImportPreview(prev => {
      const next = prev.filter((_, i) => i !== idx);
      setImportCount(next.length);
      return next;
    });
  };

  const updatePreviewTitle = (idx: number, title: string) => {
    setImportPreview(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], title };
      return next;
    });
  };

  return (
    <div>
      <div className="mb-4">
        <select value={selNovel ?? ""} onChange={e => setSelNovel(Number(e.target.value) || null)} className="w-full sm:w-auto bg-[#111] border border-[#1a1a1a] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#444]">
          <option value="">选择作品...</option>{novels.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
        </select>
      </div>
      {sel && <>
        <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
          <span className="text-sm text-[#555]">{chapters.length} 章 · {sel.title}</span>
          <div className="flex gap-2">
            <button onClick={() => { setShowImport(!showImport); setShowForm(false); }} className="flex items-center gap-1 px-3 py-1.5 border border-[#333] text-[#888] rounded-md text-xs hover:border-[#555] hover:text-white transition-opacity">
              <Upload className="w-3.5 h-3.5" />批量导入{showImport ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <button onClick={() => { setEditing(null); setForm({ novel_id: selNovel!, title: "", order_num: chapters.length + 1, content: "", status: "published" }); setShowForm(!showForm); setShowImport(false); }} className="flex items-center gap-1 px-3 py-1.5 bg-white text-[#0a0a0a] rounded-md text-xs font-medium hover:opacity-85 transition-opacity"><Plus className="w-3.5 h-3.5" />新增章节</button>
          </div>
        </div>

        {/* 批量导入面板 */}
        {showImport && (
          <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">批量导入章节</h3>
              <button onClick={() => setShowImport(false)} className="p-1 text-[#555] hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[#555] text-xs">
              粘贴小说全文，系统会自动识别章节标题。支持的格式：<br/>
              <code className="text-[#888]">1 初入仙门</code>（你的格式）·
              <code className="text-[#888]">第1章 标题</code> ·
              <code className="text-[#888]">Chapter 1 标题</code>
            </p>
            <textarea
              placeholder="粘贴小说内容...&#10;1 初入仙门&#10;正文第一段...&#10;正文第二段...&#10;2 灵根测试&#10;正文..."
              value={importText}
              onChange={e => { setImportText(e.target.value); setImportError(""); }}
              rows={10}
              className="w-full bg-[#0a0a0a] border border-[#222] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#444] resize-y leading-relaxed"
            />
            {importError && <p className="text-[#c44444] text-xs">{importError}</p>}
            <div className="flex gap-2">
              <button onClick={handleParse} className="px-4 py-2 bg-white text-[#0a0a0a] rounded-md text-xs font-medium hover:opacity-85 transition-opacity">解析章节</button>
              <button onClick={() => { setImportText(""); setImportPreview([]); setImportCount(0); setImportError(""); }} className="px-4 py-2 border border-[#333] text-[#888] rounded-md text-xs hover:border-[#555] hover:text-white transition-colors">清空</button>
            </div>

            {/* 预览区域 */}
            {importPreview.length > 0 && (
              <div className="mt-4 border-t border-[#1a1a1a] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm text-white">预览：共 {importCount} 章</h4>
                  <button
                    onClick={handleConfirmImport}
                    disabled={importLoading}
                    className="px-4 py-2 bg-white text-[#0a0a0a] rounded-md text-xs font-medium hover:opacity-85 transition-opacity disabled:opacity-40 flex items-center gap-1"
                  >
                    {importLoading ? <><Loader2 className="w-3 h-3 animate-spin" />导入中...</> : <>确认导入全部</>}
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
                  {importPreview.map((ch, idx) => (
                    <div key={idx} className="flex items-center gap-2 py-1.5 px-2 bg-[#0a0a0a] rounded text-xs group">
                      <span className="text-[#555] w-10 text-right flex-shrink-0">第{ch.order_num}章</span>
                      <input
                        value={ch.title}
                        onChange={e => updatePreviewTitle(idx, e.target.value)}
                        className="flex-1 bg-transparent text-[#aaa] focus:text-white focus:outline-none border-b border-transparent focus:border-[#444] min-w-0"
                      />
                      <span className="text-[#444] flex-shrink-0">{ch.content.length.toLocaleString()}字</span>
                      <button
                        onClick={() => removePreviewItem(idx)}
                        className="p-1 text-[#555] hover:text-[#c44444] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        title="移除"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 单章表单 */}
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
