/**
 * 页面过渡动画组件
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
  location: ReturnType<typeof useLocation>;
}

export function PageTransition({ children, location }: PageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // 触发进入动画
      containerRef.current.style.opacity = '0';
      containerRef.current.style.transform = 'translateY(10px)';

      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
          containerRef.current.style.opacity = '1';
          containerRef.current.style.transform = 'translateY(0)';
        }
      });
    }
  }, [location.pathname]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ opacity: '1', transform: 'translateY(0)' }}
    >
      {children}
    </div>
  );
}

export default PageTransition;
