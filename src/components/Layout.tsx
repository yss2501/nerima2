'use client';

import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
}

export default function Layout({ 
  children, 
  title, 
  subtitle, 
  showHeader = true 
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showHeader && (title || subtitle) && (
          <div className="mb-8">
            <div className="text-center">
              {title && (
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}
        
        <div className="space-y-8">
          {children}
        </div>
      </main>
      
      {/* フッター */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="text-2xl">🏯</div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                練馬ワンダーランド
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © 2024 練馬ワンダーランド. 練馬区の観光スポットを探索しよう！
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
