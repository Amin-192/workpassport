import Link from "next/link";
import WalletConnect from "../WalletConnect";

export default function Navigation() {
  return (
    <div className="px-6 pt-6">
      <nav className="bg-bg-secondary/80 backdrop-blur-md shadow-sm border border-border rounded-2xl max-w-7xl mx-auto">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="text-3xl transition-transform group-hover:scale-110">
                🛂
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-text-primary">WorkPassport</span>
                <span className="text-xs text-text-secondary -mt-0.5">Blockchain Credentials</span>
              </div>
            </Link>
                     
            <div className="flex gap-1 items-center">
              <Link 
                href="/worker" 
                className="px-5 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-primary rounded-lg transition-all font-medium text-sm"
              >
                For Workers
              </Link>
              <Link 
                href="/employer" 
                className="px-5 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-primary rounded-lg transition-all font-medium text-sm"
              >
                For Employers
              </Link>
              <Link 
                href="/verify" 
                className="px-5 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-primary rounded-lg transition-all font-medium text-sm"
              >
                Verify
              </Link>
                           
              <div className="w-px h-8 bg-border mx-2"></div>
                           
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