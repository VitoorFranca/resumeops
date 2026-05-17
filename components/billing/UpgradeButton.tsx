'use client';

import { useState } from 'react';

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    const res = await fetch('/api/billing/checkout', { method: 'POST' });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="inline-block bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
    >
      {loading ? 'Redirecting...' : 'Start 7-day trial — $29/mo'}
    </button>
  );
}
