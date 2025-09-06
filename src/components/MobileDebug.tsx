import React from 'react';

export const MobileDebug: React.FC = () => {
  const [isMobile, setIsMobile] = React.useState(false);
  const [windowWidth, setWindowWidth] = React.useState(0);

  React.useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setIsMobile(width <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <div>Mobile Debug</div>
      <div>Width: {windowWidth}px</div>
      <div>Is Mobile: {isMobile ? 'Yes' : 'No'}</div>
      <div>Body BG: {document.body.style.background || 'none'}</div>
      <div>HTML BG: {document.documentElement.style.background || 'none'}</div>
    </div>
  );
};
