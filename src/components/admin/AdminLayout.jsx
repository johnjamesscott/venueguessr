import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  LayoutDashboard, Trophy, MapPin, Gift, Users, BarChart2, LogOut, Menu, X, Mail
} from 'lucide-react';

const NAV = [
  { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
  { label: 'Competitions', path: '/admin/competitions', icon: <Trophy size={18} /> },
  { label: 'Tours', path: '/admin/tours', icon: <MapPin size={18} /> },
  { label: 'Prizes', path: '/admin/prizes', icon: <Gift size={18} /> },
  { label: 'Leaderboard', path: '/admin/leaderboard', icon: <Trophy size={18} /> },
  { label: 'Leads', path: '/admin/leads', icon: <Mail size={18} /> },
  { label: 'Analytics', path: '/admin/analytics', icon: <BarChart2 size={18} /> },
];

export default function AdminLayout({ children }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    base44.auth.me().then(user => {
      if (!user || user.role !== 'admin') {
        base44.auth.redirectToLogin('/admin');
      } else {
        setChecking(false);
      }
    }).catch(() => base44.auth.redirectToLogin('/admin'));
  }, []);

  if (checking) {
    return (
      <div className="fixed inset-0 bg-hb-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-hb-border border-t-hb-red rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hb-bg flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-hb-surface border-r border-hb-border flex flex-col transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex`}>
        <div className="flex items-center gap-2 px-4 py-5 border-b border-hb-border">
          <img src="https://cdn.prod.website-files.com/63bd498079b1380a81c6e13b/63bd498079b1384ca2c6e19d_HeadBox-Logo-Brick-header.png"
            alt="HeadBox" className="h-7 object-contain brightness-0 invert" />
          <span className="text-white font-bold text-sm">Admin</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(n => (
            <Link key={n.path} to={n.path}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname === n.path ? 'bg-hb-red text-white' : 'text-hb-text-muted hover:text-white hover:bg-hb-surface-2'}`}>
              {n.icon}{n.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-hb-border">
          <button onClick={() => base44.auth.logout('/')}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-hb-text-muted hover:text-white hover:bg-hb-surface-2 transition-colors">
            <LogOut size={18} />Log out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-hb-surface border-b border-hb-border">
          <button onClick={() => setOpen(true)}><Menu size={22} className="text-white" /></button>
          <span className="text-white font-bold">VenueGuessr Admin</span>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}