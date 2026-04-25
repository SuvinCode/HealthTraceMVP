import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STATS = [
  { val: '219,000', label: 'Australians live with ME/CFS' },
  { val: '2–5 Years', label: 'Average time to diagnosis' },
  { val: 'Zero', label: 'Blood tests or scans can confirm it' },
];

const STEPS = [
  { step: '01', title: 'Set up in 3 mins', desc: "Define your baseline and goals. That's the only manual work you'll do." },
  { step: '02', title: 'Passive Tracking', desc: 'Witness watches movement and cognitive load silently in the background.' },
  { step: '03', title: 'Generate GP Report', desc: 'One tap creates a structured clinical PDF ready for your specialist.' },
];

const TEAM = [
  { name: 'Suvin', role: 'Product Manager' },
  { name: 'Alex', role: 'Infrastructure' },
  { name: 'Tanmayi', role: 'Ideation and R&D' },
  { name: 'Ian', role: 'UI/UX' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGetStarted = (e) => {
    e.preventDefault();
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body selection:bg-primary selection:text-primary-foreground">
      {/* Hero gradient wrapper */}
      <div className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-100 via-red-50/40 to-background">

      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto border-b border-red-100/60">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="HealthTrace logo" className="w-9 h-9 object-contain" />
          <span className="font-heading font-bold text-lg">
            <span style={{ color: '#CC2222' }}>Health</span><span style={{ color: '#1E2D4E' }}>Trace</span>
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Log in
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="bg-foreground text-background px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-all"
          >
            Create account
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 pt-24 pb-32 max-w-5xl mx-auto text-center">
        <div className="inline-block px-3 py-1 border border-primary text-primary text-[10px] uppercase tracking-[0.2em] rounded-full mb-8 font-bold font-heading">
          Chronic Fatigue • ME/CFS • Invisible Illness
        </div>
        <h1 className="text-6xl md:text-7xl font-heading font-bold leading-[1.1] mb-8 tracking-tight">
          Your symptoms are real. <br />
          <span className="text-muted-foreground font-normal italic" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            Now you can prove it.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 font-light leading-relaxed">
          HealthTrace silently tracks your energy, crashes, and patterns — then generates a clinical report your doctor can't ignore.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/signup')}
            className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-medium text-lg hover:opacity-90 hover:shadow-lg transition-all"
          >
            Start tracking free ↗
          </button>
          <button
            onClick={() => scrollTo('how-it-works')}
            className="bg-card border border-border px-8 py-4 rounded-xl font-medium text-lg hover:bg-muted transition-all"
          >
            See how it works
          </button>
        </div>
      </section>
      </div>{/* end hero gradient wrapper */}

      {/* Stats — dark strip */}
      <section className="px-8 py-24 bg-foreground text-background rounded-[40px] mx-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 mb-16 font-heading">The Reality</p>
          <div className="grid md:grid-cols-3 gap-12">
            {STATS.map((stat, i) => (
              <div key={i} className="border-l border-background/10 pl-8">
                <div className="text-5xl font-heading font-bold mb-4 text-primary">{stat.val}</div>
                <p className="text-sm opacity-60 font-light max-w-[200px]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-8 py-32 max-w-7xl mx-auto">
        <h2 className="text-4xl font-heading font-bold mb-20 text-center tracking-tight">Vision to Validation</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((item, i) => (
            <div key={i} className="bg-card p-10 rounded-3xl border border-border">
              <div className="text-primary font-heading font-bold text-3xl mb-6">{item.step}</div>
              <h3 className="text-xl font-heading font-bold mb-4">{item.title}</h3>
              <p className="text-muted-foreground font-light leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-8 py-24 bg-primary/5 text-center">
        <div className="max-w-3xl mx-auto">
          <blockquote
            className="text-3xl italic mb-8 text-foreground/80 leading-snug"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            "I spent 4 years being told it was anxiety. I showed my doctor 6 weeks of HealthTrace data. I was diagnosed within a month."
          </blockquote>
          <cite className="text-sm font-bold not-italic text-muted-foreground">— Sarah, 29, Brisbane</cite>
        </div>
      </section>

      {/* Founding Team */}
      <section className="px-8 py-32 max-w-7xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 mb-12 text-center font-heading">Founding Team</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TEAM.map((member, i) => (
            <div key={i} className="p-6 bg-card rounded-2xl border border-border text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 font-heading font-bold text-lg">
                {member.name[0]}
              </div>
              <div className="font-heading font-bold text-sm">{member.name}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{member.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-32 text-center max-w-xl mx-auto">
        <h2 className="text-4xl font-heading font-bold mb-6 tracking-tight">Start building your case.</h2>
        <p className="text-muted-foreground mb-10">Join the waitlist for the HealthTrace private beta.</p>
        <form onSubmit={handleGetStarted} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-6 py-4 rounded-xl border border-border focus:outline-none focus:border-primary transition-colors bg-card text-foreground placeholder:text-muted-foreground"
          />
          <input
            type="password"
            placeholder="Choose a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-6 py-4 rounded-xl border border-border focus:outline-none focus:border-primary transition-colors bg-card text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="bg-primary text-primary-foreground py-4 rounded-xl font-medium mt-2 hover:opacity-90 transition-all"
          >
            Get Started
          </button>
        </form>
      </section>

      <footer className="p-8 border-t border-border text-center text-[10px] text-muted-foreground uppercase tracking-widest">
        © 2026 HealthTrace • Built at UQ Ventures Hackathon
      </footer>
    </div>
  );
}
