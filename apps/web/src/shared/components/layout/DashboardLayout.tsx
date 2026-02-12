'use client';

import { signOut } from '@/lib/firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useThemeStore, themes, type ThemeId, darkModeAccents, type DarkModeAccent } from '@/lib/stores/themeStore';
import { AccentColorIcons } from '@/lib/stores/themeIcons';
import { useSidebarProject } from '@/lib/contexts/SidebarContext';
import Image from 'next/image';

interface DashboardLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { name: 'Projects', href: '/projects', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { name: 'Settings', href: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export function DashboardLayout({ children, fullWidth = false }: DashboardLayoutProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showDarkModeAccents, setShowDarkModeAccents] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentTheme, setTheme, darkModeAccent, setDarkModeAccent } = useThemeStore();
  const { project: sidebarProject } = useSidebarProject();

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex bg-transparent relative">
      {/* Sidebar - full height from top; logo at top of sidebar only; click outside dropdowns closes them */}
      <aside className={`fixed lg:static inset-y-0 left-0 top-0 z-40 w-64 min-h-screen flex flex-col bg-background-secondary border-r border-border-subtle transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`} onClick={() => { if (showUserMenu || showThemeMenu) { setShowUserMenu(false); setShowThemeMenu(false); setShowDarkModeAccents(false); } }}>
        {/* Logo at top of sidebar */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border-subtle shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden bg-background-elevated">
              <Image src={currentTheme === 'dark' || currentTheme === 'blue' ? '/logo_dark.png' : '/logo_light.png'} alt="DoubleCheck" width={28} height={28} className="object-contain" />
            </div>
            <span className="font-semibold text-text-primary group-hover:text-accent-primary transition-colors">DoubleCheck</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-background-tertiary" aria-label="Close menu">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.name} href={item.href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(item.href) ? 'bg-accent-primary/15 text-accent-primary' : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
              }`}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              {item.name}
            </Link>
          ))}
          {sidebarProject && (
            <>
              <div className="my-3 border-t border-border-subtle" />
              <div className="px-3 mb-2">
                <Link href="/projects" className="text-xs text-text-tertiary hover:text-accent-primary transition-colors flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Projects
                </Link>
                <p className="text-sm font-semibold text-text-primary truncate mt-1" title={sidebarProject.projectTitle}>{sidebarProject.projectTitle}</p>
              </div>
              {sidebarProject.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { sidebarProject.onNavigate(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                    sidebarProject.activeView === item.id ? 'bg-accent-primary/15 text-accent-primary' : 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary'
                  }`}
                >
                  <span className="w-4 h-4 shrink-0 flex items-center justify-center">{item.icon}</span>
                  {item.name}
                </button>
              ))}
            </>
          )}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}

      {/* Main column only: gradient + header + content; header starts here (second column) */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Gradient spans entire main column (header + content), not sidebar */}
        <div
          className="absolute inset-0 z-0 pointer-events-none min-h-full"
          style={{ background: 'var(--theme-gradient, none)' }}
          aria-hidden
        />
        {/* Header - second column only; no logo; click outside dropdowns closes them */}
        <header className="sticky top-0 z-20 h-14 flex items-center justify-between px-4 lg:px-6 bg-background-primary/90 backdrop-blur-md border-b border-border-subtle shrink-0" onClick={() => { if (showUserMenu || showThemeMenu) { setShowUserMenu(false); setShowThemeMenu(false); setShowDarkModeAccents(false); } }}>
          <button type="button" onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-background-tertiary" aria-label="Open menu">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button className="p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-background-tertiary transition-colors" title="Notifications">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </button>

            {/* Theme switcher */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => { setShowThemeMenu(!showThemeMenu); setShowDarkModeAccents(false); }} className="p-2 text-text-secondary hover:text-text-primary rounded-xl hover:bg-background-tertiary transition-colors" title="Change theme">
                {themes[currentTheme].icon}
              </button>
              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-background-primary border border-border-default shadow-xl py-2 rounded-xl z-[100] animate-in fade-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                  <div className="px-4 py-2 border-b border-border-subtle">
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Theme</p>
                  </div>
                  <div className="py-2 px-4">
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => { setTheme('light'); setShowThemeMenu(false); }} className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${currentTheme === 'light' ? 'btn-grd-primary' : 'bg-background-tertiary text-text-secondary hover:text-text-primary'}`} style={currentTheme === 'light' ? { color: 'rgb(var(--button-text-on-accent))' } : undefined}>{themes.light.icon}<span>Light</span></button>
                      <button type="button" onClick={() => { setTheme('dark'); setShowDarkModeAccents(!showDarkModeAccents); }} className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${currentTheme === 'dark' ? 'btn-grd-primary' : 'bg-background-tertiary text-text-secondary hover:text-text-primary'}`} style={currentTheme === 'dark' ? { color: 'rgb(var(--colored-button-text))' } : undefined}>{themes.dark.icon}<span>Dark</span></button>
                    </div>
                    {showDarkModeAccents && currentTheme === 'dark' && (
                      <div className="mt-2 pt-2 border-t border-border-subtle">
                        <p className="text-xs text-text-tertiary mb-1">Accent</p>
                        <div className="flex flex-wrap gap-1">
                          {(Object.keys(darkModeAccents) as DarkModeAccent[]).map((accent) => (
                            <button type="button" key={accent} onClick={() => setDarkModeAccent(accent)} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${darkModeAccent === accent ? 'bg-accent-primary/15 text-accent-primary' : 'text-text-secondary hover:bg-background-tertiary'}`}>{AccentColorIcons[accent]}<span className="capitalize">{accent}</span></button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-border-subtle pt-2 px-4 pb-2">
                    <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Presets</p>
                    <div className="space-y-1">
                      {Object.values(themes).filter(t => !['light','dark'].includes(t.id)).map((theme) => (
                        <button type="button" key={theme.id} onClick={() => { setTheme(theme.id); setShowThemeMenu(false); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${currentTheme === theme.id ? 'bg-accent-primary/15 text-accent-primary' : 'text-text-secondary hover:bg-background-tertiary'}`}>{theme.icon}<span>{theme.name}</span></button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-background-tertiary transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 btn-grd-primary" style={{ color: 'rgb(var(--button-text-on-accent))' }}>
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-medium text-text-primary">
                      {user?.displayName || 'User'}
                    </p>
                    <p className="text-[10px] text-text-tertiary">{user?.email}</p>
                  </div>
                  <svg className="w-3 h-3 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-background-primary border border-border-default shadow-xl py-2 rounded-xl z-[100] animate-in fade-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                    <div className="px-4 py-3 border-b border-border-subtle">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {user?.email}
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">Free Plan</p>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-accent-primary/5 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </Link>
                      <Link
                        href="/help"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-accent-primary/5 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Help & Support
                      </Link>
                    </div>

                    <div className="border-t border-border-subtle pt-2">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors w-full"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </header>

        {/* Main Content - above gradient; click outside dropdowns closes them */}
        <main className={`flex-1 relative z-10 ${fullWidth ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8'}`} onClick={() => { if (showUserMenu || showThemeMenu) { setShowUserMenu(false); setShowThemeMenu(false); setShowDarkModeAccents(false); } }}>
          {children}
        </main>
      </div>

    </div>
  );
}
