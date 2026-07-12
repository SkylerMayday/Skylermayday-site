"use client";

import { useState } from "react";

interface ChannelSearchProps {
  onSearch: (login: string) => void;
  loading: boolean;
}

/** Controlled channel-login search box. Trims + lowercases before firing onSearch. */
export function ChannelSearch({ onSearch, loading }: ChannelSearchProps) {
  const [value, setValue] = useState("");

  function submit() {
    const login = value.trim().toLowerCase();
    if (!login) return;
    onSearch(login);
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="sa-channel-input" className="text-sm font-medium">
        Twitch channel
      </label>
      <div className="flex gap-2">
        <input
          id="sa-channel-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="channel name (e.g. skylermayday)"
          disabled={loading}
          className="flex-1 rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm disabled:opacity-50 dark:border-neutral-700"
        />
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {loading ? "Loading…" : "Search"}
        </button>
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span
            className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent"
            aria-hidden="true"
          />
          Loading channel data…
        </div>
      )}
    </div>
  );
}
