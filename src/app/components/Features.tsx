import { Shield, FileCheck, Globe } from 'lucide-react'

export default function Features() {
  const features = [
    {
      icon: Shield,
      title: 'Cryptographically Signed',
      description: 'Employers sign credentials with their wallet. Unforgeable proof of employment.'
    },
    {
      icon: FileCheck,
      title: 'Instant Verification',
      description: 'No waiting weeks for international background checks. Verify in seconds.'
    },
    {
      icon: Globe,
      title: 'Portable Identity',
      description: 'Your credentials follow you. Share selectively across any platform.'
    }
  ]

  return (
    <section className="px-6 py-24 border-t border-zinc-900">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div 
              key={i}
              className="group p-6 border border-zinc-900 rounded-xl hover:border-zinc-700 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center mb-4 group-hover:bg-zinc-800 transition-colors">
                <feature.icon className="w-6 h-6 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}