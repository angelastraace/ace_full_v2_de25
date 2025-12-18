import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function HomePage() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-black text-white ace-stars">
      {/* HERO */}
      <section className="px-6 py-32 max-w-6xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight relative inline-block">
          <span className="absolute inset-0 blur-2xl opacity-20 bg-white rounded-full" />
          <span className="relative">ACE Exchange</span>
        </h1>

        <p className="mt-6 text-xl text-gray-300">
          Trade. Learn. Level up.
        </p>

        <p className="mt-4 max-w-2xl mx-auto text-gray-400">
          Not a casino. Not a promise machine.
          A real crypto exchange that rewards skill,
          patience, and participation.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 rounded-lg bg-white text-black font-semibold
                       hover:bg-gray-200 transition
                       hover:-translate-y-0.5 hover:shadow-lg"
          >
            Enter ACE
          </Link>

          <Link
            href="/preview"
            className="px-6 py-3 rounded-lg border border-gray-700 text-gray-300 hover:border-gray-500 transition"
          >
            Explore the system
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-32 text-center">
        <p className="text-gray-400 mb-6">
          You don’t need to believe.
          <br />
          You can inspect.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition"
          >
            Create account
          </Link>

          <Link
            href="/docs"
            className="px-6 py-3 rounded-lg border border-gray-700 text-gray-300 hover:border-gray-500 transition"
          >
            Read the docs
          </Link>
        </div>
      </section>
    </main>
  );
}
