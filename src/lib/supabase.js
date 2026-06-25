// ============================================================
// Supabase 客户端封装
// 使用 Astro 环境变量（PUBLIC_ 前缀）
// 提供认证辅助函数和通用操作方法
// ============================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// 认证相关函数
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('获取会话失败:', error);
    return null;
  }
  return data.session;
}

export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

export async function signOut() {
  await supabase.auth.signOut();
  localStorage.removeItem('sb_token');
  localStorage.removeItem('reader_id');
}

export async function resetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
}

export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
}

// 检查是否为管理员（通过 RPC）
export async function checkIsAdmin() {
  try {
    const { data, error } = await supabase.rpc('is_admin');
    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

// 获取用户资料（匿名编号等）
export async function getProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .single();

  if (error) return null;
  return data;
}

// 更新用户资料 - 修复：添加 user.id 作为 WHERE 条件
export async function updateProfile(updates) {
  const user = await getUser();
  if (!user) return { data: null, error: new Error('未登录') };

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  return { data, error };
}

// 获取章节列表
export async function getChapters(novelId = null) {
  let query = supabase
    .from('chapters')
    .select('*')
    .order('order_num', { ascending: true });

  if (novelId) {
    query = query.eq('novel_id', novelId);
  }

  const { data, error } = await query;
  return { data: data || [], error };
}

// 获取单个章节
export async function getChapter(chapterId) {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .single();

  return { data, error };
}

// 获取公告
export async function getAnnouncement() {
  const { data, error } = await supabase.rpc('get_active_announcement');
  if (error || !data) return '本站为私密阅读空间，禁止任何形式宣传。';
  return data;
}

// 评论相关
export async function getComments(chapterId) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}

export async function addComment(chapterId, content) {
  const user = await getUser();
  if (!user) return { data: null, error: new Error('未登录') };

  // 获取 reader_id
  const profile = await getProfile();
  const readerId = profile?.reader_id || '匿名读者';

  const { data, error } = await supabase
    .from('comments')
    .insert([{
      chapter_id: chapterId,
      content: content.trim(),
      reader_id: readerId,
    }])
    .select()
    .single();

  return { data, error };
}

export async function deleteComment(commentId) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  return { error };
}

// 管理员删除评论
export async function adminDeleteComment(commentId) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  return { error };
}

// 阅读进度
export async function saveProgress(chapterId, scrollPosition) {
  const { data, error } = await supabase.rpc('save_reading_progress', {
    chapter_uuid: chapterId,
    scroll_pos: scrollPosition,
  });
  return { data, error };
}

export async function getProgress(chapterId) {
  const { data, error } = await supabase.rpc('get_reading_progress', {
    chapter_uuid: chapterId,
  });
  if (error) return 0;
  return data || 0;
}

// 书签相关
export async function getBookmarks() {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*, chapters(*)')
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}

export async function addBookmark(chapterId, note = '') {
  const { data, error } = await supabase
    .from('bookmarks')
    .insert([{ chapter_id: chapterId, note }])
    .select()
    .single();

  return { data, error };
}

export async function removeBookmark(bookmarkId) {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', bookmarkId);

  return { error };
}

// 切换书签状态（新增）
export async function toggleBookmark(chapterId) {
  const { data: bookmarks } = await getBookmarks();
  const existing = (bookmarks || []).find(b => b.chapter_id === chapterId);

  if (existing) {
    await removeBookmark(existing.id);
    return { bookmarked: false };
  } else {
    await addBookmark(chapterId);
    return { bookmarked: true };
  }
}

// 邀请码相关
export async function checkInviteCode(code) {
  const { data, error } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', code)
    .eq('used', false)
    .single();

  return { valid: !!data && !error, data, error };
}

export async function consumeInviteCode(code, email) {
  const { error } = await supabase
    .from('invite_codes')
    .update({
      used: true,
      used_by: email,
      used_at: new Date().toISOString(),
    })
    .eq('code', code);

  return { error };
}

// 主题管理
export function getTheme() {
  return localStorage.getItem('theme') || 'dark';
}

export function setTheme(theme) {
  localStorage.setItem('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
}

export function initTheme() {
  const theme = getTheme();
  document.documentElement.setAttribute('data-theme', theme);
}
