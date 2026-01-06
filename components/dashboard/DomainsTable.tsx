"use client";

import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

interface Domain {
  id: string;
  name: string;
  isActive: boolean;
}

interface DomainsTableProps {
  domains: Domain[];
  onAddDomain: (domain: string) => Promise<void>;
  onDeleteDomain: (id: string) => Promise<void>;
  onToggleStatus: (id: string) => Promise<void>;
  maxDomains?: number;
}

export function DomainsTable({
  domains,
  onAddDomain,
  onDeleteDomain,
  onToggleStatus,
  maxDomains = 5,
}: DomainsTableProps) {
  const [newDomain, setNewDomain] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddDomain = async () => {
    setError('');
    
    if (!newDomain.trim()) {
      setError('Please enter a domain');
      return;
    }

    if (domains.length >= maxDomains) {
      setError(`Domain limit of ${maxDomains} reached`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddDomain(newDomain);
      setNewDomain('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add domain';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddDomain();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your Websites or Domains</h2>
      <p className="text-gray-600 text-sm mb-6">
        Add the domains where you'll embed the tracking script. Maximum {maxDomains} domains per account.
      </p>

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="example.com"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleAddDomain}
            disabled={domains.length >= maxDomains || isSubmitting}
            className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {isSubmitting ? 'Adding...' : 'Add domain'}
          </button>
        </div>
        
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        
        {domains.length >= maxDomains && !error && (
          <p className="mt-3 text-red-600 text-sm font-medium">
            Domain limit of {maxDomains} reached
          </p>
        )}
      </div>

      {domains.length > 0 ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Domain</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Status</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {domains.map((domain) => (
                <tr key={domain.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900">{domain.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        domain.isActive
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}
                    >
                      {domain.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => onToggleStatus(domain.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors hover:underline"
                      >
                        {domain.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => onDeleteDomain(domain.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">No domains added yet. Add your first domain to get started.</p>
        </div>
      )}
    </div>
  );
}

