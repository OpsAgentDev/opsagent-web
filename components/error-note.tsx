import { ApiError } from "@/lib/api/client";

export function ErrorNote({ error }: { error?: Error | null }) {
  if (!error) return null;
  const code = error instanceof ApiError ? error.code : undefined;
  return (
    <p role="alert" className="error">
      {error.message}
      {code ? ` (${code})` : ""}
    </p>
  );
}
