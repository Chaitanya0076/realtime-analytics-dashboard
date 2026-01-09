"use client";

import { Rocket, CheckCircle2 } from 'lucide-react';

interface WelcomeBannerProps {
  onDismiss?: () => void;
}

export function WelcomeBanner({ onDismiss }: WelcomeBannerProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
      <div className="flex items-start gap-4">
        <div className="bg-blue-600 p-3 rounded-lg flex-shrink-0">
          <Rocket className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome to Analytics Dashboard! 🎉
          </h3>
          <p className="text-gray-700 mb-4">
            Get started tracking your website analytics in just a few simple steps:
          </p>
          <ol className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Add your domain</strong> - Enter your website domain below</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Copy the tracking script</strong> - Get your unique tracking code</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Paste it in your website</strong> - Add the script to your HTML</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Start tracking!</strong> - View your analytics data in real-time</span>
            </li>
          </ol>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

