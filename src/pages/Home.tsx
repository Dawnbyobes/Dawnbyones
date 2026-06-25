import { Link } from "react-router-dom";
import { Lock, RefreshCw, MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <div>
      <section className="text-center py-24 sm:py-32 px-4">
        <h1 className="text-4xl sm:text-5xl font-semibold text-white mb-6 tracking-tight">冰箱里的世界</h1>
        <p className="text-[#666] text-base sm:text-lg max-w-md mx-auto mb-10 leading-relaxed">只有受邀者才能进入的小世界。</p>
        <Link to="/login" className="inline-block bg-white text-[#0a0a0a] px-10 py-3.5 rounded-md text-sm font-medium hover:opacity-85 transition-opacity">
          会员制登录
        </Link>
      </section>

      <div className="max-w-2xl mx-auto px-4">
        <div className="h-px bg-[#1a1a1a] mb-16" />

        <section className="mb-16">
          <h2 className="text-xs text-[#555] uppercase tracking-[0.15em] mb-8">关于本站</h2>
          <div className="space-y-0">
            {[
              { icon: <Lock className="w-4 h-4 text-[#666]" />, title: "纯粹体验", desc: "私密阅读，只有你和故事。" },
              { icon: <RefreshCw className="w-4 h-4 text-[#666]" />, title: "持续更新", desc: "作者不定期更新章节，敬请期待。" },
              { icon: <MessageSquare className="w-4 h-4 text-[#666]" />, title: "联系方式", desc: "不可申请，仅限受邀会员。" },
            ].map((f, i) => (
              <div key={i} className="py-5 border-b border-[#111] last:border-b-0">
                <h3 className="text-white text-base font-medium mb-1.5 flex items-center gap-2">{f.icon}{f.title}</h3>
                <p className="text-[#666] text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
