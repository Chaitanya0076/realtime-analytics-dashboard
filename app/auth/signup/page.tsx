"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [nameError, setNameError] = useState<string | null>(null);
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

    // Name validation
    const validateName = (name: string): string | null => {
        if (name.trim().length > 0 && name.trim().length < 2) {
            return "Name must be at least 2 characters";
        }
        if (name.trim().length > 50) {
            return "Name must be less than 50 characters";
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
        if (password.length > 128) {
            return "Password must be less than 128 characters";
        }
        return null;
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        setEmailError(validateEmail(value));
        setError(null);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setName(value);
        setNameError(validateName(value));
        setError(null);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        setPasswordError(validatePassword(value));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate all inputs
        const emailErr = validateEmail(email);
        const nameErr = validateName(name);
        const passwordErr = validatePassword(password);
        
        setEmailError(emailErr);
        setNameError(nameErr);
        setPasswordError(passwordErr);
        
        if (emailErr || nameErr || passwordErr) {
            return; // Don't submit if validation fails
        }

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
                    onChange={handleEmailChange}
                    onBlur={() => setEmailError(validateEmail(email))}
                    required
                    placeholder="you@example.com"
                    className={`px-3 py-2 rounded-lg border text-base outline-none transition ${
                        emailError
                            ? "border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500"
                            : "border-gray-300 focus:border-blue-400"
                    }`}
                />
                {emailError && (
                    <p className="text-sm text-red-600 mt-1">{emailError}</p>
                )}
                </div>
                <div className="flex flex-col gap-1">
                <label className="font-medium text-gray-700">Name <span className="text-gray-400 text-sm font-normal">(Optional)</span></label>
                <input
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    onBlur={() => setNameError(validateName(name))}
                    placeholder="Your name"
                    maxLength={50}
                    className={`px-3 py-2 rounded-lg border text-base outline-none transition ${
                        nameError
                            ? "border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500"
                            : "border-gray-300 focus:border-blue-400"
                    }`}
                />
                {nameError && (
                    <p className="text-sm text-red-600 mt-1">{nameError}</p>
                )}
                </div>
                <div className="flex flex-col gap-1">
                <label className="font-medium text-gray-700">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={() => setPasswordError(validatePassword(password))}
                    required
                    placeholder="At least 6 characters"
                    maxLength={128}
                    className={`px-3 py-2 rounded-lg border text-base outline-none transition ${
                        passwordError
                            ? "border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500"
                            : "border-gray-300 focus:border-blue-400"
                    }`}
                />
                {passwordError && (
                    <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                )}
                {!passwordError && password.length > 0 && password.length < 6 && (
                    <p className="text-sm text-yellow-600 mt-1">
                        Password must be at least 6 characters
                    </p>
                )}
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
                    <FcGoogle className="w-5 h-5" /> SignUp with Google
                </button>
                <button 
                    onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                    className="w-full py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                    <FaGithub className="w-5 h-5" /> SignUp with GitHub
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