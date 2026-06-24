"use client";
import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { usePathname } from "next/navigation";

const AUTH_ROUTES = ["/login", "/register", "/setup"];

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = AUTH_ROUTES.some(r => pathname === r || pathname.startsWith(r));

    if (isAuthPage) {
        // Auth & setup pages render without sidebar/header
        return (
            <div style={{ minHeight: "100vh", background: "var(--background)" }}>
                {children}
            </div>
        );
    }

    return (
        <div className="flex" style={{ minHeight: "100vh", background: "var(--background)" }}>
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 p-6 flex flex-col">
                    {children}
                </main>
            </div>
        </div>
    );
}
