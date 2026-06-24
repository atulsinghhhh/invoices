"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

function getPageTitle(pathname: string): string {
    if (pathname === "/") return "Dashboard";
    if (pathname.startsWith("/invoices/new")) return "New Invoice";
    if (pathname.match(/^\/invoices\/\d+/)) return "Invoice Detail";
    if (pathname === "/invoices") return "Invoices";
    if (pathname.match(/^\/customers\/\d+/)) return "Customer Profile";
    if (pathname === "/customers") return "Customers";
    if (pathname === "/expenses") return "Expenses";
    if (pathname === "/items") return "Items";
    if (pathname === "/settings") return "Settings";
    return "InvoiceApp";
}

export default function Header() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const pageTitle = getPageTitle(pathname);
    const initial = session?.user?.name?.charAt(0).toUpperCase() ?? session?.user?.email?.charAt(0).toUpperCase() ?? "U";

    return (
        <header className="h-16 w-full flex items-center justify-between px-6 bg-white/70 dark:bg-gray-900/70 backdrop-blur border-b border-[var(--border)] sticky top-0 z-20">
            {/* Left: page title / breadcrumb */}
            <div className="flex items-center gap-3">
                {/* Mobile logo */}
                <div className="md:hidden flex items-center gap-2 mr-2">
                    <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                </div>
                <h1 className="text-base font-semibold text-[var(--foreground)]">{pageTitle}</h1>
            </div>

            {/* Right: user profile */}
            <div className="flex items-center gap-3">
                {session?.user ? (
                    <>
                        {/* Notification bell placeholder */}
                        <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-[var(--foreground)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>

                        {/* Divider */}
                        <div className="h-6 w-px bg-[var(--border)]" />

                        {/* User avatar + name + sign out */}
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {initial}
                            </div>
                            <div className="hidden md:block">
                                <p className="text-sm font-semibold text-[var(--foreground)] leading-none">{session.user.name ?? "User"}</p>
                                <p className="text-xs text-gray-400 mt-0.5 leading-none truncate max-w-[140px]">{session.user.email}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-rose-500 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign out
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-[var(--foreground)] transition-colors">Sign in</Link>
                        <Link href="/register" className="px-4 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium rounded-full transition-colors">Sign up</Link>
                    </div>
                )}
            </div>
        </header>
    );
}
