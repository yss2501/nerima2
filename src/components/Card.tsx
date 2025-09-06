'use client';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export default function Card({ 
  children, 
  className = '', 
  hover = true,
  padding = 'md'
}: CardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`
      bg-white dark:bg-gray-800 
      rounded-xl shadow-lg 
      border border-gray-200 dark:border-gray-700
      ${paddingClasses[padding]}
      ${hover ? 'hover:shadow-xl hover:scale-[1.02] transition-all duration-200' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}
