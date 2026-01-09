"use client";

import { useState } from 'react';
import { Copy, Check, Code, FileText, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface TrackingScriptProps {
  domain?: string;
}

export function TrackingScript({ domain }: TrackingScriptProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Get the base URL dynamically
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    // Fallback for SSR
    return process.env.NEXT_PUBLIC_ANALYTICS_URL || 'https://analyticspro.devwithease.com';
  };

  const baseUrl = getBaseUrl();
  const scriptUrl = `${baseUrl}/tracker.js`;
  const scriptTag = `<script src="${scriptUrl}" async></script>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scriptTag);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 mb-4 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-gray-700" />
          <h2 className="text-2xl font-semibold text-gray-900">Tracking Script</h2>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="space-y-4">
          {domain && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Domain:</strong> {domain}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Make sure this domain matches the domain where you&apos;re placing the script.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Copy this script and paste it into your website:
            </label>
            <div className="relative">
              <pre className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-sm overflow-x-auto">
                <code className="text-gray-800">{scriptTag}</code>
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
            {copied && (
              <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                Copied to clipboard!
              </p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Where to Place the Script
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Option 1: In the &lt;head&gt; section (Recommended)</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Place the script tag in the <code className="bg-gray-100 px-1 py-0.5 rounded">&lt;head&gt;</code> section of your HTML, before the closing <code className="bg-gray-100 px-1 py-0.5 rounded">&lt;/head&gt;</code> tag:
                </p>
                <pre className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-xs overflow-x-auto">
                  <code>{`<!DOCTYPE html>
                          <html>
                          <head>
                            <title>Your Website</title>
                            ${scriptTag}
                          </head>
                          <body>
                            <!-- Your website content -->
                          </body>
                          </html>`}
                  </code>
                </pre>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Option 2: Before the closing &lt;/body&gt; tag</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Alternatively, place it just before the closing <code className="bg-gray-100 px-1 py-0.5 rounded">&lt;/body&gt;</code> tag:
                </p>
                <pre className="bg-gray-50 border border-gray-300 rounded-lg p-3 text-xs overflow-x-auto">
                  <code>{`<!DOCTYPE html>
                          <html>
                          <head>
                            <title>Your Website</title>
                          </head>
                          <body>
                            <!-- Your website content -->
                            ${scriptTag}
                          </body>
                          </html>`}
                  </code>
                </pre>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>Make sure the domain is registered in your dashboard before adding the script</li>
                  <li>The script will automatically track page views on the domain where it&apos;s placed</li>
                  <li>Works with both static HTML and dynamic websites (React, Next.js, etc.)</li>
                  <li>The script loads asynchronously and won&apos;t block your page load</li>
                  <li>After adding the script, visit your website to see tracking data appear in the dashboard</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Need help?</strong> The script will automatically detect your domain and start tracking page views.
              Make sure your domain is added and active in the dashboard above.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

