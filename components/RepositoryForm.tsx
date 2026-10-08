"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RepositoryForm() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }
    setError(null);
    router.push(`/analyze?url=${encodeURIComponent(value.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate={false}>
      <label
        htmlFor="repo-url"
        className="block text-left text-sm font-medium"
      >
        GitHub repository URL
      </label>
      <input
        id="repo-url"
        name="repositoryUrl"
        type="url"
        required
        placeholder="https://github.com/owner/repository"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? "repo-url-error" : undefined}
        className="w-full rounded-md border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-2 focus:outline-blue-600"
      />
      {error && (
        <p id="repo-url-error" role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="w-full rounded-md bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        Analyze Repository
      </button>
    </form>
  );
}
