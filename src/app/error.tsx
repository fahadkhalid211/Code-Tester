'use client';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 p-4 text-zinc-100">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="text-xs text-zinc-400">{error.digest ? `Reference: ${error.digest}` : 'An unexpected error occurred.'}</p>
      <button onClick={() => reset()} className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
        Try again
      </button>
    </div>
  );
}
