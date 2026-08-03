import React from 'react';

export function StockCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 animate-skeleton space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-5 w-16 bg-slate-800 rounded" />
          <div className="h-3 w-28 bg-slate-800/70 rounded" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-5 w-20 bg-slate-800 rounded" />
          <div className="h-4 w-12 bg-slate-800/70 rounded" />
        </div>
      </div>
      <div className="h-9 w-full bg-slate-800/40 rounded" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-skeleton">
      <td className="py-3 px-3">
        <div className="h-4 w-16 bg-slate-800 rounded" />
      </td>
      <td className="py-3 px-3">
        <div className="h-4 w-12 bg-slate-800 rounded ml-auto" />
      </td>
      <td className="py-3 px-3">
        <div className="h-4 w-16 bg-slate-800 rounded ml-auto" />
      </td>
      <td className="py-3 px-3">
        <div className="h-4 w-16 bg-slate-800 rounded ml-auto" />
      </td>
      <td className="py-3 px-3">
        <div className="h-4 w-16 bg-slate-800 rounded ml-auto" />
      </td>
      <td className="py-3 px-3">
        <div className="h-6 w-20 bg-slate-800 rounded mx-auto" />
      </td>
    </tr>
  );
}

export function NewsFeedSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/40 animate-skeleton space-y-3">
      <div className="flex justify-between">
        <div className="h-4 w-24 bg-slate-800 rounded" />
        <div className="h-3 w-32 bg-slate-800/70 rounded" />
      </div>
      <div className="h-4 w-full bg-slate-800/50 rounded" />
      <div className="h-4 w-3/4 bg-slate-800/50 rounded" />
    </div>
  );
}
