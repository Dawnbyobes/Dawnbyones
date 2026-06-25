import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="text-center py-24">
      <p className="text-[#555] mb-4">页面不存在</p>
      <Link to="/" className="text-sm text-[#888] hover:text-white transition-colors">
        返回首页
      </Link>
    </div>
  );
}
