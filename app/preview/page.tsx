import { TradePreview } from "@/components/preview/TradePreview";
import Link from "next/link";

export default function PreviewPage() {
  return (
    <main className="min-h-screen bg-black text-white ace-stars px-6 py-24">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Explore ACE</h1>
          <p className="text-gray-400">
            This is a live preview of the ACE trading interface.
            No real funds. No account required.
          </p>
        </header>

        <TradePreview />

        <div className="text-center">
          <Link
            href="/signup"
            className="inline-block mt-8 px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition"
          >
            Create account to trade for real
          </Link>
        </div>
      </div>
    </main>
  );
}
