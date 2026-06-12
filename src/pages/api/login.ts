import type { APIRoute } from 'astro';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: '请填写邮箱和密码' }), { status: 400 });
    }
    
    // 用 Supabase Auth 登录
    const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const loginData = await loginRes.json();
    
    if (!loginRes.ok) {
      return new Response(JSON.stringify({ error: '邮箱或密码错误' }), { status: 400 });
    }
    
    // 返回 token
    return new Response(JSON.stringify({ 
      success: true, 
      token: loginData.access_token,
      user: loginData.user 
    }), { status: 200 });
    
  } catch (err) {
    return new Response(JSON.stringify({ error: '服务器错误' }), { status: 500 });
  }
};