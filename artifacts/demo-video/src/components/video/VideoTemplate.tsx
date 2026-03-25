import { motion } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { AnimatePresence } from 'framer-motion';

export const SCENE_DURATIONS = {
  intro: 3000,
  login: 4000,
  ownerDashboard: 5000,
  trainerDashboard: 5000,
  whatsapp: 6000,
  outro: 4000,
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({
    durations: SCENE_DURATIONS,
  });

  return (
    <div className="w-full h-screen overflow-hidden relative font-body text-text-primary bg-bg-dark flex items-center justify-center perspective-1000">
      
      {/* Persistent Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-20 blur-[7.5rem]"
          style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }}
          animate={{
            x: currentScene === 0 ? '0%' : currentScene === 1 ? '10%' : currentScene === 2 ? '20%' : '50%',
            y: currentScene === 0 ? '0%' : currentScene === 1 ? '10%' : currentScene === 2 ? '-10%' : '20%',
            scale: currentScene === 4 ? 1.5 : 1
          }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-10 blur-[6.25rem]"
          style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }}
          animate={{
            x: currentScene === 0 ? '0%' : currentScene === 1 ? '-10%' : currentScene === 2 ? '-30%' : '-50%',
            scale: currentScene === 2 ? 1.5 : 1
          }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
        {/* Noise overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      </div>

      <AnimatePresence mode="wait">
        {currentScene === 0 && <SceneIntro key="intro" />}
        {currentScene === 1 && <SceneLogin key="login" />}
        {currentScene === 2 && <SceneOwnerDashboard key="owner" />}
        {currentScene === 3 && <SceneTrainerDashboard key="trainer" />}
        {currentScene === 4 && <SceneWhatsApp key="whatsapp" />}
        {currentScene === 5 && <SceneOutro key="outro" />}
      </AnimatePresence>
    </div>
  );
}

function SceneIntro() {
  return (
    <motion.div 
      className="relative z-10 flex flex-col items-center justify-center w-full h-full"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(1rem)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div 
        className="w-32 h-32 bg-surface rounded-3xl border border-border flex items-center justify-center mb-8 shadow-2xl"
        initial={{ y: 50, opacity: 0, rotateX: -20 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        transition={{ delay: 0.2, duration: 0.8, type: "spring", stiffness: 100 }}
      >
        <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 12H20M4 12V8M4 12V16M20 12V8M20 12V16M2 8H6M18 8H22M2 16H6M18 16H22M6 6V18M18 6V18" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
      <motion.h1 
        className="text-7xl font-bold tracking-tight mb-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        Gym<span className="text-primary">Leads</span>
      </motion.h1>
      <motion.p 
        className="text-2xl text-text-secondary"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        The complete gym management platform
      </motion.p>
    </motion.div>
  );
}

function SceneLogin() {
  return (
    <motion.div 
      className="relative z-10 flex w-full h-full items-center justify-center"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100, filter: "blur(1rem)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-[30vw] max-w-none bg-surface p-10 rounded-3xl border border-border shadow-2xl">
        <motion.div 
          className="flex flex-col items-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" className="mb-4">
            <path d="M4 12H20M4 12V8M4 12V16M20 12V8M20 12V16M2 8H6M18 8H22M2 16H6M18 16H22M6 6V18M18 6V18" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2 className="text-3xl font-bold text-text-primary">GymLeads</h2>
          <p className="text-text-secondary mt-2 text-center">Sign in to manage your gym</p>
        </motion.div>
        
        <div className="space-y-6">
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>
              </div>
              <div className="w-full bg-bg-dark border border-border rounded-xl py-4 pl-12 pr-4 text-text-secondary flex items-center">
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 1 }}
                >
                  admin@fitzone.com
                </motion.span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </div>
              <div className="w-full bg-bg-dark border border-border rounded-xl py-4 pl-12 pr-4 text-text-secondary flex items-center">
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5, duration: 0.5 }}
                >
                  ••••••••
                </motion.span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
            className="pt-4"
          >
            <motion.div 
              className="w-full bg-primary text-bg-dark font-bold text-center py-4 rounded-xl text-lg relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div 
                className="absolute inset-0 bg-white opacity-20"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ delay: 2.2, duration: 0.6, ease: "easeInOut" }}
              />
              Sign In
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function SceneOwnerDashboard() {
  return (
    <motion.div 
      className="relative z-10 w-full h-full flex flex-col items-center justify-center p-12 perspective-1000"
      initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, y: -50, filter: "blur(1rem)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-[80vw] max-w-none">
        <motion.div 
          className="flex justify-between items-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div>
            <h2 className="text-4xl font-bold">Owner Dashboard</h2>
            <p className="text-text-secondary text-lg mt-2">Welcome back, FitZone Admin</p>
          </div>
          <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">FA</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-4 gap-6 mb-10">
          {[
            { label: "Enquiries", value: "24", change: "+12%" },
            { label: "Trials Booked", value: "8", change: "+4%" },
            { label: "Active Members", value: "452", change: "+18%" },
            { label: "Expiring Soon", value: "15", change: "-2%", alert: true }
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              className="bg-surface border border-border p-6 rounded-2xl relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 100 }}
            >
              {stat.alert && (
                <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-warning shadow-[0_0_0.625rem_var(--color-warning)] animate-pulse" />
              )}
              <h3 className="text-text-secondary font-medium mb-2">{stat.label}</h3>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold">{stat.value}</span>
                <span className={`text-sm ${stat.change.startsWith('+') ? 'text-primary' : 'text-text-secondary'}`}>{stat.change}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="bg-surface border border-border rounded-2xl p-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <h3 className="text-2xl font-bold mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {[
              { icon: "👤", title: "New Member Joined", time: "10 mins ago", desc: "Alex signed up for 12 months" },
              { icon: "💳", title: "Payment Received", time: "1 hour ago", desc: "$120 from Sarah M." },
              { icon: "⚠️", title: "Membership Expiring", time: "2 hours ago", desc: "John's plan expires in 3 days" }
            ].map((activity, i) => (
              <motion.div 
                key={i}
                className="flex items-start gap-4 p-4 rounded-xl bg-bg-dark border border-border/50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + i * 0.15 }}
              >
                <div className="text-2xl">{activity.icon}</div>
                <div>
                  <h4 className="font-semibold text-lg">{activity.title}</h4>
                  <p className="text-text-secondary">{activity.desc}</p>
                </div>
                <div className="ml-auto text-sm text-text-secondary">{activity.time}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function SceneTrainerDashboard() {
  return (
    <motion.div 
      className="relative z-10 w-full h-full flex flex-col items-center justify-center p-12"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(1rem)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-[80vw] max-w-none">
        <motion.div 
          className="flex justify-between items-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div>
            <h2 className="text-4xl font-bold">Trainer Dashboard</h2>
            <p className="text-text-secondary text-lg mt-2">Welcome back, Coach Mike</p>
          </div>
          <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">CM</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-8 mb-10">
          <motion.div 
            className="bg-surface border border-border p-8 rounded-2xl flex items-center justify-between"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <div>
              <h3 className="text-text-secondary text-xl mb-2">My Clients</h3>
              <p className="text-6xl font-bold">28</p>
            </div>
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
          </motion.div>
          <motion.div 
            className="bg-surface border border-border p-8 rounded-2xl flex items-center justify-between"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: "spring" }}
          >
            <div>
              <h3 className="text-text-secondary text-xl mb-2">Active Plans</h3>
              <p className="text-6xl font-bold">14</p>
            </div>
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
            </div>
          </motion.div>
        </div>

        <motion.h3 
          className="text-2xl font-bold mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Recent Client Progress
        </motion.h3>

        <div className="grid grid-cols-3 gap-6">
          {[
            { name: "Sarah Connor", weight: "65kg", target: "60kg", goal: "Weight Loss" },
            { name: "John Smith", weight: "82kg", target: "85kg", goal: "Muscle Gain" },
            { name: "Emma Davis", weight: "58kg", target: "55kg", goal: "Tone Up" }
          ].map((client, i) => (
            <motion.div 
              key={client.name}
              className="bg-surface border border-border p-6 rounded-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.15, type: "spring" }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-bg-dark border border-border flex items-center justify-center font-bold">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{client.name}</h4>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">{client.goal}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-secondary">Current Weight</span>
                  <span className="font-bold">{client.weight}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-text-secondary">Target Weight</span>
                  <span className="font-bold text-primary">{client.target}</span>
                </div>
              </div>
              <button className="w-full mt-6 py-3 rounded-xl bg-bg-dark border border-border text-text-primary hover:bg-primary hover:text-bg-dark transition-colors font-medium">
                View Details
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function SceneWhatsApp() {
  return (
    <motion.div 
      className="relative z-10 w-full h-full flex flex-col items-center justify-center p-12"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: 50, filter: "blur(1rem)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-[85vw] max-w-none grid grid-cols-12 gap-8 h-[80vh]">
        
        {/* Left Side: Broadcast Form */}
        <motion.div 
          className="col-span-5 bg-surface border border-border rounded-3xl p-8 flex flex-col"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-[#25D366]/20 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold">WhatsApp Broadcast</h2>
          </div>

          <div className="space-y-6 flex-1">
            <div>
              <label className="text-text-secondary text-sm mb-2 block">Select Audience</label>
              <div className="bg-bg-dark border border-border rounded-xl p-4 flex justify-between items-center">
                <span>Expiring Members (15)</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col">
              <label className="text-text-secondary text-sm mb-2 block">Message Template</label>
              <div className="bg-bg-dark border border-border rounded-xl p-4 flex-1">
                <p className="text-text-primary">Hi [member_name], your membership expires in 3 days. Please renew to continue access! 💪</p>
              </div>
            </div>
          </div>

          <motion.button 
            className="w-full bg-[#25D366] text-bg-dark font-bold text-lg py-4 rounded-xl mt-6 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            Send Broadcast
          </motion.button>
        </motion.div>

        {/* Right Side: Phone Mockup / Messages */}
        <motion.div 
          className="col-span-7 flex items-center justify-center relative"
          initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ delay: 0.5, type: "spring", duration: 1 }}
        >
          {/* Phone Frame */}
          <div className="w-[23.75rem] h-[46.875rem] bg-bg-dark border-8 border-surface rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col">
            {/* Header */}
            <div className="bg-surface px-6 pt-12 pb-4 flex items-center gap-4 z-10 shadow-md">
               <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                 <span className="text-[#25D366] font-bold">F</span>
               </div>
               <div>
                 <h3 className="font-bold">FitZone Gym</h3>
                 <p className="text-xs text-text-secondary">Official Account</p>
               </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-[#0b141a] p-4 flex flex-col gap-4 overflow-hidden relative" style={{ backgroundImage: 'radial-gradient(circle at center, #111b21 0%, #0b141a 100%)' }}>
              
              <motion.div 
                className="self-center bg-[#182229] text-[#8696a0] text-xs px-3 py-1 rounded-lg"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                Today
              </motion.div>

              <motion.div 
                className="bg-[#005c4b] text-[#e9edef] p-3 rounded-2xl rounded-tr-none max-w-[85%] self-end shadow-sm"
                initial={{ opacity: 0, scale: 0.8, x: 20, transformOrigin: 'top right' }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 1.5, type: "spring" }}
              >
                <p>Hi Alex, your membership expires in 3 days. Please renew to continue access! 💪</p>
                <div className="text-[10px] text-[#8696a0] text-right mt-1">10:42 AM ✓✓</div>
              </motion.div>

              <motion.div 
                className="bg-[#202c33] text-[#e9edef] p-3 rounded-2xl rounded-tl-none max-w-[85%] self-start shadow-sm mt-4"
                initial={{ opacity: 0, scale: 0.8, x: -20, transformOrigin: 'top left' }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 2.5, type: "spring" }}
              >
                <p>Thanks! Just renewed via the app.</p>
                <div className="text-[10px] text-[#8696a0] mt-1">10:45 AM</div>
              </motion.div>
              
              <motion.div 
                className="bg-[#005c4b] text-[#e9edef] p-3 rounded-2xl rounded-tr-none max-w-[85%] self-end shadow-sm mt-4"
                initial={{ opacity: 0, scale: 0.8, x: 20, transformOrigin: 'top right' }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 4, type: "spring" }}
              >
                <p>Welcome to FitZone! Your trial session is confirmed for tomorrow at 10 AM. 🏋️‍♂️</p>
                <div className="text-[10px] text-[#8696a0] text-right mt-1">11:00 AM ✓✓</div>
              </motion.div>
            </div>
            
            {/* Input area */}
            <div className="bg-surface p-4 flex gap-2 items-center z-10">
              <div className="flex-1 bg-bg-dark rounded-full h-10 px-4 flex items-center">
                <span className="text-text-secondary text-sm">Type a message...</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

function SceneOutro() {
  return (
    <motion.div 
      className="relative z-10 flex flex-col items-center justify-center w-full h-full"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(1rem)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div 
        className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_2.5rem_rgba(46,204,113,0.4)]"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
      >
        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 12H20M4 12V8M4 12V16M20 12V8M20 12V16M2 8H6M18 8H22M2 16H6M18 16H22M6 6V18M18 6V18" stroke="var(--color-bg-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
      <motion.h1 
        className="text-6xl font-bold tracking-tight mb-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        Empower Your Gym
      </motion.h1>
      <motion.p 
        className="text-2xl text-text-secondary text-primary"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        gymleads.com
      </motion.p>
    </motion.div>
  );
}
