import Link from "next/link";
import WalletConnect from "../WalletConnect";

export default function Navigation() {
  return (
    <div className="px-6 pt-6">
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🛂</span>
              <span className="text-lg font-semibold">WorkPassport</span>
            </Link>
                     
            <div className="flex gap-6 items-center">
              <Link 
                href="/worker" 
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Workers
              </Link>
              <Link 
                href="/employer" 
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Employers
              </Link>
              <Link 
                href="/verify" 
                className="text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Verify
              </Link>
                           
              <div className="w-px h-4 bg-border"></div>
                           
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}