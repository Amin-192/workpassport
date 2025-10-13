import Link from "next/link";
import WalletConnect from "../WalletConnect";

export default function Navigation() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold">
            WorkPassport 🛂
          </Link>
          <div className="flex gap-6 items-center">
            <Link href="/worker" className="hover:text-blue-600">
              Worker
            </Link>
            <Link href="/employer" className="hover:text-blue-600">
              Employer
            </Link>
            <Link href="/verify" className="hover:text-blue-600">
              Verify
            </Link>
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  );
}