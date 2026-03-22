"use client";

import { useState } from "react";

export default function TestServicePointsButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function runTest() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/shipmondo/service-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postcode: '8000', country_code: 'DK' })
      });

      const text = await res.text();
      let parsed = text;
      try { parsed = JSON.parse(text); } catch (e) { /* keep raw text */ }
      setResult({ status: res.status, body: parsed });
      console.log('Shipmondo test response:', res.status, parsed);
    } catch (err) {
      console.error('Test failed:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <button
        onClick={runTest}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Testing…' : 'Test Shipmondo (DK 8000)'}
      </button>

      {error && <div className="mt-2 text-red-600">Error: {error}</div>}

      {result && (
        <div className="mt-2 text-sm">
          <div><strong>Status:</strong> {result.status}</div>
          <pre className="mt-2 max-h-48 overflow-auto bg-gray-100 p-2 text-xs">{JSON.stringify(result.body, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
