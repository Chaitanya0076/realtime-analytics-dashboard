"use client";

import Link from "next/link";
import { BarChart3, TrendingUp, Zap, Shield, Globe, ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [isVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Analytics",
      description: "Track your website performance with live data updates every minute",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Advanced Insights",
      description: "Get detailed analytics on page views, traffic sources, and user behavior",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      description: "Your data is encrypted and stored securely. Full control over your analytics",
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Multi-Domain Support",
      description: "Track up to 5 domains from a single dashboard with ease",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Analytics Pro</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-4">
              <Link
                href="/auth/signin"
                className="px-3 sm:px-4 py-2 text-gray-700 font-medium hover:text-gray-900 transition-colors text-sm sm:text-base"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg text-sm sm:text-base"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          <div
            className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
              isMobileMenuOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="py-4 space-y-3 border-t border-gray-200">
              <Link
                href="/auth/signin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors text-center"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block mx-4 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md text-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div
            className={`text-center transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Real-time Analytics
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Track your website performance with powerful, real-time analytics.
              Understand your visitors, optimize your content, and grow your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/signup"
                className="group px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/auth/signin"
                className="px-8 py-4 bg-white text-gray-700 rounded-lg font-semibold text-lg border-2 border-gray-300 hover:border-gray-400 transition-all shadow-md hover:shadow-lg"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div
            className={`mt-20 transition-all duration-1000 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 overflow-hidden">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-xl">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
                    <div className="text-sm text-gray-600 mb-2">Total Page Views</div>
                    <div className="text-3xl font-bold text-gray-900">12.4K</div>
                    <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +12.5% from last week
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
                    <div className="text-sm text-gray-600 mb-2">Active Domains</div>
                    <div className="text-3xl font-bold text-gray-900">3 / 5</div>
                    <div className="text-xs text-blue-600 mt-2">2 slots available</div>
                  </div>
                  <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
                    <div className="text-sm text-gray-600 mb-2">Avg. Session</div>
                    <div className="text-3xl font-bold text-gray-900">2m 34s</div>
                    <div className="text-xs text-purple-600 mt-2">+8.2% improvement</div>
                  </div>
                </div>

                {/* Chart Preview */}
                <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Page Views (Last 7 Days)</h3>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    </div>
                  </div>
                  <div className="h-64 relative">
                    {/* Chart Bars */}
                    <div className="absolute bottom-0 left-0 right-0 h-full flex items-end justify-between gap-2 px-2">
                      {[65, 80, 45, 90, 70, 85, 95].map((height, i) => (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-2"
                        >
                          <div
                            className="w-full rounded-t transition-all duration-1000 ease-out bg-gradient-to-t from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500"
                            style={{
                              height: `${height}%`,
                              animationDelay: `${i * 0.1}s`,
                              animation: `growUp 1s ease-out ${i * 0.1}s both`,
                            }}
                          ></div>
                          <div className="text-xs text-gray-500 font-medium">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-400 pr-2">
                      <span>1000</span>
                      <span>750</span>
                      <span>500</span>
                      <span>250</span>
                      <span>0</span>
                    </div>
                  </div>
                </div>

                {/* Mini Chart Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
                    <div className="text-sm text-gray-600 mb-3">Top Pages</div>
                    <div className="space-y-3">
                      {['/home', '/products', '/about'].map((page, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 truncate">{page}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                style={{
                                  width: `${[85, 70, 55][i]}%`,
                                  animation: `slideIn 1s ease-out ${i * 0.2}s both`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600 w-12 text-right">
                              {[850, 700, 550][i]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
                    <div className="text-sm text-gray-600 mb-3">Traffic Sources</div>
                    <div className="space-y-3">
                      {[
                        { name: 'Direct', value: 45, color: 'bg-blue-500' },
                        { name: 'Search', value: 30, color: 'bg-purple-500' },
                        { name: 'Social', value: 25, color: 'bg-pink-500' },
                      ].map((source, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-gray-200 flex-shrink-0">
                            <div
                              className={`w-full h-full rounded-full ${source.color}`}
                              style={{
                                animation: `fadeIn 0.5s ease-out ${i * 0.2}s both`,
                              }}
                            ></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-700">{source.name}</span>
                              <span className="text-xs text-gray-600">{source.value}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${source.color} rounded-full transition-all duration-1000`}
                                style={{
                                  width: `${source.value}%`,
                                  animation: `slideIn 1s ease-out ${i * 0.2}s both`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Add CSS animations */}
            <style jsx>{`
              @keyframes growUp {
                from {
                  height: 0;
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
              @keyframes slideIn {
                from {
                  width: 0;
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
              @keyframes fadeIn {
                from {
                  opacity: 0;
                  transform: scale(0.8);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
            `}</style>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features to help you understand and grow your online presence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
              >
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="text-white">
              <div className="text-5xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100 text-lg">Uptime</div>
            </div>
            <div className="text-white">
              <div className="text-5xl font-bold mb-2">Real-time</div>
              <div className="text-blue-100 text-lg">Data Updates</div>
            </div>
            <div className="text-white">
              <div className="text-5xl font-bold mb-2">5</div>
              <div className="text-blue-100 text-lg">Domains per Account</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of websites already using Analytics Pro to track their performance
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="group px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/auth/signin"
              className="px-8 py-4 bg-white text-gray-700 rounded-lg font-semibold text-lg border-2 border-gray-300 hover:border-gray-400 transition-all shadow-md hover:shadow-lg"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Analytics Pro</span>
          </div>
          <p className="text-sm">© 2026 Analytics Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
