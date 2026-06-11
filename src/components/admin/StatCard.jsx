import React from 'react';

const colorMap = {
  red: 'text-hb-red',
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  blue: 'text-blue-400',
};

export default function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-hb-surface border border-hb-border rounded-lg p-4 flex flex-col gap-2">
      <div className={`flex items-center gap-2 ${color ? colorMap[color] : 'text-hb-text-muted'}`}>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-black ${color ? colorMap[color] : 'text-white'}`}>{value}</div>
    </div>
  );
}