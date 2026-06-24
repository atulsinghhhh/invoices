"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="h-16 w-full flex items-center justify-between px-6 bg-white border-b border-gray-100">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-lg font-semibold text-gray-900">InvoiceApp</Link>
        <div className="hidden md:block">
          <input
            placeholder="Search invoices, customers..."
            className="w-72 px-3 py-2 rounded-md border border-gray-200 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/invoices/new" className="px-3 py-2 bg-gray-900 text-white rounded-md text-sm">New invoice</Link>
        {session?.user ? (
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-700">{session.user.name ?? session.user.email}</div>
            <button onClick={() => signOut()} className="text-sm text-red-600">Sign out</button>
          </div>
        ) : (
          <>
            <Link href="/auth/login" className="text-sm text-gray-700">Sign in</Link>
            <Link href="/auth/signup" className="text-sm text-gray-700">Sign up</Link>
          </>
        )}
      </div>
    </header>
  );
}
