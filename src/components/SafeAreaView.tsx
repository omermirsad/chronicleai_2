import React from 'react';
import { useSafeArea } from '../hooks/useSafeArea';
import { usePlatform } from '../hooks/usePlatform';

interface SafeAreaViewProps {
  children: React.ReactNode;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
  className?: string;
}

export const SafeAreaView: React.FC<SafeAreaViewProps> = ({
  children,
  edges = ['top', 'bottom', 'left', 'right'],
  className = ''
}) => {
  const insets = useSafeArea();
  const { isNative } = usePlatform();

  if (!isNative) {
    return <div className={className}>{children}</div>;
  }

  const paddingStyle = {
    paddingTop: edges.includes('top') ? `${insets.top}px` : 0,
    paddingRight: edges.includes('right') ? `${insets.right}px` : 0,
    paddingBottom: edges.includes('bottom') ? `${insets.bottom}px` : 0,
    paddingLeft: edges.includes('left') ? `${insets.left}px` : 0,
  };

  return (
    <div className={className} style={paddingStyle}>
      {children}
    </div>
  );
};
