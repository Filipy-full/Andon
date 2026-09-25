import React from 'react';
import { PackageX, Settings, ShieldAlert, Ban, PenTool, AlertTriangle, Zap } from 'lucide-react';

export function IconResolver({ name, size = 24, color = 'currentColor', ...props }) {
  const icons = {
    'package-x': PackageX,
    'settings': Settings,
    'shield-alert': ShieldAlert,
    'ban': Ban,
    'tool': PenTool,
    'alert-triangle': AlertTriangle
  };
  
  const IconComponent = icons[name] || Zap;
  return <IconComponent size={size} color={color} {...props} />;
}
