import React from 'react';
import {
  MousePointer,
  Briefcase,
  Skull,
  Camera,
  Footprints,
  Box,
  User,
  Layers,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface SystemIconProps extends LucideProps {
  name: string;
}

export const SystemIcon: React.FC<SystemIconProps> = ({ name, ...props }) => {
  switch (name.toLowerCase()) {
    case 'interaction':
      return <MousePointer {...props} />;
    case 'inventory':
      return <Briefcase {...props} />;
    case 'enemy':
      return <Skull {...props} />;
    case 'camera':
      return <Camera {...props} />;
    case 'locomotion':
      return <Footprints {...props} />;
    case 'props':
      return <Box {...props} />;
    case 'character':
      return <User {...props} />;
    default:
      return <Layers {...props} />;
  }
};
