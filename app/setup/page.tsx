"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        const response = await fetch("/api/business/setup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        setLoading(false);
        if (!response.ok) {
            setError(result.error || "Failed to setup business");
        } else {
            window.location.href = "/";
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl border border-[var(--border)]">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-[var(--foreground)]">Set up your business</h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Let's get your invoice profile ready.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3 mb-6">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Legal Business Name</label>
                            <input name="legalName" type="text" required className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trade Name / Display Name</label>
                            <input name="tradeName" type="text" required className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                            <input name="address" type="text" required className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                            <input name="state" type="text" required className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State Code (GST)</label>
                            <input name="stateCode" type="text" required className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Registration Type</label>
                            <select name="registrationType" required className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                                <option value="REGULAR">Regular</option>
                                <option value="COMPOSITION">Composition</option>
                                <option value="UNREGISTERED">Unregistered</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GSTIN (15 characters)</label>
                            <input name="gstin" type="text" required minLength={15} maxLength={15} className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                        </div>
                    </div>

                    <div>
                        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
                            {loading ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Saving...
                                </>
                            ) : "Complete Setup"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
