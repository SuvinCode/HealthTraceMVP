import React from 'react';

// Theme Colors: 
// Background: #F5F0E8 (Light Beige)
// Accent: #E8714A (Coral)
// Text: #0B1826 (Dark Navy)

const WitnessLanding = () => {
  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#0B1826] font-sans selection:bg-[#E8714A] selection:text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-serif font-bold tracking-tight">
          Health<span className="text-[#E8714A]">Trace</span>
        </div>
        <div className="flex gap-4">
          <button className="px-5 py-2 text-sm font-medium hover:opacity-70 transition-opacity">Log in</button>
          <button className="bg-[#0B1826] text-[#F5F0E8] px-5 py-2 rounded-full text-sm font-medium hover:bg-opacity-90 transition-all">
            Create account
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-8 pt-20 pb-32 max-w-5xl mx-auto text-center">
        <div className="inline-block px-3 py-1 border border-[#E8714A] text-[#E8714A] text-[10px] uppercase tracking-[0.2em] rounded-full mb-8 font-bold">
          Chronic Fatigue • ME/CFS • Invisible Illness
        </div>
        <h1 className="text-6xl md:text-7xl font-serif leading-[1.1] mb-8">
          Your symptoms are real. <br />
          <span className="italic opacity-60">Now you can prove it.</span>
        </h1>
        <p className="text-lg md:text-xl text-[#0B1826]/70 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
          Witness silently tracks your energy, crashes, and patterns—then generates a clinical report your doctor can't ignore.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-[#E8714A] text-white px-8 py-4 rounded-xl font-medium text-lg hover:shadow-lg hover:shadow-[#E8714A]/20 transition-all">
            Start tracking free ↗
          </button>
          <button className="bg-white border border-[#0B1826]/10 px-8 py-4 rounded-xl font-medium text-lg hover:bg-[#0B1826]/5 transition-all">
            See how it works
          </button>
        </div>
      </section>

      {/* Problem Section (Stats) */}
      <section className="px-8 py-24 bg-[#0B1826] text-[#F5F0E8] rounded-[40px] mx-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 mb-16">The Reality</p>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { val: "219,000", label: "Australians live with ME/CFS" },
              { val: "2–5 Years", label: "Average time to diagnosis" },
              { val: "Zero", label: "Blood tests or scans can confirm it" }
            ].map((stat, i) => (
              <div key={i} className="border-l border-[#F5F0E8]/10 pl-8">
                <div className="text-5xl font-serif mb-4 text-[#E8714A]">{stat.val}</div>
                <p className="text-sm opacity-60 font-light max-w-[200px]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-8 py-32 max-w-7xl mx-auto">
        <h2 className="text-4xl font-serif mb-20 text-center">Vision to Validation</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Set up in 3 mins", desc: "Define your baseline and goals. That's the only manual work you'll do." },
            { step: "02", title: "Passive Tracking", desc: "Witness watches movement and cognitive load silently in the background." },
            { step: "03", title: "Generate GP Report", desc: "One tap creates a structured clinical PDF ready for your specialist." }
          ].map((item, i) => (
            <div key={i} className="bg-white p-10 rounded-3xl border border-[#0B1826]/5">
              <div className="text-[#E8714A] font-serif text-3xl mb-6">{item.step}</div>
              <h3 className="text-xl font-bold mb-4">{item.title}</h3>
              <p className="text-[#0B1826]/60 font-light leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-8 py-24 bg-[#E8714A]/5 text-center">
        <div className="max-w-3xl mx-auto">
          <blockquote className="text-3xl font-serif italic mb-8">
            "I spent 4 years being told it was anxiety. I showed my doctor 6 weeks of Witness data. I was diagnosed within a month."
          </blockquote>
          <cite className="text-sm font-bold not-italic">— Sarah, 29, Brisbane</cite>
        </div>
      </section>

      {/* Founding Team */}
      <section className="px-8 py-32 max-w-7xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 mb-12 text-center">Founding Team</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Suvin", role: "Product Manager" },
            { name: "Alex", role: "Infrastructure" },
            { name: "Tanmayi", role: "Ideation and R&D" },
            { name: "Ian", role: "UI/UX" }
          ].map((member, i) => (
            <div key={i} className="p-6 bg-white rounded-2xl border border-[#0B1826]/5 text-center">
              <div className="w-12 h-12 bg-[#0B1826] text-white rounded-full flex items-center justify-center mx-auto mb-4 font-serif">
                {member.name[0]}
              </div>
              <div className="font-bold text-sm">{member.name}</div>
              <div className="text-[10px] uppercase tracking-widest opacity-50 mt-1">{member.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-8 py-32 text-center max-w-xl mx-auto">
        <h2 className="text-4xl font-serif mb-6">Start building your case.</h2>
        <p className="text-[#0B1826]/60 mb-10">Join the waitlist for the Witness private beta.</p>
        <form className="flex flex-col gap-3">
          <input 
            type="email" 
            placeholder="Email address" 
            className="px-6 py-4 rounded-xl border border-[#0B1826]/10 focus:outline-none focus:border-[#E8714A] transition-colors bg-white"
          />
          <input 
            type="password" 
            placeholder="Choose a password" 
            className="px-6 py-4 rounded-xl border border-[#0B1826]/10 focus:outline-none focus:border-[#E8714A] transition-colors bg-white"
          />
          <button className="bg-[#0B1826] text-white py-4 rounded-xl font-medium mt-2 hover:bg-opacity-90 transition-all">
            Get Started
          </button>
        </form>
      </section>

      <footer className="p-8 border-t border-[#0B1826]/5 text-center text-[10px] opacity-40 uppercase tracking-widest">
        © 2026 Witness Health • Built at UQ Ventures Hackathon
      </footer>
    </div>
  );
};

export default WitnessLanding;