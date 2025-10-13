export default function EmployerPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Issue Credentials</h1>
          <p className="text-text-secondary">Sign work credentials for your employees</p>
        </div>

        <div className="border border-border rounded-xl p-8">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Worker Address</label>
              <input 
                type="text"
                placeholder="0x..."
                className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-text-secondary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Position</label>
              <input 
                type="text"
                placeholder="Senior Developer"
                className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-text-secondary transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input 
                  type="date"
                  className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-text-secondary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input 
                  type="date"
                  className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-text-secondary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Skills (comma separated)</label>
              <input 
                type="text"
                placeholder="React, Node.js, Solidity"
                className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg focus:outline-none focus:border-text-secondary transition-colors"
              />
            </div>

            <button 
              type="submit"
              className="w-full px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
            >
              Sign & Issue Credential
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}