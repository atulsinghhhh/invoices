"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/(auth)/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, phone, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Signup failed");
                setLoading(false);
                return;
            }

            // Auto sign-in after signup
            const signInResult = await signIn("credentials", { redirect: false, email, password });
            // @ts-ignore
            if (signInResult?.ok) {
                router.push("/invoices");
            } else {
                router.push("/invoices");
            }
        } catch (err) {
            setError("Unexpected error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto mt-12">
            <h1 className="text-2xl font-semibold mb-4">Sign up</h1>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-sm">
                {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
                <label className="block mb-2 text-sm">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 mb-3 border rounded" />
                <label className="block mb-2 text-sm">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full px-3 py-2 mb-3 border rounded" />
                <label className="block mb-2 text-sm">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 mb-3 border rounded" />
                <label className="block mb-2 text-sm">Password</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full px-3 py-2 mb-4 border rounded" />

                <button disabled={loading} className="w-full px-4 py-2 bg-gray-900 text-white rounded">
                    {loading ? "Signing up..." : "Create account"}
                </button>
            </form>
        </div>
    );
}
