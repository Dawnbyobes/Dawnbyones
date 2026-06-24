// ============================================================
// Supabase 客户端封装 - 客户端模块
// 纯静态站点版本，使用全局环境变量
// ============================================================

const SUPABASE_URL = 'https://cwkqlwdeteitisdrlwmg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3a3Fsd2RldGVpdGlzZHJsd21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyODkwMzMsImV4cCI6MjA5Njg2NTAzM30.hSbK_Z1rH9pXUwpfh2o5ZxbpkRUyy_7xDYcrmvLXgq8';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// 认证相关
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

export async function resetPassword(email, redirectUrl) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl || `${window.location.origin}/reset-password`,
  });
  return { data, error };
}

export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
}

// 检查是否为管理员
export async function checkIsAdmin() {
  try {
    const { data, error } = await supabase.rpc('is_admin');
    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

// 获取用户资料
export async function getProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .single();
  
  if (error) return null;
  return data;
}

export async function updateProfile(updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .select()
    .single();
  
  return { data, error };
}

// 章节相关
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

export async function getChapter(chapterId) {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .single();
  
  return { data, error };
}

export async function createChapter(title, orderNum, content, novelId = null) {
  const insert = { title, order_num: orderNum, content };
  if (novelId) insert.novel_id = novelId;
  
  const { data, error } = await supabase
    .from('chapters')
    .insert([insert])
    .select()
    .single();
  
  return { data, error };
}

export async function updateChapter(chapterId, updates) {
  const { data, error } = await supabase
    .from('chapters')
    .update(updates)
    .eq('id', chapterId)
    .select()
    .single();
  
  return { data, error };
}

export async function deleteChapter(chapterId) {
  const { error } = await supabase
    .from('chapters')
    .delete()
    .eq('id', chapterId);
  
  return { error };
}

// 小说相关
export async function getNovels() {
  const { data, error } = await supabase
    .from('novels')
    .select('*')
    .order('created_at', { ascending: true });
  
  return { data: data || [], error };
}

// 公告
export async function getAnnouncement() {
  const { data, error } = await supabase.rpc('get_active_announcement');
  if (error || !data) return '本站为私密阅读空间，禁止任何形式宣传。';
  return data;
}

// 评论
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

// 阅读进度
export async function saveProgress(chapterId, scrollPosition) {
  const { data, error } = await supabase.rpc('save_reading_progress', {
    chapter_uuid: chapterId,
    scroll_pos: Math.round(scrollPosition),
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

// 书签
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

export async function toggleBookmark(chapterId) {
  // 检查是否已收藏
  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('chapter_id', chapterId)
    .maybeSingle();
  
  if (existing) {
    await removeBookmark(existing.id);
    return { bookmarked: false };
  } else {
    await addBookmark(chapterId);
    return { bookmarked: true };
  }
}

// 管理员功能
export async function adminGenerateInviteCode() {
  const { data, error } = await supabase.rpc('admin_generate_invite_code');
  return { data, error };
}

export async function adminListInviteCodes() {
  const { data, error } = await supabase.rpc('admin_list_invite_codes');
  return { data: data || [], error };
}

export async function adminListUsers() {
  const { data, error } = await supabase.rpc('admin_list_users');
  return { data: data || [], error };
}

export async function adminGetStats() {
  const { data, error } = await supabase.rpc('admin_get_stats');
  return { data, error };
}

export async function adminUpdateAnnouncement(id, content, active) {
  const { data, error } = await supabase.rpc('admin_update_announcement', {
    announcement_id: id,
    new_content: content,
    is_active: active,
  });
  return { data, error };
}

export async function adminCreateAnnouncement(content) {
  const { data, error } = await supabase.rpc('admin_create_announcement', {
    new_content: content,
  });
  return { data, error };
}

export async function adminDeleteComment(commentId) {
  const { data, error } = await supabase.rpc('admin_delete_comment', {
    comment_id: commentId,
  });
  return { data, error };
}

export async function adminDeleteChapter(chapterId) {
  const { data, error } = await supabase.rpc('admin_delete_chapter', {
    chapter_id: chapterId,
  });
  return { data, error };
}

// 邀请码验证
export async function checkInviteCode(code) {
  const { data, error } = await supabase.rpc('check_invite_code', {
    invite_code: code,
  });
  return { valid: !!data, error };
}

export async function consumeInviteCode(code, email) {
  const { data, error } = await supabase.rpc('consume_invite_code', {
    invite_code: code,
    user_email: email,
  });
  return { success: !!data, error };
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
