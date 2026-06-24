"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegisterPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        const response = await fetch("/api/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            setError(result.error || "Failed to create account");
            setLoading(false);
        } else {
            await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });
            window.location.href = "/setup";
        }
    }

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50/50">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
                    Create an account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors">
                        Sign in instead
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-4 shadow-xl shadow-gray-200/50 sm:rounded-3xl sm:px-10 border border-gray-100">
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 mb-6">
                            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-semibold text-[var(--foreground)] mb-1.5">
                                Full name
                            </label>
                            <input
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                placeholder="Rahul Sharma"
                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-[var(--foreground)] mb-1.5">
                                Email address
                            </label>
                            <input
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="you@example.com"
                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-[var(--foreground)] mb-1.5">phone</label>
                            <input
                                name="phone"
                                type="text"
                                required
                                autoComplete="phone"
                                placeholder="1234567890"
                                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-white dark:bg-gray-800 text-[var(--foreground)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-shadow text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[var(--foreground)] mb-1.5">Password</label>
                            <input
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                placeholder="Min. 8 characters"
                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all text-sm"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)] transition-all disabled:opacity-70"
                            >
                                {loading ? (
                                    <>
                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Creating account...
                                    </>
                                ) : "Create account"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
