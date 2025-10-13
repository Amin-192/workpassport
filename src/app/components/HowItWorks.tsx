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
    <section className="px-6 py-24 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center">How it works</h2>
        
        <div className="space-y-8">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bg-secondary border border-border flex items-center justify-center text-sm font-mono">
                {step.number}
              </div>
              <div>
                <h4 className="font-semibold mb-1">{step.title}</h4>
                <p className="text-sm text-text-secondary">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}