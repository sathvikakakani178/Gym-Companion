import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';

export const SCENE_DURATIONS = {
  intro: 3000,
  ownerLogin: 5000,
  ownerDashboard: 7000,
  membersPage: 7000,
  addMember: 5000,
  trainersPage: 6000,
  whatsapp: 6000,
  trainerLogin: 5000,
  trainerDashboard: 6000,
  myClientsPage: 6000,
  dietPlansPage: 8000,
  outro: 4000,
};

export function useSceneNarration(text: string) {
  useEffect(() => {
    window.speechSynthesis.cancel();
    if (text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
    // No cleanup that cancels speech, as exit animations would cause premature cancellation
  }, [text]);
}

const slideUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const wipeRight = {
  initial: { clipPath: "inset(0 100% 0 0)", opacity: 1 },
  animate: { clipPath: "inset(0 0% 0 0)", opacity: 1 },
  exit: { clipPath: "inset(0 0 0 100%)", opacity: 1 }
};

const wipeDown = {
  initial: { clipPath: "inset(0 0 100% 0)", opacity: 1 },
  animate: { clipPath: "inset(0 0 0% 0)", opacity: 1 },
  exit: { clipPath: "inset(100% 0 0 0)", opacity: 1 }
};

const wipeUp = {
  initial: { clipPath: "inset(100% 0 0 0)", opacity: 1 },
  animate: { clipPath: "inset(0% 0 0 0)", opacity: 1 },
  exit: { clipPath: "inset(0 0 100% 0)", opacity: 1 }
};

const circleReveal = {
  initial: { clipPath: "circle(0% at 50% 50%)", opacity: 1 },
  animate: { clipPath: "circle(150% at 50% 50%)", opacity: 1 },
  exit: { clipPath: "circle(0% at 50% 50%)", opacity: 1 }
};

const diamondReveal = {
  initial: { clipPath: "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)", opacity: 1 },
  animate: { clipPath: "polygon(50% -100%, 200% 50%, 50% 200%, -100% 50%)", opacity: 1 },
  exit: { clipPath: "polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)", opacity: 1 }
}

const transProps = { duration: 0.9, ease: [0.76, 0, 0.24, 1] };

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({
    durations: SCENE_DURATIONS,
  });

  return (
    <div className="w-full h-screen overflow-hidden relative font-body text-text-primary bg-[#0D0F14] flex items-center justify-center perspective-1000">
      
      {/* Persistent Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full opacity-20 blur-[8rem]"
          style={{ background: 'radial-gradient(circle, #2ECC71 0%, transparent 70%)' }}
          animate={{
            x: currentScene % 2 === 0 ? '0%' : '20%',
            y: currentScene % 3 === 0 ? '0%' : '10%',
            scale: currentScene === 11 ? 1.5 : 1
          }}
          transition={{ duration: 3, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full opacity-10 blur-[6rem]"
          style={{ background: 'radial-gradient(circle, #2ECC71 0%, transparent 70%)' }}
          animate={{
            x: currentScene % 2 === 1 ? '0%' : '-20%',
            scale: currentScene === 2 ? 1.5 : 1
          }}
          transition={{ duration: 4, ease: "easeInOut" }}
        />
        {/* Noise overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      </div>

      <AnimatePresence mode="wait">
        {currentScene === 0 && <Scene1Intro key="scene-0" />}
        {currentScene === 1 && <Scene2OwnerLogin key="scene-1" />}
        {currentScene === 2 && <Scene3OwnerDashboard key="scene-2" />}
        {currentScene === 3 && <Scene4MembersPage key="scene-3" />}
        {currentScene === 4 && <Scene5AddMember key="scene-4" />}
        {currentScene === 5 && <Scene6TrainersPage key="scene-5" />}
        {currentScene === 6 && <Scene7WhatsApp key="scene-6" />}
        {currentScene === 7 && <Scene8TrainerLogin key="scene-7" />}
        {currentScene === 8 && <Scene9TrainerDashboard key="scene-8" />}
        {currentScene === 9 && <Scene10MyClientsPage key="scene-9" />}
        {currentScene === 10 && <Scene11DietPlansPage key="scene-10" />}
        {currentScene === 11 && <Scene12Outro key="scene-11" />}
      </AnimatePresence>
    </div>
  );
}

// SCENE 1
function Scene1Intro() {
  useSceneNarration("Introducing GymLeads — the complete gym management platform.");
  return (
    <motion.div 
      className="absolute inset-0 z-10 flex flex-col items-center justify-center w-full h-full bg-[#0D0F14]/50"
      {...circleReveal}
      transition={transProps}
    >
      <motion.div 
        className="w-32 h-32 bg-[#161922] rounded-3xl border border-[#1E2433] flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(46,204,113,0.15)]"
        initial={{ y: 50, opacity: 0, rotateX: -20 }}
        animate={{ y: 0, opacity: 1, rotateX: 0 }}
        transition={{ delay: 0.2, duration: 0.8, type: "spring", stiffness: 100 }}
      >
        <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 12H20M4 12V8M4 12V16M20 12V8M20 12V16M2 8H6M18 8H22M2 16H6M18 16H22M6 6V18M18 6V18" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
      <motion.h1 
        className="text-7xl font-bold tracking-tight mb-4 text-[#F0F4FF]"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        Gym<span className="text-[#2ECC71]">Leads</span>
      </motion.h1>
      <motion.p 
        className="text-2xl text-[#8A94A6]"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        The complete gym management platform
      </motion.p>
    </motion.div>
  );
}

// SCENE 2
function Scene2OwnerLogin() {
  useSceneNarration("Gym owners log in to get a full view of their business.");
  
  const emailText = "owner@fitzone.com";
  const [emailChars, setEmailChars] = useState(0);
  const [passChars, setPassChars] = useState(0);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    let t1 = setTimeout(() => {
      const iv = setInterval(() => setEmailChars(c => Math.min(c + 1, emailText.length)), 50);
      setTimeout(() => clearInterval(iv), emailText.length * 50);
    }, 800);
    
    let t2 = setTimeout(() => {
      const iv = setInterval(() => setPassChars(c => Math.min(c + 1, 8)), 50);
      setTimeout(() => clearInterval(iv), 400);
    }, 2000);

    let t3 = setTimeout(() => setFlash(true), 3000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 z-10 flex w-full h-full items-center justify-center bg-[#0D0F14]/50"
      {...wipeDown}
      transition={transProps}
    >
      <div className="w-[30vw] min-w-[400px] bg-[#161922] p-10 rounded-3xl border border-[#1E2433] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <motion.div className="flex flex-col items-center mb-10" {...slideUp}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2" className="mb-4">
            <path d="M4 12H20M4 12V8M4 12V16M20 12V8M20 12V16M2 8H6M18 8H22M2 16H6M18 16H22M6 6V18M18 6V18" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2 className="text-3xl font-bold text-[#F0F4FF]">Owner Login</h2>
        </motion.div>
        
        <div className="space-y-6">
          <motion.div className="space-y-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <div className="w-full bg-[#0D0F14] border border-[#1E2433] rounded-xl py-4 px-4 text-[#F0F4FF] flex items-center h-[58px]">
              {emailText.substring(0, emailChars)}
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="ml-1 inline-block w-0.5 h-5 bg-[#2ECC71]" />
            </div>
          </motion.div>

          <motion.div className="space-y-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <div className="w-full bg-[#0D0F14] border border-[#1E2433] rounded-xl py-4 px-4 text-[#F0F4FF] flex items-center h-[58px]">
              {"•".repeat(passChars)}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="pt-4">
            <motion.div 
              className="w-full bg-[#2ECC71] text-[#0D0F14] font-bold text-center py-4 rounded-xl text-lg relative overflow-hidden"
              animate={flash ? { scale: [1, 1.05, 1], backgroundColor: ["#2ECC71", "#4FFF93", "#2ECC71"] } : {}}
              transition={{ duration: 0.3 }}
            >
              Sign In
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// SCENE 3
function Scene3OwnerDashboard() {
  useSceneNarration("The owner dashboard shows live stats — enquiries, trials booked, active members, and expiring soon alerts.");
  return (
    <motion.div 
      className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center p-12 perspective-1000"
      {...wipeRight}
      transition={transProps}
    >
      <div className="w-[80vw] max-w-none">
        <motion.div className="flex justify-between items-center mb-10" {...slideUp}>
          <div>
            <h2 className="text-4xl font-bold text-[#F0F4FF]">Owner Dashboard</h2>
            <p className="text-[#8A94A6] text-lg mt-2">Welcome back, FitZone Admin</p>
          </div>
          <div className="w-16 h-16 bg-[#161922] border border-[#1E2433] rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-[#2ECC71]">FA</span>
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
              className="bg-[#161922] border border-[#1E2433] p-6 rounded-2xl relative overflow-hidden shadow-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 100 }}
            >
              {stat.alert && (
                <motion.div 
                  className="absolute top-4 right-4 w-3 h-3 rounded-full bg-[#F59E0B] shadow-[0_0_10px_#F59E0B]"
                  animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
              <h3 className="text-[#8A94A6] font-medium mb-2">{stat.label}</h3>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-bold text-[#F0F4FF]">{stat.value}</span>
                <span className={`text-sm ${stat.change.startsWith('+') ? 'text-[#2ECC71]' : 'text-[#8A94A6]'}`}>{stat.change}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div className="bg-[#161922] border border-[#1E2433] rounded-2xl p-8 shadow-lg" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
          <h3 className="text-2xl font-bold mb-6 text-[#F0F4FF]">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { icon: "👤", title: "New Member Joined", time: "10 mins ago", desc: "Alex signed up for 12 months" },
              { icon: "💳", title: "Payment Received", time: "1 hour ago", desc: "$120 from Sarah M." },
              { icon: "⚠️", title: "Membership Expiring", time: "2 hours ago", desc: "John's plan expires in 3 days" }
            ].map((activity, i) => (
              <motion.div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-[#0D0F14] border border-[#1E2433]" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 + i * 0.15 }}>
                <div className="text-2xl">{activity.icon}</div>
                <div>
                  <h4 className="font-semibold text-lg text-[#F0F4FF]">{activity.title}</h4>
                  <p className="text-[#8A94A6]">{activity.desc}</p>
                </div>
                <div className="ml-auto text-sm text-[#8A94A6]">{activity.time}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// SCENE 4
function Scene4MembersPage() {
  useSceneNarration("Manage all your members in one place. Filter by status, add new members, and track every renewal.");
  const [openCard, setOpenCard] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpenCard(true), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center p-12"
      {...wipeUp}
      transition={transProps}
    >
      <div className="w-[80vw] flex flex-col">
        <motion.div className="flex justify-between items-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="text-4xl font-bold text-[#F0F4FF]">Members</h2>
          <button className="bg-[#2ECC71] text-[#0D0F14] px-6 py-3 rounded-xl font-bold flex items-center gap-2">
            <span>+</span> Add Member
          </button>
        </motion.div>
        
        <motion.div className="flex gap-4 mb-8 items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <div className="flex-1 bg-[#161922] border border-[#1E2433] rounded-xl px-4 py-3 text-[#8A94A6] flex gap-2">
             <span>🔍</span> Search members...
          </div>
          <div className="flex gap-2">
            {['All', 'Active', 'Expiring', 'Expired'].map((chip, i) => (
              <div key={chip} className={`px-4 py-2 rounded-lg text-sm ${i===0 ? 'bg-[#2ECC71] text-[#0D0F14] font-bold' : 'bg-[#161922] border border-[#1E2433] text-[#8A94A6]'}`}>
                {chip}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-4 gap-6">
          {[
            { name: "Alex R.", phone: "+1 234 567", status: "Active", days: "240 days left", color: "#2ECC71", plan: "Yearly" },
            { name: "John S.", phone: "+1 987 654", status: "Expiring", days: "3 days left", color: "#F59E0B", plan: "Monthly" },
            { name: "Emma W.", phone: "+1 456 789", status: "Expired", days: "Expired", color: "#EF4444", plan: "Quarterly" },
            { name: "Mike T.", phone: "+1 321 654", status: "Active", days: "120 days left", color: "#2ECC71", plan: "Yearly" }
          ].map((m, i) => (
            <motion.div 
              key={m.name}
              className="bg-[#161922] border border-[#1E2433] rounded-2xl p-6 shadow-lg flex flex-col gap-4 relative overflow-hidden"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.1, type: "spring" }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#0D0F14] border border-[#1E2433] flex items-center justify-center font-bold text-lg">{m.name[0]}</div>
                <div>
                  <h4 className="font-bold text-lg text-[#F0F4FF]">{m.name}</h4>
                  <p className="text-sm text-[#8A94A6]">{m.phone}</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="px-2 py-1 rounded-full font-medium" style={{ color: m.color, backgroundColor: `${m.color}20` }}>{m.status}</span>
                <span className="bg-[#0D0F14] text-[#8A94A6] px-2 py-1 rounded-md border border-[#1E2433]">{m.plan}</span>
              </div>
              <div className="text-sm text-[#8A94A6] text-right font-medium">{m.days}</div>
              
              {/* Animating card open for Renew Membership */}
              {i === 1 && (
                <motion.div 
                  className="mt-2 pt-4 border-t border-[#1E2433] flex justify-center"
                  initial={{ height: 0, opacity: 0, marginTop: 0, paddingTop: 0 }}
                  animate={openCard ? { height: 'auto', opacity: 1, marginTop: 8, paddingTop: 16 } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <button className="w-full bg-[#F59E0B] text-[#0D0F14] font-bold py-2 rounded-lg">Renew Membership</button>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// SCENE 5
function Scene5AddMember() {
  useSceneNarration("Adding a new member takes seconds. Fill in their details, pick a plan, assign a trainer.");
  return (
    <motion.div 
      className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center p-12"
      {...diamondReveal}
      transition={transProps}
    >
      <div className="w-[40vw] bg-[#161922] p-8 rounded-3xl border border-[#1E2433] shadow-2xl">
        <motion.h2 className="text-3xl font-bold mb-6 text-[#F0F4FF]" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>Add New Member</motion.h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <motion.div className="flex-1" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
              <label className="text-sm text-[#8A94A6] mb-2 block">Full Name</label>
              <div className="w-full bg-[#0D0F14] border border-[#1E2433] rounded-xl py-3 px-4 text-[#F0F4FF]">Sarah Jenkins</div>
            </motion.div>
            <motion.div className="flex-1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
              <label className="text-sm text-[#8A94A6] mb-2 block">Phone</label>
              <div className="w-full bg-[#0D0F14] border border-[#1E2433] rounded-xl py-3 px-4 text-[#F0F4FF]">+1 234 567 8900</div>
            </motion.div>
          </div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <label className="text-sm text-[#8A94A6] mb-2 block">Select Plan</label>
            <div className="flex gap-4">
              {['Monthly', 'Quarterly', 'Yearly'].map(p => (
                <div key={p} className={`flex-1 text-center py-3 rounded-xl border transition-colors ${p === 'Quarterly' ? 'bg-[#2ECC71] border-[#2ECC71] text-[#0D0F14] font-bold' : 'bg-[#0D0F14] border-[#1E2433] text-[#8A94A6]'}`}>
                  {p}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
            <label className="text-sm text-[#8A94A6] mb-2 block">Assign Trainer</label>
            <div className="w-full bg-[#0D0F14] border border-[#1E2433] rounded-xl py-3 px-4 text-[#F0F4FF] flex justify-between">
              Coach Mike <span className="text-[#8A94A6]">▼</span>
            </div>
          </motion.div>

          <motion.button 
            className="w-full bg-[#2ECC71] text-[#0D0F14] font-bold py-4 rounded-xl mt-4 text-lg shadow-[0_0_20px_rgba(46,204,113,0.3)]"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
          >
            Add Member
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// SCENE 6
function Scene6TrainersPage() {
  useSceneNarration("View and manage your coaching staff. See each trainer's specialization, client load, and contact info.");
  return (
    <motion.div 
      className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center p-12"
      {...wipeRight}
      transition={transProps}
    >
      <div className="w-[80vw]">
        <motion.div className="flex justify-between items-center mb-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h2 className="text-4xl font-bold text-[#F0F4FF]">Trainers</h2>
          <button className="bg-[#2ECC71] text-[#0D0F14] px-6 py-3 rounded-xl font-bold flex items-center gap-2">
            <span>+</span> Add Trainer
          </button>
        </motion.div>

        <div className="grid grid-cols-3 gap-8">
          {[
            { name: "Coach Mike", email: "mike@fitzone.com", badges: ["Strength", "Bodybuilding"], clients: 28, phone: "+1 555 0101" },
            { name: "Sarah Connor", email: "sarah@fitzone.com", badges: ["Yoga", "Pilates"], clients: 34, phone: "+1 555 0202" },
            { name: "David Kim", email: "david@fitzone.com", badges: ["Cardio", "HIIT"], clients: 41, phone: "+1 555 0303" }
          ].map((t, i) => (
            <motion.div 
              key={t.name}
              className="bg-[#161922] border border-[#1E2433] rounded-3xl p-8 flex flex-col gap-6"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.15, type: "spring" }}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#0D0F14] border border-[#1E2433] flex items-center justify-center font-bold text-2xl text-[#2ECC71]">{t.name[0]}</div>
                <div>
                  <h3 className="text-xl font-bold text-[#F0F4FF]">{t.name}</h3>
                  <p className="text-[#8A94A6] text-sm">{t.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {t.badges.map(b => (
                  <span key={b} className="bg-[#2ECC71]/20 text-[#2ECC71] text-xs px-3 py-1 rounded-full border border-[#2ECC71]/30">{b}</span>
                ))}
              </div>
              <div className="flex justify-between border-t border-[#1E2433] pt-6 mt-2">
                <div>
                  <p className="text-xs text-[#8A94A6]">Active Clients</p>
                  <p className="text-2xl font-bold text-[#F0F4FF]">{t.clients}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#8A94A6]">Phone</p>
                  <p className="text-sm font-medium mt-1 text-[#F0F4FF]">{t.phone}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// SCENE 7
function Scene7WhatsApp() {
  useSceneNarration("Send automated WhatsApp messages to members. Broadcast renewals, trial reminders — all from the platform.");
  return (
    <motion.div 
      className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center p-12"
      {...circleReveal}
      transition={transProps}
    >
      <div className="w-[85vw] max-w-none grid grid-cols-12 gap-12 h-[80vh]">
        <motion.div className="col-span-5 bg-[#161922] border border-[#1E2433] rounded-3xl p-8 flex flex-col" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-[#25D366]/20 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
            </div>
            <h2 className="text-3xl font-bold text-[#F0F4FF]">WhatsApp Broadcast</h2>
          </div>
          <div className="space-y-6 flex-1">
            <div>
              <label className="text-[#8A94A6] text-sm mb-2 block">Select Audience</label>
              <div className="bg-[#0D0F14] border border-[#1E2433] rounded-xl p-4 flex justify-between items-center text-[#F0F4FF]">
                <span>Expiring Members (15)</span>
                <span className="text-[#8A94A6]">▼</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-[#8A94A6] text-sm mb-2 block">Message Template</label>
              <div className="bg-[#0D0F14] border border-[#1E2433] rounded-xl p-4 flex-1 text-[#F0F4FF]">
                Hi [member_name], your membership expires in 3 days. Please renew to continue access! 💪
              </div>
            </div>
          </div>
          <motion.button className="w-full bg-[#25D366] text-[#0D0F14] font-bold text-lg py-4 rounded-xl mt-6 flex items-center justify-center gap-2">
            Send Broadcast
          </motion.button>
        </motion.div>

        <motion.div className="col-span-7 flex items-center justify-center relative" initial={{ opacity: 0, rotateY: 30, scale: 0.9 }} animate={{ opacity: 1, rotateY: 0, scale: 1 }} transition={{ delay: 0.5, duration: 1, type: "spring" }}>
          <div className="w-[380px] h-[750px] bg-[#0D0F14] border-[12px] border-[#161922] rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-[#161922] rounded-b-2xl z-20"></div>
            <div className="bg-[#161922] px-6 pt-12 pb-4 flex items-center gap-4 z-10 shadow-md">
               <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center text-[#25D366] font-bold">F</div>
               <div>
                 <h3 className="font-bold text-[#F0F4FF] leading-tight">FitZone Gym</h3>
                 <p className="text-[11px] text-[#8A94A6]">Official Account</p>
               </div>
            </div>
            <div className="flex-1 bg-[#0b141a] p-4 flex flex-col gap-4" style={{ backgroundImage: 'radial-gradient(circle at center, #111b21 0%, #0b141a 100%)' }}>
              <motion.div className="self-center bg-[#182229] text-[#8696a0] text-xs px-3 py-1 rounded-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>Today</motion.div>
              <motion.div className="bg-[#005c4b] text-[#e9edef] p-3 rounded-2xl rounded-tr-none max-w-[85%] self-end shadow-sm" initial={{ opacity: 0, scale: 0.8, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ delay: 1.5 }}>
                <p>Hi Alex, your membership expires in 3 days. Please renew to continue access! 💪</p>
                <div className="text-[10px] text-right mt-1 text-[#8696a0]">10:42 AM</div>
              </motion.div>
              <motion.div className="bg-[#202c33] text-[#e9edef] p-3 rounded-2xl rounded-tl-none max-w-[85%] self-start shadow-sm mt-4" initial={{ opacity: 0, scale: 0.8, x: -20 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ delay: 2.5 }}>
                <p>Thanks! Just renewed via the app.</p>
                <div className="text-[10px] mt-1 text-[#8696a0]">10:45 AM</div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// SCENE 8
function Scene8TrainerLogin() {
  useSceneNarration("Trainers get their own secure login with a personalized dashboard.");
  
  const emailText = "trainer@fitzone.com";
  const [emailChars, setEmailChars] = useState(0);

  useEffect(() => {
    let t1 = setTimeout(() => {
      const iv = setInterval(() => setEmailChars(c => Math.min(c + 1, emailText.length)), 50);
      setTimeout(() => clearInterval(iv), emailText.length * 50);
    }, 800);
    return () => clearTimeout(t1);
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 z-10 flex w-full h-full items-center justify-center bg-[#0D0F14]/50"
      {...wipeDown}
      transition={transProps}
    >
      <div className="w-[30vw] min-w-[400px] bg-[#161922] p-10 rounded-3xl border border-[#1E2433] shadow-2xl">
        <motion.div className="flex flex-col items-center mb-10" {...slideUp}>
          <div className="w-16 h-16 bg-[#2ECC71]/20 rounded-full flex items-center justify-center mb-4 text-[#2ECC71] text-2xl">💪</div>
          <h2 className="text-3xl font-bold text-[#F0F4FF]">Trainer Portal</h2>
        </motion.div>
        <div className="space-y-6">
          <motion.div className="space-y-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div className="w-full bg-[#0D0F14] border border-[#1E2433] rounded-xl py-4 px-4 text-[#F0F4FF] flex items-center h-[58px]">
              {emailText.substring(0, emailChars)}
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="ml-1 inline-block w-0.5 h-5 bg-[#2ECC71]" />
            </div>
          </motion.div>
          <motion.div className="space-y-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <div className="w-full bg-[#0D0F14] border border-[#1E2433] rounded-xl py-4 px-4 text-[#F0F4FF] flex items-center h-[58px]">
              ••••••••
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="pt-4">
            <div className="w-full bg-[#2ECC71] text-[#0D0F14] font-bold text-center py-4 rounded-xl text-lg">Sign In</div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// SCENE 9
function Scene9TrainerDashboard() {
  useSceneNarration("Each trainer sees their assigned clients and active diet plans at a glance.");
  return (
    <motion.div 
      className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center p-12"
      {...wipeRight}
      transition={transProps}
    >
      <div className="w-[80vw]">
        <motion.h2 className="text-4xl font-bold mb-10 text-[#F0F4FF]" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>Trainer Dashboard</motion.h2>
        
        <div className="grid grid-cols-2 gap-8 mb-10">
          <motion.div className="bg-[#161922] border border-[#1E2433] p-8 rounded-2xl flex items-center justify-between shadow-lg" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
            <div><h3 className="text-[#8A94A6] text-xl mb-2">My Clients</h3><p className="text-6xl font-bold text-[#F0F4FF]">28</p></div>
            <div className="w-20 h-20 rounded-full bg-[#2ECC71]/20 flex items-center justify-center text-[#2ECC71] text-3xl">👥</div>
          </motion.div>
          <motion.div className="bg-[#161922] border border-[#1E2433] p-8 rounded-2xl flex items-center justify-between shadow-lg" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>
            <div><h3 className="text-[#8A94A6] text-xl mb-2">Active Plans</h3><p className="text-6xl font-bold text-[#F0F4FF]">14</p></div>
            <div className="w-20 h-20 rounded-full bg-[#2ECC71]/20 flex items-center justify-center text-[#2ECC71] text-3xl">📋</div>
          </motion.div>
        </div>

        <motion.h3 className="text-2xl font-bold mb-6 text-[#F0F4FF]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>Client Progress</motion.h3>
        <div className="grid grid-cols-3 gap-6">
          {[
            { name: "Sarah", weight: "65kg", target: "60kg", goal: "Weight Loss" },
            { name: "John", weight: "82kg", target: "85kg", goal: "Muscle Gain" },
            { name: "Emma", weight: "58kg", target: "55kg", goal: "Tone Up" }
          ].map((c, i) => (
            <motion.div key={c.name} className="bg-[#161922] border border-[#1E2433] p-6 rounded-2xl shadow-lg" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 + i * 0.15 }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#0D0F14] border border-[#1E2433] flex items-center justify-center font-bold text-[#2ECC71]">{c.name[0]}</div>
                <div>
                  <h4 className="font-bold text-lg text-[#F0F4FF]">{c.name}</h4>
                  <span className="text-xs bg-[#2ECC71]/20 text-[#2ECC71] px-2 py-1 rounded-full mt-1 inline-block">{c.goal}</span>
                </div>
              </div>
              <div className="space-y-2 mt-4 text-sm">
                <div className="flex justify-between border-b border-[#1E2433] pb-2"><span className="text-[#8A94A6]">Weight</span><span className="text-[#F0F4FF] font-medium">{c.weight}</span></div>
                <div className="flex justify-between pt-1"><span className="text-[#8A94A6]">Target</span><span className="text-[#2ECC71] font-bold">{c.target}</span></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// SCENE 10
function Scene10MyClientsPage() {
  useSceneNarration("The clients view gives trainers full health profiles — weight, target, height, goal, and trainer notes.");
  return (
    <motion.div 
      className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center p-12"
      {...wipeUp}
      transition={transProps}
    >
      <div className="w-[80vw]">
        <motion.h2 className="text-4xl font-bold mb-10 text-[#F0F4FF]" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>My Clients</motion.h2>
        <div className="grid grid-cols-3 gap-8">
          {[
            { name: "Sarah Connor", phone: "+1 234 567", weight: "65kg", target: "60kg", height: "165cm", goal: "Weight Loss", notes: "Knee sensitive, avoid heavy squats" },
            { name: "John Smith", phone: "+1 987 654", weight: "82kg", target: "85kg", height: "180cm", goal: "Muscle Gain", notes: "Focus on upper body strength" },
            { name: "Emma Davis", phone: "+1 456 789", weight: "58kg", target: "55kg", height: "160cm", goal: "Tone Up", notes: "Excellent progress on core" }
          ].map((c, i) => (
            <motion.div key={c.name} className="bg-[#161922] border border-[#1E2433] rounded-3xl p-8 shadow-xl" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.15 }}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#0D0F14] border border-[#1E2433] flex items-center justify-center font-bold text-2xl text-[#2ECC71]">{c.name[0]}</div>
                <div>
                  <h4 className="font-bold text-xl text-[#F0F4FF]">{c.name}</h4>
                  <p className="text-[#8A94A6] text-sm">{c.phone}</p>
                </div>
                <span className="ml-auto bg-[#2ECC71]/20 text-[#2ECC71] text-xs px-3 py-1 rounded-full">Active</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="bg-[#0D0F14] p-3 rounded-xl border border-[#1E2433]"><p className="text-[#8A94A6] mb-1 text-xs">Weight</p><p className="font-bold text-[#F0F4FF]">{c.weight}</p></div>
                <div className="bg-[#0D0F14] p-3 rounded-xl border border-[#1E2433]"><p className="text-[#8A94A6] mb-1 text-xs">Target</p><p className="font-bold text-[#2ECC71]">{c.target}</p></div>
                <div className="bg-[#0D0F14] p-3 rounded-xl border border-[#1E2433]"><p className="text-[#8A94A6] mb-1 text-xs">Height</p><p className="font-bold text-[#F0F4FF]">{c.height}</p></div>
                <div className="bg-[#0D0F14] p-3 rounded-xl border border-[#1E2433]"><p className="text-[#8A94A6] mb-1 text-xs">Goal</p><p className="font-bold text-[#F0F4FF]">{c.goal}</p></div>
              </div>
              <div className="bg-[#2ECC71]/10 border border-[#2ECC71]/30 p-4 rounded-xl">
                <p className="text-xs text-[#2ECC71] font-bold mb-1">Trainer Notes</p>
                <p className="text-sm text-[#F0F4FF]">{c.notes}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// SCENE 11
function Scene11DietPlansPage() {
  useSceneNarration("Trainers build personalized daily meal plans for every client. Pick the client, pick the day, and fill in each meal slot.");
  return (
    <motion.div 
      className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center p-12"
      {...diamondReveal}
      transition={transProps}
    >
      <div className="w-[80vw] h-[85vh] flex flex-col">
        <motion.div className="flex gap-4 mb-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          {['Sarah', 'John', 'Emma'].map((c, i) => (
            <div key={c} className={`px-6 py-3 rounded-xl font-bold ${i===0 ? 'bg-[#2ECC71] text-[#0D0F14]' : 'bg-[#161922] border border-[#1E2433] text-[#8A94A6]'}`}>{c}</div>
          ))}
        </motion.div>
        <motion.div className="flex gap-2 mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
            <div key={d} className={`px-4 py-2 rounded-lg text-sm font-medium ${i===2 ? 'bg-[#F0F4FF] text-[#0D0F14]' : 'bg-[#161922] border border-[#1E2433] text-[#8A94A6]'}`}>{d}</div>
          ))}
        </motion.div>
        
        <div className="flex-1 flex flex-col gap-8">
          <div className="flex gap-8">
            <div className="flex-1 space-y-4">
              {[
                { meal: "Breakfast", time: "7–8 AM", food: "Oats, banana, black coffee" },
                { meal: "Mid-morning", time: "10–11 AM", food: "Greek yogurt, almonds" },
                { meal: "Lunch", time: "1–2 PM", food: "Grilled chicken, brown rice, salad" },
                { meal: "Evening", time: "4–5 PM", food: "Protein shake, fruits" },
                { meal: "Dinner", time: "7–8 PM", food: "Dal, roti, vegetables" }
              ].map((m, i) => (
                <motion.div key={m.meal} className="bg-[#161922] border border-[#1E2433] p-4 rounded-2xl flex gap-6 items-center shadow-lg" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.2, type: "spring" }}>
                  <div className="w-24 text-right">
                    <p className="font-bold text-[#F0F4FF]">{m.meal}</p>
                    <p className="text-xs text-[#8A94A6]">{m.time}</p>
                  </div>
                  <div className="w-1 h-12 bg-[#2ECC71] rounded-full opacity-50"></div>
                  <div className="flex-1 bg-[#0D0F14] border border-[#1E2433] p-3 rounded-xl text-[#F0F4FF]">{m.food}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div className="w-full bg-[#161922] border border-[#1E2433] rounded-3xl p-8 flex flex-col shadow-xl" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 }}>
            <h3 className="text-xl font-bold mb-6 text-[#F0F4FF]">Daily Calorie Breakdown</h3>
            <div className="flex h-32 items-end gap-4 px-4 pb-4 border-b border-[#1E2433] w-full">
              {[
                { label: "Breakfast", cal: 350, h: "35%" },
                { label: "Snack", cal: 150, h: "15%" },
                { label: "Lunch", cal: 520, h: "55%" },
                { label: "Snack", cal: 130, h: "13%" },
                { label: "Dinner", cal: 450, h: "45%" }
              ].map((b, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <span className="text-xs text-[#F0F4FF] font-bold mb-2 absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity">{b.cal}</span>
                  <motion.div className="w-full bg-[#2ECC71] rounded-t-md opacity-80 hover:opacity-100 transition-opacity" initial={{ height: 0 }} animate={{ height: b.h }} transition={{ delay: 2.5 + i * 0.1, duration: 0.8 }} />
                  <span className="text-xs text-[#8A94A6] mt-4 absolute -bottom-8 whitespace-nowrap">{b.label} <span className="text-[#F0F4FF] font-bold block text-center">{b.cal}</span></span>
                </div>
              ))}
            </div>
            <div className="mt-12 text-right">
              <p className="text-[#8A94A6] text-sm">Total Daily Target</p>
              <p className="text-3xl font-bold text-[#2ECC71] mt-1">1600 <span className="text-lg text-[#8A94A6]">kcal</span></p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// SCENE 12
function Scene12Outro() {
  useSceneNarration("GymLeads — grow your gym, empower your trainers, delight your members.");
  return (
    <motion.div 
      className="absolute inset-0 z-10 flex flex-col items-center justify-center w-full h-full bg-[#0D0F14]"
      {...circleReveal}
      transition={transProps}
    >
      <motion.div 
        className="w-40 h-40 bg-[#161922] rounded-full border border-[#1E2433] flex items-center justify-center mb-8 relative shadow-[0_0_80px_rgba(46,204,113,0.2)]"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 1, type: "spring" }}
      >
        <motion.div className="absolute inset-0 rounded-full border-2 border-[#2ECC71]" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} />
        <svg className="w-20 h-20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 12H20M4 12V8M4 12V16M20 12V8M20 12V16M2 8H6M18 8H22M2 16H6M18 16H22M6 6V18M18 6V18" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
      <motion.h1 
        className="text-8xl font-bold tracking-tight mb-6 text-[#F0F4FF]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 1 }}
      >
        Gym<span className="text-[#2ECC71]">Leads</span>
      </motion.h1>
      <motion.p 
        className="text-3xl text-[#8A94A6] tracking-wide"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        Grow. Train. Succeed.
      </motion.p>
    </motion.div>
  );
}
