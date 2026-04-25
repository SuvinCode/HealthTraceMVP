import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '@/api/client';

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
  { name: 'Suvin', role: 'Founder & CEO' },
  { name: 'Alex', role: 'CPO' },
  { name: 'Tanmayi', role: 'CTO' },
  { name: 'Ian', role: 'CFO' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', damping: 20, stiffness: 100 },
  },
};

export default function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reviewName, setReviewName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const name = isAnonymous ? 'Anonymous' : reviewName || 'Anonymous';
    
    try {
      // Use FormSubmit.co for direct email delivery without backend SMTP config.
      await fetch('https://formsubmit.co/ajax/0dc615d475c9bb4377bc1572ec4af891', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          message: reviewComment,
          _subject: `New Review from ${name}`
        })
      });
      
      setReviewSent(true);
      setReviewName('');
      setReviewComment('');
      setTimeout(() => setReviewSent(false), 5000);
    } catch (err) {
      console.error('Failed to send review:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body selection:bg-primary selection:text-primary-foreground">
      {/* Hero gradient wrapper */}
      <div className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-100 via-red-50/40 to-background overflow-hidden">

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto border-b border-red-100/60"
      >
        <div className="flex items-center gap-2.5">
          <motion.img 
            whileHover={{ rotate: 10, scale: 1.1 }}
            src="/favicon.svg" alt="HealthTrace logo" className="w-9 h-9 object-contain" 
          />
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
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/signup')}
            className="bg-foreground text-background px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-all shadow-sm"
          >
            Create account
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="px-8 pt-24 pb-32 max-w-5xl mx-auto text-center relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block px-3 py-1 border border-primary text-primary text-[10px] uppercase tracking-[0.2em] rounded-full mb-8 font-bold font-heading"
        >
          Chronic Fatigue • ME/CFS • Invisible Illness
        </motion.div>
        <motion.h1 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-6xl md:text-7xl font-heading font-bold leading-[1.1] mb-8 tracking-tight"
        >
          Your symptoms are real. <br />
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-muted-foreground font-normal italic" 
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            Now you can prove it.
          </motion.span>
        </motion.h1>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 font-light leading-relaxed"
        >
          HealthTrace silently tracks your energy, crashes, and patterns — then generates a clinical report your doctor can't ignore.
        </motion.p>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05, shadow: "0px 10px 30px rgba(204, 34, 34, 0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/signup')}
            className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-medium text-lg hover:opacity-90 transition-all"
          >
            Start tracking free ↗
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.02)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollTo('how-it-works')}
            className="bg-card border border-border px-8 py-4 rounded-xl font-medium text-lg hover:bg-muted transition-all"
          >
            See how it works
          </motion.button>
        </motion.div>
      </section>
      </div>{/* end hero gradient wrapper */}

      {/* Stats — dark strip */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
        className="px-8 py-24 bg-foreground text-background rounded-[40px] mx-4 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto">
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.4 }}
            viewport={{ once: true }}
            className="text-[10px] uppercase tracking-[0.2em] mb-16 font-heading"
          >
            The Reality
          </motion.p>
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-12"
          >
            {STATS.map((stat, i) => (
              <motion.div key={i} variants={itemVariants} className="border-l border-background/10 pl-8">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                  className="text-5xl font-heading font-bold mb-4 text-primary"
                >
                  {stat.val}
                </motion.div>
                <p className="text-sm opacity-60 font-light max-w-[200px]">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* How It Works */}
      <section id="how-it-works" className="px-8 py-32 max-w-7xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-heading font-bold mb-20 text-center tracking-tight"
        >
          Vision to Validation
        </motion.h2>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {STEPS.map((item, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
              className="bg-card p-10 rounded-3xl border border-border hover:shadow-xl transition-shadow"
            >
              <div className="text-primary font-heading font-bold text-3xl mb-6">{item.step}</div>
              <h3 className="text-xl font-heading font-bold mb-4">{item.title}</h3>
              <p className="text-muted-foreground font-light leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Testimonial */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        className="px-8 py-24 bg-primary/5 text-center"
      >
        <div className="max-w-3xl mx-auto">
          <motion.blockquote
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-3xl italic mb-8 text-foreground/80 leading-snug"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            "Something like this has been needed in the medical space for a long time"
          </motion.blockquote>
          <motion.cite 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm font-bold not-italic text-muted-foreground"
          >
            — Dr Francis, Gastroentologist
          </motion.cite>
        </div>
      </motion.section>

      {/* Founding Team */}
      <section className="px-8 py-32 max-w-7xl mx-auto">
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.4 }}
          viewport={{ once: true }}
          className="text-[10px] uppercase tracking-[0.2em] mb-12 text-center font-heading"
        >
          Founding Team
        </motion.p>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {TEAM.map((member, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="p-6 bg-card rounded-2xl border border-border text-center"
            >
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 font-heading font-bold text-lg">
                {member.name[0]}
              </div>
              <div className="font-heading font-bold text-sm">{member.name}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{member.role}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Reviews Section */}
      <section className="px-8 py-32 bg-primary/5">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-heading font-bold mb-4 tracking-tight text-foreground">Leave a Review</h2>
            <p className="text-muted-foreground">Your feedback helps us build a better HealthTrace.</p>
          </motion.div>

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-card p-8 md:p-12 rounded-[32px] border border-border shadow-2xl shadow-primary/5"
          >
            <form onSubmit={handleReviewSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Your Name</label>
                <div className="relative group">
                  <input
                    type="text"
                    disabled={isAnonymous}
                    placeholder={isAnonymous ? "Anonymous" : "Enter your name"}
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="w-full px-6 py-4 rounded-2xl border border-border bg-background focus:outline-none focus:border-primary transition-all disabled:opacity-50 disabled:bg-muted/30 text-foreground"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Stay Anonymous</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Your Feedback</label>
                <textarea
                  required
                  rows={4}
                  placeholder="What's your experience with HealthTrace?"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl border border-border bg-background focus:outline-none focus:border-primary transition-all resize-none text-foreground"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={reviewSent}
                className={`w-full py-5 rounded-2xl font-heading font-bold text-lg shadow-xl transition-all ${
                  reviewSent 
                    ? 'bg-green-500 text-white shadow-green-500/20' 
                    : 'bg-primary text-primary-foreground shadow-primary/20 hover:opacity-95'
                }`}
              >
                {reviewSent ? 'Review Sent! Thanks.' : 'Send'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </section>
          

      <footer className="p-8 border-t border-border text-center text-[10px] text-muted-foreground uppercase tracking-widest">
        © 2026 HealthTrace • Built at UQ Ventures Hackathon
      </footer>
    </div>
  );
}
