"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, name, password }),
        });

        if (response.ok) {
            router.push("/auth/signin");
        } else {
            const data = await response.json();
            setError(data.error || "An unexpected error occurred");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-100 to-blue-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl min-w-[340px] w-full max-w-md">
            <h1 className="mb-6 text-3xl font-bold text-center text-gray-800">Create Account</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                <label className="font-medium text-gray-700">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="px-3 py-2 rounded-lg border border-gray-300 text-base outline-none focus:border-blue-400 transition"
                />
                </div>
                <div className="flex flex-col gap-1">
                <label className="font-medium text-gray-700">Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-base outline-none focus:border-blue-400 transition"
                />
                </div>
                <div className="flex flex-col gap-1">
                <label className="font-medium text-gray-700">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="px-3 py-2 rounded-lg border border-gray-300 text-base outline-none focus:border-blue-400 transition"
                />
                </div>
                {error && (
                <p className="text-red-500 text-center font-medium m-0">{error}</p>
                )}
                <button
                type="submit"
                disabled={loading}
                className={`mt-2 py-3 rounded-lg font-bold text-lg text-white shadow-md transition 
                    ${loading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-linear-to-r from-indigo-600 to-blue-400 hover:from-indigo-700 hover:to-blue-500 cursor-pointer"
                    }`}
                >
                {loading ? "Creating Account..." : "Sign Up"}
                </button>
            </form>

            <div className="my-6">
                <div className="flex items-center gap-4">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="text-gray-500 text-sm font-medium">Or</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                </div>
            </div>
            <div className="flex flex-col gap-3">
                <button 
                    onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                    className="w-full py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                    <span>🔍</span> SignUp with Google
                </button>
                <button 
                    onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                    className="w-full py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                    <span>⚙️</span> SignUp with GitHub
                </button>
            </div>

            <p className="mt-4 text-center text-gray-600">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-blue-500 hover:underline font-medium">
                Sign In
                </Link>
            </p>

            </div>
        </div>
    );
}