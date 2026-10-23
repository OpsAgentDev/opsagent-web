"use client";
import { useParams } from "next/navigation";
import { ConfirmAction } from "@/components/confirm-action";
import { api, unwrap } from "@/lib/api/client";

export default function Unsubscribe() {
  const { token } = useParams<{ token: string }>();
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
