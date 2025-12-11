import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t border-cyan-500/20 bg-[#001219]/50 backdrop-blur-md mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="ace-glow text-lg font-bold mb-4">ACE Exchange</div>
            <p className="text-sm text-gray-400">The future of crypto trading, powered by advanced technology.</p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Trading</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/trade" className="hover:text-cyan-400">
                  Spot Trading
                </Link>
              </li>
              <li>
                <Link href="/futures" className="hover:text-cyan-400">
                  Futures
                </Link>
              </li>
              <li>
                <Link href="/margin" className="hover:text-cyan-400">
                  Margin
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Earn</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/staking" className="hover:text-cyan-400">
                  Staking
                </Link>
              </li>
              <li>
                <Link href="/lending" className="hover:text-cyan-400">
                  Lending
                </Link>
              </li>
              <li>
                <Link href="/earn" className="hover:text-cyan-400">
                  Simple Earn
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/about" className="hover:text-cyan-400">
                  About
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-cyan-400">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-cyan-400">
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-cyan-500/10 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-500">© 2025 ACE Exchange. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-500 mt-4 md:mt-0">
            <a href="#" className="hover:text-cyan-400">
              Privacy
            </a>
            <a href="#" className="hover:text-cyan-400">
              Terms
            </a>
            <a href="#" className="hover:text-cyan-400">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}