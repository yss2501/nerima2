'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function CommonHeader() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'ホーム', icon: '🏠' },
    { href: '/spots', label: 'スポット一覧', icon: '📍' },
    { href: '/route', label: 'ルート生成', icon: '🗺️' },
    { href: '/admin', label: '管理', icon: '⚙️' },
  ];

  return (
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🏯</span>
            <span className="text-xl font-bold text-white">練馬ワンダーランド</span>
          </Link>

          {/* ナビゲーション */}
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  pathname === item.href
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
