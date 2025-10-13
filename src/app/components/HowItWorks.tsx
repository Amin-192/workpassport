export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Connect your GitHub',
      description: 'Import your contribution history and code commits automatically'
    },
    {
      number: '2',
      title: 'Request credentials from employers',
      description: 'Past employers sign your work history with their wallet'
    },
    {
      number: '3',
      title: 'Share selectively',
      description: 'Control what you reveal. Verifiers see only what you choose'
    }
  ]

  return (
    <section className="px-6 py-24 border-t border-zinc-900">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center">How it works</h2>
        
        <div className="space-y-12">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-6 items-start group">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm font-mono group-hover:bg-zinc-800 group-hover:border-zinc-700 transition-colors">
                {step.number}
              </div>
              <div className="pt-1">
                <h4 className="font-semibold mb-2 text-lg">{step.title}</h4>
                <p className="text-zinc-500 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}