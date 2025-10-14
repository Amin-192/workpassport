export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Verify Credentials</h1>
          <p className="text-text-secondary">Check the authenticity of a worker's credentials</p>
        </div>

        <div className="border border-border rounded-xl p-8 mb-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Worker Address</label>
              <input 
                type="text"
                placeholder="0x..."
                className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-text-secondary transition-colors"
              />
            </div>

            <button className="w-full px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors">
              Verify Credentials
            </button>
          </div>
        </div>

        <div className="border border-border rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">No results yet</h3>
          <p className="text-sm text-text-secondary">Enter a worker address to verify their credentials</p>
        </div>
      </div>
    </div>
  )
}