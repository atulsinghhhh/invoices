"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("credentials", { redirect: false, email, password });
      // @ts-ignore
      if (res?.ok) {
        router.push("/invoices");
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError("Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-sm">
        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
        <label className="block mb-2 text-sm">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full px-3 py-2 mb-3 border rounded" />
        <label className="block mb-2 text-sm">Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full px-3 py-2 mb-4 border rounded" />

        <button disabled={loading} className="w-full px-4 py-2 bg-gray-900 text-white rounded">
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="mt-4 text-sm text-center">
          <button type="button" className="text-blue-600" onClick={() => signIn("google")}>Sign in with Google</button>
        </div>
      </form>
    </div>
  );
}
