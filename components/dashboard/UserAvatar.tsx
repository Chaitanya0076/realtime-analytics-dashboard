"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronDown } from 'lucide-react';

interface UserAvatarProps {
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

export function UserAvatar({ email, name, image }: UserAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  const getInitials = () => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={name || email || 'User'}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
              unoptimized
            />
          ) : (
            getInitials()
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-600 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold overflow-hidden">
                  {image ? (
                    <Image
                      src={image}
                      alt={name || email || 'User'}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    getInitials()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {name && (
                    <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                  )}
                  {email && (
                    <p className="text-xs text-gray-500 truncate">{email}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
