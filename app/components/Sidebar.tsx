"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
    {
        name: "Dashboard",
        href: "/",
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        ),
    },
    {
        name: "Invoices",
        href: "/invoices",
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        ),
    },
    {
        name: "Customers",
        href: "/customers",
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        ),
    },
    {
        name: "Items",
        href: "/items",
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        ),
    },
    {
        name: "Expenses",
        href: "/expenses",
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        ),
    },
    {
        name: "Settings",
        href: "/settings",
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        ),
    },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-r border-[var(--border)]">
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[var(--border)]">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center shadow-md">
                    <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <span className="text-lg font-bold tracking-tight text-[var(--foreground)]">InvoiceApp</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {links.map(link => {
                    const isActive =
                        link.href === "/"
                            ? pathname === "/"
                            : pathname === link.href || pathname.startsWith(link.href + "/");
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                                isActive
                                    ? "bg-[var(--accent)] text-white shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[var(--foreground)]"
                            }`}
                        >
                            <svg
                                className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "text-gray-400"}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {link.icon}
                            </svg>
                            {link.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom: New Invoice CTA */}
            <div className="px-3 py-4 border-t border-[var(--border)]">
                <Link
                    href="/invoices/new"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-xl transition-all hover:shadow-md"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Invoice
                </Link>
            </div>
        </aside>
    );
}
