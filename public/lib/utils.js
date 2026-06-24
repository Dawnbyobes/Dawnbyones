// ============================================================
// 客户端工具函数
// ============================================================

// Toast 通知
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

// 页面守卫：未登录重定向
export async function requireAuth() {
  const token = localStorage.getItem('sb_token');
  if (!token) {
    window.location.href = '/login';
    return false;
  }
  
  const { getSession } = await import('/lib/supabase.js');
  const session = await getSession();
  if (!session) {
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

// 平滑滚动到指定位置
export function scrollToPosition(y, behavior = 'smooth') {
  window.scrollTo({ top: y, behavior });
}
