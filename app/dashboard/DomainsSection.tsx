"use client";

import React, { useState } from "react";

type Domain = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

type Props = {
  initialDomains: Domain[];
}

export default function DomainSection({ initialDomains }: Props){
  const [domains, setDomains] = useState<Domain[]>(initialDomains);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to add domain");
      } else {
        setDomains((prev) => [data.domain, ...prev]);
        setName("");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      const res = await fetch(`/api/domains/${id}`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to update domain");
        return;
      }

      setDomains((prev) =>
        prev.map((d) => (d.id === id ? data.domain : d))
      );
    } catch (error) {
      console.log("error while toggling domain:", error);
      setError("Something went wrong");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/domains/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to delete domain");
        return;
      }

      setDomains((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.log("error while deleting domain:", err);
      setError("Something went wrong");
    }
  }

  const isEmpty = domains.length === 0;

  return (
    <div className="space-y-4">
      {/* Form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder="example.com"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 border rounded-md px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm rounded-md border bg-black text-white disabled:opacity-60"
        >
          {isSubmitting ? "Adding..." : "Add domain"}
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* List / empty state */}
      {isEmpty ? (
        <div className="text-sm text-gray-500 border rounded-md p-4">
          You haven&apos;t added any domains yet. Add your first domain above
          to start tracking events.
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden text-sm">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Domain</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((domain) => (
                <tr key={domain.id} className="border-t">
                  <td className="px-3 py-2">{domain.name}</td>
                  <td className="px-3 py-2">
                    {domain.isActive ? (
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(domain.id)}
                      className="text-xs underline"
                    >
                      {domain.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(domain.id)}
                      className="text-xs text-red-600 underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

