import type { APIRoute } from 'astro';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { code, email, password } = await request.json();
    
    if (!code || !email || !password) {
      return new Response(JSON.stringify({ error: '请填写所有字段' }), { status: 400 });
    }
    
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: '密码至少6位' }), { status: 400 });
    }
    
    // 1. 验证邀请码
    const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/invite_codes?code=eq.${code}&used=eq.false&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`
      }
    });
    
    const codes = await verifyRes.json();
    
    if (!codes || codes.length === 0) {
      return new Response(JSON.stringify({ error: '邀请码无效或已被使用' }), { status: 400 });
    }
    
    // 2. 用 Supabase Auth 注册用户
    const signUpRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const signUpData = await signUpRes.json();
    
    if (!signUpRes.ok) {
      return new Response(JSON.stringify({ error: signUpData.msg || '注册失败' }), { status: 400 });
    }
    
    // 3. 标记邀请码已使用
    const codeId = codes[0].id;
    await fetch(`${SUPABASE_URL}/rest/v1/invite_codes?id=eq.${codeId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ used: true, used_by: email, used_at: new Date().toISOString() })
    });
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
    
  } catch (err) {
    return new Response(JSON.stringify({ error: '服务器错误' }), { status: 500 });
  }
};