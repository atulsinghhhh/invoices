"use client";
import Link from "next/link";

export default function Sidebar() {
    return (
        <aside className="w-64 bg-white border-r border-gray-100 h-full px-4 py-6">
            <nav className="flex flex-col gap-3 text-sm text-gray-700">
                <Link href="/" className="py-2 px-3 rounded-md hover:bg-gray-50">Dashboard</Link>
                <Link href="/invoices" className="py-2 px-3 rounded-md hover:bg-gray-50">Invoices</Link>
                <Link href="/customers" className="py-2 px-3 rounded-md hover:bg-gray-50">Customers</Link>
                <Link href="/items" className="py-2 px-3 rounded-md hover:bg-gray-50">Items</Link>
                <Link href="/expenses" className="py-2 px-3 rounded-md hover:bg-gray-50">Expenses</Link>
                <Link href="/settings" className="mt-4 py-2 px-3 rounded-md hover:bg-gray-50">Settings</Link>
            </nav>
        </aside>
    );
}
