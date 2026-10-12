import Link from "next/link";

export function BackToAppLink({ loggedIn }: { loggedIn: boolean }) {
  return (
    <Link
      href={loggedIn ? "/dashboard" : "/login"}
      className="text-sm text-stone-500 hover:text-stone-900 inline-flex items-center gap-1"
    >
      <span aria-hidden>←</span> Back to {loggedIn ? "Handled" : "sign in"}
    </Link>
  );
}
