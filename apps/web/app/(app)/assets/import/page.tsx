'use client';

import { Button } from '@iec62443/ui/primitives';
import { ArrowLeft, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AssetImportPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <button
          onClick={() => router.push('/assets')}
          className="mb-2 flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Asset Inventory
        </button>
        <h1 className="text-xl font-semibold text-surface-900">Import Assets</h1>
        <p className="mt-1 text-sm text-surface-500">Bulk import assets from a CSV file</p>
      </div>

      <div className="rounded-lg border border-surface-200 bg-surface-0 p-6 space-y-4">
        <h3 className="text-sm font-medium text-surface-700">CSV Import</h3>
        <div className="rounded-lg border border-dashed border-surface-300 bg-surface-50 p-8 text-center">
          <Upload className="mx-auto h-10 w-10 text-surface-300" />
          <p className="mt-3 text-sm text-surface-500">
            Drag and drop a CSV file here, or click to browse
          </p>
          <p className="mt-1 text-xs text-surface-400">
            CSV must include columns: name, type, criticality (optional), vendor (optional), model
            (optional)
          </p>
        </div>
        <div className="rounded-md bg-surface-50 p-4">
          <h4 className="text-xs font-medium text-surface-700">Required CSV Columns</h4>
          <ul className="mt-2 space-y-1 text-xs text-surface-500">
            <li>
              <code className="bg-surface-100 px-1 rounded">name</code> — Asset name (required)
            </li>
            <li>
              <code className="bg-surface-100 px-1 rounded">type</code> — Asset type: plc, hmi,
              scada_server, etc. (required)
            </li>
            <li>
              <code className="bg-surface-100 px-1 rounded">criticality</code> — safety_critical,
              mission_critical, etc. (optional)
            </li>
            <li>
              <code className="bg-surface-100 px-1 rounded">vendor</code> — Vendor name (optional)
            </li>
            <li>
              <code className="bg-surface-100 px-1 rounded">model</code> — Model identifier
              (optional)
            </li>
            <li>
              <code className="bg-surface-100 px-1 rounded">ip_address</code> — IP address
              (optional)
            </li>
            <li>
              <code className="bg-surface-100 px-1 rounded">purdue_level</code> — 0–5 (optional)
            </li>
            <li>
              <code className="bg-surface-100 px-1 rounded">location</code> — Physical location
              (optional)
            </li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={() => router.push('/assets')}>
          Cancel
        </Button>
        <Button variant="primary" disabled>
          Upload CSV
        </Button>
      </div>
    </div>
  );
}
