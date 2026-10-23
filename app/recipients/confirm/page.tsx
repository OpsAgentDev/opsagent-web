"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ConfirmAction } from "@/components/confirm-action";
import { api, unwrap } from "@/lib/api/client";

function Confirm() {
  // Held in state: the effect below removes it from the address bar and history.
  const [token] = useState(useSearchParams().get("token") ?? "");
  useEffect(() => {
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  if (!token) return <p className="error" role="alert">This confirm link is incomplete.</p>;
  return (
    <ConfirmAction
      label="Confirm"
      done="You are subscribed. OpsAgent reports will come to this address."
      run={() => unwrap(api.POST("/recipients/confirm", { body: { token } }))}
    />
  );
}

export default function RecipientConfirm() {
  return (
    <main>
      <h1>Confirm OpsAgent reports</h1>
      <p>Someone added this address to receive OpsAgent reports. Confirm to start receiving them.</p>
      <Suspense>
        <Confirm />
      </Suspense>
    </main>
  );
}
