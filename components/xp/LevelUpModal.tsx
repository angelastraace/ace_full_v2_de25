"use client";

type Props = {
  level: number;
  onClose: () => void;
};

export function LevelUpModal({ level, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="relative bg-black border border-cyan-400/40 rounded-xl p-8 text-center shadow-[0_0_40px_rgba(34,211,238,0.6)] animate-scale-in">
        <h2 className="text-4xl font-bold ace-glow mb-2">
          LEVEL UP!
        </h2>

        <p className="text-xl mb-6">
          You reached <span className="font-bold">Level {level}</span>
        </p>

        <div className="text-6xl mb-6 animate-pulse">
          🚀
        </div>

        <button
          onClick={onClose}
          className="px-6 py-2 rounded bg-cyan-600 hover:bg-cyan-500 transition pulse-glow"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
