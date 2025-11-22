'use client';

import { signOut } from '@/lib/firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import Link from 'next/link';
import { useState } from 'react';
import { useThemeStore, themes, type ThemeId, darkModeAccents, type DarkModeAccent } from '@/lib/stores/themeStore';
import { AccentColorIcons } from '@/lib/stores/themeIcons';
import Image from 'next/image';

interface DashboardLayoutProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function DashboardLayout({ children, fullWidth = false }: DashboardLayoutProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showDarkModeAccents, setShowDarkModeAccents] = useState(false);
  const { currentTheme, setTheme, darkModeAccent, setDarkModeAccent } = useThemeStore();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      name: 'Projects', 
      href: '/projects', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 bg-background-primary/95 backdrop-blur-sm border-b border-border-subtle">
        <div className="px-4 sm:px-6 lg:px-6">
          <div className="flex justify-between items-center h-12">
            {/* Logo & Nav */}
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden">
                  <Image
                    src={currentTheme === 'dark' ? '/logo_dark.png' : '/logo_light.png'}
                    alt="DoubleCheck Logo"
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
                <span className="text-lg font-bold text-text-primary group-hover:text-accent-primary transition-colors">
                  DoubleCheck
                </span>
              </Link>
              
              <nav className="hidden md:flex gap-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-1.5 text-sm font-medium transition-all flex items-center gap-1.5 ${
                      isActive(item.href)
                        ? 'bg-accent-primary/10 text-accent-primary border-b-2 border-accent-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-accent-primary/5'
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <button className="p-1.5 text-text-secondary hover:text-text-primary transition-colors hover:bg-accent-primary/5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              {/* Theme Switcher */}
              <div className="relative">
                <button
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  className="flex items-center gap-1.5 p-1.5 text-text-secondary hover:text-text-primary transition-colors hover:bg-accent-primary/5"
                  title="Change theme"
                >
                  {themes[currentTheme].icon}
                </button>

                {showThemeMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-background-primary border border-border-default shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="px-4 py-2 border-b border-border-subtle">
                      <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                        Quick Select
                      </p>
                    </div>
                    <div className="py-2 px-4">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Light Mode */}
                        <button
                          onClick={() => {
                            setTheme('light');
                            setShowThemeMenu(false);
                            setShowDarkModeAccents(false);
                          }}
                            className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-all ${
                              currentTheme === 'light'
                                ? 'bg-accent-primary text-white shadow-md'
                                : 'bg-background-primary text-text-secondary hover:text-text-primary hover:bg-accent-primary/5 border border-border-default'
                            }`}
                        >
                          <span className="w-4 h-4 flex items-center justify-center">{themes.light.icon}</span>
                          <span>{themes.light.name.replace(' Mode', '')}</span>
                        </button>
                        
                        {/* Dark Mode with accent selector */}
                        <div className="relative">
                          <button
                            onClick={() => {
                              if (currentTheme !== 'dark') {
                                setTheme('dark');
                              }
                              setShowDarkModeAccents(!showDarkModeAccents);
                            }}
                            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-all ${
                              currentTheme === 'dark'
                                ? 'bg-accent-primary shadow-md'
                                : 'bg-background-primary text-text-secondary hover:text-text-primary hover:bg-accent-primary/5 border border-border-default'
                            }`}
                            style={currentTheme === 'dark' ? { color: 'rgb(var(--colored-button-text))' } : undefined}
                          >
                            <span className="w-4 h-4 flex items-center justify-center">{themes.dark.icon}</span>
                            <span>{themes.dark.name.replace(' Mode', '')}</span>
                            {currentTheme === 'dark' && (
                              <svg 
                                className={`w-3 h-3 transition-transform ${showDarkModeAccents ? 'rotate-180' : ''}`}
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                          </button>
                          
                          {/* Dark Mode Accent Color Submenu */}
                          {showDarkModeAccents && currentTheme === 'dark' && (
                            <div className="absolute left-full ml-2 top-0 w-48 bg-background-primary border border-border-default shadow-xl py-2 z-50">
                              <div className="px-3 py-1.5 border-b border-border-subtle">
                                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                                  Accent Color
                                </p>
                              </div>
                              <div className="py-1">
                                {(Object.keys(darkModeAccents) as DarkModeAccent[]).map((accent) => (
                                  <button
                                    key={accent}
                                    onClick={() => {
                                      setDarkModeAccent(accent);
                                      setShowDarkModeAccents(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                                      darkModeAccent === accent
                                        ? 'bg-accent-primary/10 text-accent-primary'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-accent-primary/5'
                                    }`}
                                  >
                                    <span className="w-4 h-4 flex items-center justify-center">
                                      {AccentColorIcons[accent]}
                                    </span>
                                    <span className="font-medium capitalize">{accent}</span>
                                    {darkModeAccent === accent && (
                                      <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-4 py-2 border-t border-border-subtle">
                      <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                        Themed Modes
                      </p>
                    </div>
                    <div className="py-1">
                      {Object.values(themes).filter(t => t.id !== 'light' && t.id !== 'dark').map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => {
                            setTheme(theme.id);
                            setShowThemeMenu(false);
                            setShowDarkModeAccents(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                            currentTheme === theme.id
                              ? 'bg-accent-primary/10 text-accent-primary'
                              : 'text-text-secondary hover:text-text-primary hover:bg-accent-primary/5'
                          }`}
                        >
                          <span className="w-4 h-4 flex items-center justify-center">{theme.icon}</span>
                          <span className="font-medium">{theme.name}</span>
                          {currentTheme === theme.id && (
                            <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-accent-primary/5 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-semibold">
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
                  <div className="absolute right-0 mt-2 w-56 bg-background-primary border border-border-default shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={fullWidth ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        {children}
      </main>

      {/* Click outside to close menus */}
      {(showUserMenu || showThemeMenu || showDarkModeAccents) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowThemeMenu(false);
            setShowDarkModeAccents(false);
          }}
        />
      )}
    </div>
  );
}
