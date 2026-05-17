'use client';

import { useState } from 'react';
import Link from 'next/link';

const STATUSES = ['Evaluated', 'Applied', 'Interview', 'Offer', 'Rejected', 'Discarded'] as const;

type Application = {
  id: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  jobId: string;
  job: { title: string | null; company: string | null; matchScore: number | null; url: string | null };
};

export default function ApplicationTable({ applications }: { applications: Application[] }) {
  const [rows, setRows] = useState(applications);

  async function handleStatusChange(id: string, status: string) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
            <th className="pb-3 font-medium">Company</th>
            <th className="pb-3 font-medium">Role</th>
            <th className="pb-3 font-medium text-center">Score</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Date</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map(app => (
            <tr key={app.id} className="hover:bg-gray-50">
              <td className="py-3 font-medium">{app.job.company ?? '—'}</td>
              <td className="py-3 text-gray-600">{app.job.title ?? '—'}</td>
              <td className="py-3 text-center">
                {app.job.matchScore != null ? (
                  <span className={`font-bold ${app.job.matchScore >= 4 ? 'text-teal-600' : app.job.matchScore >= 3 ? 'text-amber-600' : 'text-red-500'}`}>
                    {app.job.matchScore.toFixed(1)}
                  </span>
                ) : '—'}
              </td>
              <td className="py-3">
                <select
                  value={app.status}
                  onChange={e => handleStatusChange(app.id, e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td className="py-3 text-gray-400 text-xs">
                {new Date(app.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3">
                <Link href={`/jobs/${app.jobId}`} className="text-xs text-teal-600 hover:underline">
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
