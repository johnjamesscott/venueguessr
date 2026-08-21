import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Trophy, MapPin, Gift, Users, BarChart2, LogOut, Menu, Zap, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const NAV = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/competitions', label: 'Competitions', icon: Zap },
  { path: '/admin/venues', label: 'Tour Manager', icon: MapPin },
  { path: '/admin/prizes', label: 'Prizes', icon: Gift },
  { path: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/admin/leads', label: 'Leads', icon: Users },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/admin/email-preview', label: 'Email Preview', icon: Mail },
];

export default function AdminLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (nav) => nav.exact
    ? location.pathname === nav.path
    : location.pathname.startsWith(nav.path);

  return (
    <div className="flex h-screen bg-[#0d0d0d] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-[#111] border-r border-[#2a2a2a] flex flex-col transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="flex items-center gap-2 px-4 py-5 border-b border-[#2a2a2a]">
          <img src="https://cdn.prod.website-files.com/63bd498079b1380a81c6e13b/63bd498079b1384ca2c6e19d_HeadBox-Logo-Brick-header.png"
            alt="HeadBox" className="h-6 brightness-0 invert opacity-90" />
        </div>
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#555] mt-2">Admin Portal</div>
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(n => (
            <Link key={n.path} to={n.path} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(n) ? 'bg-[#AF231C] text-white' : 'text-[#aaa] hover:text-white hover:bg-[#1e1e1e]'}`}>
              <n.icon size={16} />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-[#2a2a2a]">
          <button onClick={() => base44.auth.logout('/')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#888] hover:text-white hover:bg-[#1e1e1e] w-full transition-colors">
            <LogOut size={16} />Exit Admin
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 bg-[#111] border-b border-[#2a2a2a] lg:hidden">
          <button onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <span className="text-sm font-bold">VenueGuessr Admin</span>
          <div />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
