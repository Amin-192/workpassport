export default function WorkerPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Work Passport</h1>
          <p className="text-text-secondary">Manage your verifiable credentials</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-6 border border-border rounded-xl bg-bg-secondary/30">
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-sm text-text-secondary">Credentials</div>
          </div>
          <div className="p-6 border border-border rounded-xl bg-bg-secondary/30">
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-sm text-text-secondary">Employers</div>
          </div>
          <div className="p-6 border border-border rounded-xl bg-bg-secondary/30">
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-sm text-text-secondary">Verifications</div>
          </div>
        </div>

        <div className="border border-border rounded-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Connect GitHub</h3>
              <p className="text-sm text-text-secondary">Import your contribution history automatically</p>
            </div>
            <button className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors">
              Connect
            </button>
          </div>
        </div>

        <div className="border border-border rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold mb-2">No credentials yet</h3>
          <p className="text-sm text-text-secondary mb-6">Connect your GitHub or request credentials from employers to get started</p>
        </div>
      </div>
    </div>
  )
}