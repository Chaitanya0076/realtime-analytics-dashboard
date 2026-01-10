"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const router = useRouter();

    // Email validation
    const validateEmail = (email: string): string | null => {
        if (!email.trim()) {
            return "Email is required";
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return "Please enter a valid email address";
        }
        return null;
    };

    // Password validation
    const validatePassword = (password: string): string | null => {
        if (!password) {
            return "Password is required";
        }
        if (password.length < 6) {
            return "Password must be at least 6 characters";
        }
        return null;
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        setEmailError(validateEmail(value));
        setError(null); // Clear general error when user types
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        setPasswordError(validatePassword(value));
        setError(null); // Clear general error when user types
    };

    async function handleCredentials(e: React.FormEvent) {
        e.preventDefault();
        
        // Validate inputs
        const emailErr = validateEmail(email);
        const passwordErr = validatePassword(password);
        
        setEmailError(emailErr);
        setPasswordError(passwordErr);
        
        if (emailErr || passwordErr) {
            return; // Don't submit if validation fails
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
                callbackUrl: "/dashboard",
            });

            if (res?.ok) {
                router.push("/dashboard"); // protected route
            } else {
                setError(res?.error ?? "Invalid credentials");
                setIsLoading(false);
            }
        } catch {
            setError("An unexpected error occurred");
            setIsLoading(false);
        }
    }

    function handleOAuth(provider: "google" | "github") {
        setIsLoading(true);
        // will redirect away; no need to unset loading here
        signIn(provider, { callbackUrl: "/dashboard" });
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Sign in</h2>
                <form onSubmit={handleCredentials} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            onBlur={() => setEmailError(validateEmail(email))}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                emailError
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                            }`}
                            required
                            disabled={isLoading}
                            placeholder="you@example.com"
                        />
                        {emailError && (
                            <p className="mt-1 text-sm text-red-600">{emailError}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={handlePasswordChange}
                            onBlur={() => setPasswordError(validatePassword(password))}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                                passwordError
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                            }`}
                            required
                            disabled={isLoading}
                            placeholder="Enter your password"
                        />
                        {passwordError && (
                            <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full bg-blue-600 text-white py-2 rounded-md font-medium transition ${
                            isLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-blue-700"
                        }`}
                    >
                        {isLoading ? "Signing in..." : "Sign in"}
                    </button>

                    {error && <p className="text-sm text-red-600 mt-2">Invalid Credentails, check your email or password</p>}
                </form>

                <div className="my-6 border-t border-gray-300"></div>

                <div className="space-y-3">
                    <button
                        onClick={() => handleOAuth("google")}
                        disabled={isLoading}
                        className={`w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-md font-medium transition flex items-center justify-center gap-2 ${
                            isLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50"
                        }`}
                    >
                        {isLoading ? "Redirecting..." : (
                            <>
                                <FcGoogle className="w-5 h-5" /> Sign in with Google
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => handleOAuth("github")}
                        disabled={isLoading}
                        className={`w-full bg-gray-900 text-white py-2 rounded-md font-medium transition flex items-center justify-center gap-2 ${
                            isLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-800"
                        }`}
                    >
                        {isLoading ? "Redirecting..." : (
                            <>
                                <FaGithub className="w-5 h-5" /> Sign in with GitHub
                            </>
                        )}
                    </button>
                </div>
            <p className="mt-4 text-sm text-gray-600 text-center">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="text-blue-600 font-medium hover:underline">
                    Sign up
                </Link>
            </p>
            </div>

        </div>
    );
}
