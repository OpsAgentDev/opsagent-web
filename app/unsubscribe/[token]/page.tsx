"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfirmAction } from "@/components/confirm-action";
import { api, unwrap } from "@/lib/api/client";

export default function Unsubscribe() {
  // Held in state: the effect below removes it from the address bar and history.
  const [token] = useState(useParams<{ token: string }>().token);
  useEffect(() => {
    window.history.replaceState(null, "", "/unsubscribe");
  }, []);
  return (
    <main>
      <h1>Unsubscribe</h1>
      <p>Stop OpsAgent reports to this address. Other recipients keep receiving them.</p>
      <ConfirmAction
        label="Unsubscribe"
        done="You are unsubscribed."
        run={() => unwrap(api.POST("/unsubscribe/{token}", { params: { path: { token } } }))}
      />
    </main>
  );
}
