import Link from "next/link";

export default function Home() {
  return (
    <>
      <main>
        <h1>OpsAgent</h1>
        <p>It watches your cloud every night and tells you what to fix. You decide.</p>
        <p>
          <Link href="/sign-in">Sign in</Link>
        </p>
      </main>
      <footer>OpsAgent is a product of Binary Labs LLC.</footer>
    </>
  );
}
