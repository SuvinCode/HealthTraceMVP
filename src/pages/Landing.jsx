import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '@/api/client';
import { Linkedin, Github, Stethoscope, User, Check } from 'lucide-react';

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
  { 
    name: 'Suvin', 
    role: 'Founder & CEO',
    linkedin: 'https://www.linkedin.com/in/suvin-chin-90389b157/',
    github: 'https://github.com/SuvinCode'
  },
  { 
    name: 'Alex', 
    role: 'CPO',
    github: 'https://github.com/slpyalex'
  },
  { 
    name: 'Tanmayi', 
    role: 'CTO',
    github: 'https://github.com/Queen-Tanmayi-09'
  },
  { 
    name: 'Ian', 
    role: 'CFO',
    linkedin: 'https://www.linkedin.com/in/ian-chang-66464225a/',
    github: 'https://github.com/ianxxc'
  },
];

const FEATURES = [
  { 
    title: 'Seamless Connection', 
    video: '/videos/Connecting doctor and patients.mp4'
  },
  { 
    title: 'Precision Medication', 
    video: '/videos/Assigning medication.mp4'
  },
  { 
    title: 'Intuitive Diary', 
    video: '/videos/Diary.mp4'
  },
  { 
    title: 'Smart Appointments', 
    video: '/videos/Appointments.mp4'
  },
  { 
    title: 'Custom Health Forms', 
    video: '/videos/Creating a health form.mp4'
  },
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        // Mute all feature videos when exiting fullscreen
        const videos = document.querySelectorAll('video');
        videos.forEach(v => {
          if (v.src.includes('/videos/')) {
            v.muted = true;
          }
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

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
        <div className="flex items-center gap-3">
          <motion.img 
            whileHover={{ rotate: 10, scale: 1.1 }}
            src="/favicon.svg" alt="HealthTrace logo" className="w-14 h-14 object-contain" 
          />
          <span className="font-heading font-bold text-2xl tracking-tight">
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
          <motion.button
            whileHover={{ scale: 1.05, shadow: "0px 10px 30px rgba(30, 45, 78, 0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollTo('reviews-section')}
            style={{ backgroundColor: '#1E2D4E' }}
            className="text-white px-8 py-4 rounded-xl font-medium text-lg hover:opacity-90 transition-all shadow-lg shadow-slate-900/10"
          >
            Leave a review
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

      {/* Dual Experience Section */}
      <section className="px-8 py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl font-heading font-bold mb-4 tracking-tight">The Dual Experience</h2>
            <p className="text-muted-foreground">Tailored tools for patients and clinicians to work together.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Patient Account */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card p-8 rounded-[32px] border border-border shadow-sm flex flex-col"
            >
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                <User className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-heading font-bold mb-4">Patient Account</h3>
              <p className="text-muted-foreground mb-8 font-light">Focus on your wellbeing while we handle the data tracking and clinical reporting.</p>
              
              <ul className="space-y-4 mt-auto">
                {[
                  'Mood & Symptom Diary with one-tap logging',
                  'Voice Transcription for effortless journaling',
                  'Dynamic Medication & Appointment Timeline',
                  'Direct connection to your healthcare team'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Doctor Account */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              style={{ borderColor: 'rgba(30, 45, 78, 0.1)' }}
              className="bg-[#1E2D4E] text-white p-8 rounded-[32px] shadow-xl flex flex-col"
            >
              <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-heading font-bold mb-4">Doctor Account</h3>
              <p className="text-white/60 mb-8 font-light">Optimise your clinical workflow with data-driven insights and AI-powered summaries.</p>
              
              <ul className="space-y-4 mt-auto">
                {[
                  'Real-time Clinical Monitoring & trend charts',
                  'AI-Powered 14-day Wellbeing Summaries',
                  'Custom Health Form Builder & Distribution',
                  'Centralised Patient Connection Management'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-white/80">
                    <div className="w-5 h-5 bg-white/10 text-white rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="px-8 py-32 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl font-heading font-bold mb-4 tracking-tight">Features Showcase</h2>
          <p className="text-muted-foreground">Experience the powerful tools designed to simplify complex care.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-[32px] border border-border overflow-hidden hover:shadow-2xl transition-all group"
            >
              <div 
                className="aspect-video bg-muted relative overflow-hidden cursor-pointer group"
                onClick={(e) => {
                  const video = e.currentTarget.querySelector('video');
                  if (video) {
                    if (video.requestFullscreen) video.requestFullscreen();
                    else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
                    video.muted = false;
                    video.play();
                  }
                }}
              >
                <video 
                  src={feature.video}
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                />
                
                {/* Split Screen Labels */}
                <div className="absolute inset-x-0 top-4 px-6 flex justify-between pointer-events-none">
                  <span className="text-[8px] uppercase tracking-[0.2em] font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded-md text-white/90 border border-white/10">Patient</span>
                  <span className="text-[8px] uppercase tracking-[0.2em] font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded-md text-white/90 border border-white/10">Doctor</span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                
                {/* Fullscreen indicator on hover */}
                <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-[10px] uppercase tracking-widest font-bold bg-primary/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-white shadow-lg">Click to Fullscreen</span>
                </div>
              </div>
              <div className="p-8 text-center">
                <h3 className="text-xl font-heading font-bold">{feature.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>
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
              whileHover={{ y: -5 }}
              className="p-6 bg-card rounded-2xl border border-border text-center relative group overflow-hidden"
            >
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 font-heading font-bold text-lg">
                {member.name[0]}
              </div>
              <div className="font-heading font-bold text-sm">{member.name}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 mb-4">{member.role}</div>
              
              <div className="flex justify-center gap-3 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {member.github && (
                  <a href={member.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                    <Github className="w-4 h-4" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Reviews Section */}
      <section id="reviews-section" className="px-8 py-32 bg-primary/5">
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
