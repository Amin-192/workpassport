import Link from "next/link";
import WalletConnect from "../WalletConnect";

export default function Navigation() {
  return (
    <div className="px-6 pt-6">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border border-gray-200/50 rounded-2xl max-w-7xl mx-auto">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="text-3xl transition-transform group-hover:scale-110">
                🛂
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">WorkPassport</span>
                <span className="text-xs text-gray-500 -mt-0.5">Blockchain Credentials</span>
              </div>
            </Link>
            
            <div className="flex gap-1 items-center">
              <Link 
                href="/worker" 
                className="px-5 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium text-sm"
              >
                For Workers
              </Link>
              <Link 
                href="/employer" 
                className="px-5 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium text-sm"
              >
                For Employers
              </Link>
              <Link 
                href="/verify" 
                className="px-5 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium text-sm"
              >
                Verify
              </Link>
              
              <div className="w-px h-8 bg-gray-300 mx-2"></div>
              
              <div className="ml-2">
                <WalletConnect />
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}