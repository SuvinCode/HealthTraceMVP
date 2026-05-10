import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/api/client';
import { Linkedin, Github, Stethoscope, User, Check, Shield, Info, Lock, FileText, X } from 'lucide-react';

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

const CORE_TEAM = [
  {
    name: 'Suvin',
    role: 'Founder & CEO',
    image: 'pictures/suvinpfp.png',
    education: 'Bachelors of Computer Science, Major In Machine Learning At University Of Queensland, Australia',
    linkedin: 'https://www.linkedin.com/in/suvin-chin-90389b157/',
    github: 'https://github.com/SuvinCode'
  },
  {
    name: 'Kunga',
    role: 'CFO & CLO',
    image: 'pictures/kongapfp.png',
    education: 'Bachelor of Laws(Honours) & Bachelor of Commerce(Finance) At University of Queensland, Australia & Bachelor of Math at Queensland University of Technology, Australia',
    linkedin: 'https://www.linkedin.com/in/kunga-moenlam-261988245/'
  },
];

const MVP_TEAM = [
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
    linkedin: 'https://www.linkedin.com/in/tanmayi-mendhe-44ab34278/',
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
    video: 'videos/Connecting_doctor_and_patients.mp4'
  },
  {
    title: 'Precision Medication',
    video: 'videos/Assigning_medication.mp4'
  },
  {
    title: 'Intuitive Diary',
    video: 'videos/Diary.mp4'
  },
  {
    title: 'Smart Appointments',
    video: 'videos/Appointments.mp4'
  },
  {
    title: 'Custom Health Forms',
    video: 'videos/Creating_a_health_form.mp4'
  },
];


const FOOTER_CONTENT = {
  how: {
    title: "How to Use HealthTrace",
    icon: Info,
    sections: [
      { t: "Patients: Manage Care", d: "Fill health forms, track medications, and manage appointments on your clinical calendar." },
      { t: "Patients: Daily Diary", d: "Securely log your symptoms and mood to share progress with your healthcare team." },
      { t: "Doctors: Connected Care", d: "Connect with patients and monitor their real-time health data from your dashboard." },
      { t: "Doctors: Workflow", d: "Assign custom forms, manage clinical notes, and generate clinical-grade progress reports." }
    ]
  },
  ai_evaluation: {
    title: "Ai Evaluation",
    icon: Shield,
    sections: [
      { t: "Metric Analysis", d: "Our Ai evaluates sleep analysis, step count, and screen time to find health correlations." },
      { t: "Note Summarization", d: "Voice and written notes are analyzed to extract key clinical trends and symptoms." },
      { t: "Safety First", d: "All Ai processing is done with strict medical-grade privacy and encryption standards." }
    ]
  },
  data: {
    title: "Your Data, Secured",
    icon: Lock,
    sections: [
      { t: "Biometrics", d: "Sleep analysis, step count and screen time from Apple Health or connected wearables." },
      { t: "Notes", d: "The voice notes and written notes you make are private and secure." },
      { t: "Encryption", d: "All health data is AES-256 encrypted. We never sell your data." }
    ]
  },
  terms: {
    title: "Terms of Service",
    icon: FileText,
    sections: [
      { t: "MVP Beta", d: "This is a clinical assistant tool, not a medical diagnostic platform." },
      { t: "Data Ownership", d: "You own your data. You can delete your entire health history in one tap." },
      { t: "Liability", d: "Usage of this application is at the user's discretion during the beta phase." }
    ]
  }
};

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
  const [activeModal, setActiveModal] = useState(null);

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
      await fetch('https://formsubmit.co/ajax/suvinbusiness@gmail.com', {
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
          className="sticky top-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 max-w-7xl mx-auto border-b border-red-100/60"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.img
              whileHover={{ rotate: 10, scale: 1.1 }}
              src={`${import.meta.env.BASE_URL}favicon.svg`} alt="HealthTrace logo" className="w-10 h-10 sm:w-14 sm:h-14 object-contain"
            />
            <span className="font-heading font-bold text-lg sm:text-2xl tracking-tight">
              <span style={{ color: '#CC2222' }}>Health</span><span style={{ color: '#1E2D4E' }}>Trace</span>
            </span>
          </div>
          <div className="flex gap-1 sm:gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-3 sm:px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              Log in
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/signup')}
              className="bg-foreground text-background px-4 sm:px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-all shadow-sm whitespace-nowrap"
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
                  src={`${import.meta.env.BASE_URL}${feature.video}`}
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
            — Dr Francis, Gastroenterologist
          </motion.cite>
        </div>
      </motion.section>

      {/* Core Founding Team */}
      <section className="px-8 py-32 max-w-7xl mx-auto pb-0">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs font-bold uppercase tracking-[0.3em] mb-12 text-center font-heading text-primary"
        >
          Core Founding Team (The Main Founding Team)
        </motion.p>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-8 max-w-5xl mx-auto"
        >
          {CORE_TEAM.map((member, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="p-8 md:p-10 bg-card rounded-[32px] border border-border flex flex-col md:flex-row items-center gap-8 md:gap-12 relative group overflow-hidden shadow-sm hover:shadow-xl transition-all"
            >
              {/* Profile Image */}
              <div className="relative shrink-0">
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden shadow-2xl border-4 border-background group-hover:scale-105 transition-transform duration-500">
                  <img 
                    src={`${import.meta.env.BASE_URL}${member.image}`} 
                    alt={member.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-heading font-bold shadow-lg">
                  {member.name[0]}
                </div>
              </div>

              {/* Info Content */}
              <div className="flex-1 text-center md:text-left">
                <div className="mb-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Core Founder</span>
                </div>
                <h3 className="text-3xl font-heading font-bold mb-1">{member.name}</h3>
                <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">{member.role}</p>
                
                <div className="max-w-xl">
                  <p className="text-sm md:text-base text-foreground/80 leading-relaxed italic">
                    <span className="font-bold not-italic text-foreground">Education:</span> {member.education}
                  </p>
                </div>

                <div className="flex justify-center md:justify-start gap-4 mt-8 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Linkedin className="w-4 h-4" />
                      </div>
                      LinkedIn
                    </a>
                  )}
                  {member.github && (
                    <a href={member.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Github className="w-4 h-4" />
                      </div>
                      GitHub
                    </a>
                  )}
                </div>
              </div>

              {/* Decorative Background Element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10 group-hover:bg-primary/10 transition-colors" />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Separation Line */}
      <div className="max-w-4xl mx-auto px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
      </div>

      {/* MVP Founding Team */}
      <section className="px-8 py-32 max-w-7xl mx-auto pt-24">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.4 }}
          viewport={{ once: true }}
          className="text-[10px] uppercase tracking-[0.2em] mb-12 text-center font-heading"
        >
          MVP Founding Team
        </motion.p>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto"
        >
          {MVP_TEAM.map((member, i) => (
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
                className={`w-full py-5 rounded-2xl font-heading font-bold text-lg shadow-xl transition-all ${reviewSent
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


      {/* Documentation & Transparency Section */}
      <section className="px-8 py-32 max-w-7xl mx-auto border-t border-border mt-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <motion.div
            whileHover={{ y: -5 }}
            onClick={() => setActiveModal('how')}
            className="p-8 bg-card rounded-[32px] border border-border cursor-pointer hover:shadow-xl transition-all group"
          >
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-heading font-bold mb-3">How to Use</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">A simple guide to baseline tracking and clinical reports connected for both parties.</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            onClick={() => setActiveModal('ai_evaluation')}
            className="p-8 bg-card rounded-[32px] border border-border cursor-pointer hover:shadow-xl transition-all group"
          >
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-heading font-bold mb-3">Ai Evaluation</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Learn which metrics Ai takes in consideration when generating a report.</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            onClick={() => setActiveModal('data')}
            className="p-8 bg-card rounded-[32px] border border-border cursor-pointer hover:shadow-xl transition-all group"
          >
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-heading font-bold mb-3">Data Safety</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">How we collect and secure your sensitive health information.</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            onClick={() => setActiveModal('terms')}
            className="p-8 bg-card rounded-[32px] border border-border cursor-pointer hover:shadow-xl transition-all group"
          >
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-heading font-bold mb-3">Terms</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">The clinical and legal framework for using HealthTrace.</p>
          </motion.div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="px-8 py-24 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="Logo" className="w-10 h-10" />
                <span className="font-heading font-bold text-xl tracking-tight">
                  <span style={{ color: '#CC2222' }}>Health</span><span style={{ color: '#1E2D4E' }}>Trace</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Empowering patients with invisible illnesses to prove their symptoms and optimize their care through deep clinical insights.
              </p>
            </div>

            <div>
              <h4 className="font-heading font-bold text-xs uppercase tracking-widest text-foreground/40 mb-6">Product</h4>
              <ul className="space-y-4">
                <li><button onClick={() => setActiveModal('how')} className="text-muted-foreground hover:text-primary text-sm transition-colors">How it works</button></li>
                <li><button onClick={() => setActiveModal('ai_evaluation')} className="text-muted-foreground hover:text-primary text-sm transition-colors">Ai Evaluation</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-bold text-xs uppercase tracking-widest text-foreground/40 mb-6">Trust & Legal</h4>
              <ul className="space-y-4">
                <li><button onClick={() => setActiveModal('data')} className="text-muted-foreground hover:text-primary text-sm transition-colors">Data Collection</button></li>
                <li><button onClick={() => setActiveModal('terms')} className="text-muted-foreground hover:text-primary text-sm transition-colors">Terms of Service</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-bold text-xs uppercase tracking-widest text-foreground/40 mb-6">Connect</h4>
              <div className="flex gap-4">
                <a href={CORE_TEAM[0].linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href={CORE_TEAM[0].github} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-muted-foreground uppercase tracking-widest pt-12">
            <div>© 2026 HealthTrace • Australian MedTech Innovation</div>
            <div className="flex gap-6">
              <span className="hover:text-foreground transition-colors cursor-default">Privacy Centric</span>
              <span className="hover:text-foreground transition-colors cursor-default">Research Backed</span>
              <span className="hover:text-foreground transition-colors cursor-default">Patient Focused</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Info Modals */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card w-full max-w-xl rounded-[40px] border border-border overflow-hidden shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 md:p-12">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                      {(() => {
                        const Icon = FOOTER_CONTENT[activeModal].icon;
                        return <Icon className="w-7 h-7" />;
                      })()}
                    </div>
                    <h2 className="text-3xl font-heading font-bold tracking-tight">{FOOTER_CONTENT[activeModal].title}</h2>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="absolute top-8 right-8 p-3 hover:bg-muted rounded-full transition-all text-muted-foreground hover:rotate-90"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  {FOOTER_CONTENT[activeModal].sections.map((section, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="group"
                    >
                      <h3 className="font-heading font-bold text-lg mb-2 text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {section.t}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed ml-3.5 pl-4 border-l border-border group-hover:border-primary/30 transition-colors">
                        {section.d}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveModal(null)}
                  className="w-full mt-12 bg-foreground text-background py-5 rounded-[20px] font-bold text-lg hover:opacity-90 transition-all font-heading shadow-xl shadow-foreground/10"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
