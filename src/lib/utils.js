// ============================================================
// 工具函数
// ============================================================

// Toast 通知系统
export function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 防抖
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// 节流
export function throttle(fn, limit = 300) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 格式化日期
export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

// 确认对话框
export function confirmAction(message) {
  return new Promise((resolve) => {
    const result = window.confirm(message);
    resolve(result);
  });
}

// 检查认证状态（用于页面守卫）
export async function requireAuth() {
  const token = localStorage.getItem('sb_token');
  if (!token) {
    window.location.href = '/login';
    return false;
  }
  
  // 验证 token 是否有效
  const { supabase } = await import('./supabase.js');
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    localStorage.removeItem('sb_token');
    window.location.href = '/login';
    return false;
  }
  
  return true;
}

// 搜索高亮
export function highlightText(text, keyword) {
  if (!keyword) return text;
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark style="background:#3a3020;color:#e8c97a;">$1</mark>');
}
