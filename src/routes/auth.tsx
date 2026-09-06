import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Accounts — Cheapscape" },
      {
        name: "description",
        content: "Cloud sign-in is turned off. Watchlists stay on this device.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="panel w-full max-w-sm p-6 text-center">
        <h1 className="font-display text-xl font-semibold text-foreground">Accounts are off</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign-in used a free Supabase project that kept pausing and breaking deploys. Prices,
          methods, and the watchlist still work. The watchlist stays saved on this phone.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Back to prices
        </Link>
      </div>
    </main>
  );
}
