import { useState } from "react";
import {
  ArrowRight,
  AudioLines,
  BarChart3,
  BookOpen,
  CalendarClock,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  Headphones,
  Home,
  Languages,
  LayoutGrid,
  MessageCircle,
  Mic2,
  PenLine,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";

type ConceptId = 1 | 2 | 3 | 4 | 5 | 6;

const concepts: Array<{ id: ConceptId; name: string; tone: string }> = [
  { id: 1, name: "Focus Garden", tone: "Calm · supportive" },
  { id: 2, name: "Career Desk", tone: "Focused · professional" },
  { id: 3, name: "Bright Steps", tone: "Friendly · energetic" },
  { id: 4, name: "Quiet Editorial", tone: "Clear · thoughtful" },
  { id: 5, name: "Coach Conversation", tone: "Human · encouraging" },
  { id: 6, name: "Skill Compass", tone: "Structured · analytical" },
];

function NorthstarMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="concept-brand">
      <span>N</span>
      {!compact && <strong>Northstar</strong>}
    </div>
  );
}

function ProgressLine({ value, label }: { value: number; label: string }) {
  return (
    <div className="concept-progress-line">
      <div><span>{label}</span><strong>{value}%</strong></div>
      <div className="concept-track"><span style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function FocusGarden() {
  return (
    <div className="mockup concept-garden">
      <aside className="garden-sidebar">
        <NorthstarMark />
        <nav aria-label="Focus Garden navigation">
          <button className="active"><Home size={18} /> Today</button>
          <button><BookOpen size={18} /> Learn</button>
          <button><Mic2 size={18} /> Speak</button>
          <button><CalendarClock size={18} /> Review <small>2</small></button>
          <button><BarChart3 size={18} /> Growth</button>
        </nav>
        <div className="garden-level"><span>B1</span><div><strong>Career path</strong><small>7 of 24 lessons</small></div></div>
      </aside>
      <main className="garden-content">
        <header><div><small>SATURDAY, 29 AUGUST</small><h2>Good evening, Narin</h2></div><span><Clock3 size={15} /> 22 min today</span></header>
        <section className="garden-focus">
          <div className="garden-focus-copy">
            <span className="concept-pill">Next up · 18 min</span>
            <h3>Tell me about yourself</h3>
            <p>Build a clear introduction, then answer one follow-up without notes.</p>
            <div className="concept-can-do"><Target size={17} /> I can connect my experience to the role I want.</div>
            <button className="garden-primary">Continue lesson <ArrowRight size={17} /></button>
          </div>
          <img src="/assets/interview-practice.png" alt="A professional interview practice scene" />
        </section>
        <section className="garden-bottom">
          <div className="garden-reviews">
            <div className="concept-section-title"><div><small>RETRIEVAL PRACTICE</small><h3>2 reviews are ready</h3></div><button>Review now <ChevronRight size={16} /></button></div>
            <div className="garden-review-row"><span className="dot green" /><div><strong>Introduce your current role</strong><small>New interviewer, no notes</small></div><small>Due now</small></div>
            <div className="garden-review-row"><span className="dot blue" /><div><strong>Spot the measurable result</strong><small>Different speaker and project</small></div><small>Due now</small></div>
          </div>
          <div className="garden-balance"><Sparkles size={21} /><small>RIGHT LEVEL</small><h3>Challenge feels balanced</h3><p>Key phrases stay available for this lesson.</p></div>
        </section>
      </main>
    </div>
  );
}

function CareerDesk() {
  return (
    <div className="mockup concept-desk">
      <header className="desk-header">
        <NorthstarMark />
        <nav aria-label="Career Desk navigation"><button className="active">Workspace</button><button>Practice</button><button>Review</button><button>Evidence</button></nav>
        <div className="desk-profile"><span>B1 Career</span><UserRound size={20} /></div>
      </header>
      <main className="desk-main">
        <div className="desk-title"><div><small>TODAY’S WORKSPACE</small><h2>Interview readiness</h2></div><div><Clock3 size={15} /> 22 active min</div></div>
        <div className="desk-grid">
          <section className="desk-queue">
            <div className="desk-section-head"><h3>Task queue</h3><span>3 items</span></div>
            <button className="desk-task active"><span>01</span><div><strong>Professional introduction</strong><small>Speaking · 18 min</small></div><ChevronRight size={17} /></button>
            <button className="desk-task"><span>02</span><div><strong>Measurable results</strong><small>Review · 4 min</small></div><ChevronRight size={17} /></button>
            <button className="desk-task"><span>03</span><div><strong>Career goal message</strong><small>Writing · 6 min</small></div><ChevronRight size={17} /></button>
            <div className="desk-due"><CalendarClock size={17} /><div><strong>Next review window</strong><small>Tomorrow at 7:30 PM</small></div></div>
          </section>
          <section className="desk-brief">
            <img src="/assets/interview-practice.png" alt="Job interview practice" />
            <div className="desk-brief-body">
              <span className="desk-label">CURRENT MISSION</span>
              <h3>Give a 60–90 second introduction</h3>
              <p>Present role → specific evidence → target fit</p>
              <div className="desk-criteria"><span><Check size={14} /> Relevant</span><span><Check size={14} /> Evidence-based</span><span><Check size={14} /> Intelligible</span></div>
              <button>Open practice room <ArrowRight size={17} /></button>
            </div>
          </section>
          <aside className="desk-evidence">
            <div className="desk-section-head"><h3>Readiness</h3><span>Live estimate</span></div>
            <div className="desk-score"><strong>74</strong><span>of 100</span></div>
            <ProgressLine label="Relevance" value={82} />
            <ProgressLine label="Evidence" value={66} />
            <ProgressLine label="Delivery" value={73} />
            <div className="desk-coach"><MessageCircle size={18} /><p><strong>Coach note</strong>Add one real result before removing your outline.</p></div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function BrightSteps() {
  const steps = [
    { icon: Headphones, label: "Listen", state: "done" },
    { icon: BookOpen, label: "Notice", state: "done" },
    { icon: PenLine, label: "Build", state: "active" },
    { icon: Mic2, label: "Speak", state: "next" },
    { icon: Sparkles, label: "Show it", state: "next" },
  ];
  return (
    <div className="mockup concept-bright">
      <header className="bright-header"><NorthstarMark /><nav><button>Today</button><button className="active">My path</button><button>Review</button></nav><span className="bright-level">B1 · Week 3</span></header>
      <main className="bright-main">
        <section className="bright-intro"><span className="bright-kicker">TODAY · ABOUT 20 MIN</span><h2>One strong answer,<br />built step by step.</h2><p>Finish the structure, then make it sound like you.</p></section>
        <section className="step-path" aria-label="Lesson path">
          {steps.map(({ icon: Icon, label, state }, index) => (
            <div className={`path-step ${state}`} key={label}><span>{state === "done" ? <Check size={18} /> : <Icon size={19} />}</span><div><small>STEP {index + 1}</small><strong>{label}</strong></div>{index < steps.length - 1 && <i />}</div>
          ))}
        </section>
        <section className="bright-work">
          <div className="bright-prompt"><span className="bright-number">03</span><div><small>BUILD YOUR NOTES</small><h3>What makes you valuable now?</h3><p>Write one responsibility and one result you can prove.</p></div></div>
          <div className="bright-note"><PenLine size={20} /><p>I coordinate site teams and…</p><button>Continue <ArrowRight size={17} /></button></div>
        </section>
        <aside className="bright-side"><div><Sparkles size={22} /><h3>You’re building independence</h3><p>Only key phrases are visible now. They disappear after one more strong try.</p></div><div className="bright-choice"><small>CHOOSE YOUR INTERVIEWER</small><button className="active">Hiring manager</button><button>Technical lead</button></div></aside>
      </main>
    </div>
  );
}

function QuietEditorial() {
  return (
    <div className="mockup concept-editorial">
      <header className="editorial-header"><NorthstarMark /><span>CAREER ENGLISH / B1</span><nav><button className="active">Today</button><button>Practice</button><button>Archive</button></nav></header>
      <main className="editorial-main">
        <section className="editorial-lead">
          <div className="editorial-number"><span>LESSON</span><strong>07</strong></div>
          <div className="editorial-copy"><small>THE INTERVIEW ISSUE · 18 MIN</small><h2>Tell your story<br />with evidence.</h2><p>A useful introduction is not your whole biography. It is a clear bridge from what you do now to what you want to do next.</p><button>Begin the lesson <ArrowRight size={18} /></button></div>
          <figure><img src="/assets/interview-practice.png" alt="Professional interview conversation" /><figcaption>Today’s scene · Project engineer interview</figcaption></figure>
        </section>
        <section className="editorial-evidence">
          <div><span>01</span><h3>Current value</h3><p>What responsibility defines your work now?</p></div>
          <div><span>02</span><h3>Credible proof</h3><p>Which real result makes that value believable?</p></div>
          <div><span>03</span><h3>Future fit</h3><p>Why is the next role a logical step?</p></div>
        </section>
        <footer className="editorial-foot"><span>Due for review: 2 skills</span><div><strong>82%</strong> delayed recall</div><button>View evidence <ChevronRight size={16} /></button></footer>
      </main>
    </div>
  );
}

function CoachConversation() {
  return (
    <div className="mockup concept-coach">
      <header className="coach-header"><NorthstarMark /><div><span className="coach-online" /> Maya, your English coach</div><button><Languages size={17} /> EN / ไทย</button></header>
      <main className="coach-main">
        <section className="coach-chat">
          <div className="chat-date">TODAY · INTERVIEW PRACTICE</div>
          <div className="coach-message"><span className="coach-face">M</span><div><p>Let’s make your introduction useful for a project-engineer interview.</p><small>Start with what you do now. One sentence is enough.</small></div></div>
          <div className="learner-message"><p>I currently work as a site engineer. I coordinate subcontractors and check progress against drawings.</p><small>You · just now</small></div>
          <div className="coach-message"><span className="coach-face">M</span><div><p>Clear start. Now choose the evidence you want to add.</p><div className="coach-options"><button>Reduced rework</button><button>Improved coordination</button><button>Use another example</button></div></div></div>
          <div className="coach-composer"><button aria-label="Start speaking"><Mic2 size={20} /></button><span>Answer with your voice or type here…</span><button aria-label="Send answer"><ArrowRight size={19} /></button></div>
        </section>
        <aside className="coach-plan">
          <div className="coach-image"><img src="/assets/interview-practice.png" alt="Interview practice scene" /><span>Live scenario</span></div>
          <div className="plan-body"><small>TODAY’S PLAN · 18 MIN</small><h2>Your professional introduction</h2><div className="plan-item done"><Check size={15} /><div><strong>Current value</strong><small>Clear and relevant</small></div></div><div className="plan-item active"><span>2</span><div><strong>Specific evidence</strong><small>Working on this now</small></div></div><div className="plan-item"><span>3</span><div><strong>Target fit</strong><small>Up next</small></div></div><div className="plan-item"><span>4</span><div><strong>Speak without notes</strong><small>Final check</small></div></div></div>
          <footer><Sparkles size={17} /><span>Feedback: maximum 2 points</span></footer>
        </aside>
      </main>
    </div>
  );
}

function SkillCompass() {
  const skills = [{ name: "Listening", score: 72, icon: Headphones }, { name: "Speaking", score: 64, icon: Mic2 }, { name: "Reading", score: 81, icon: BookOpen }, { name: "Writing", score: 68, icon: PenLine }];
  return (
    <div className="mockup concept-compass">
      <aside className="compass-sidebar"><NorthstarMark compact /><nav><button className="active" aria-label="Dashboard"><LayoutGrid size={19} /></button><button aria-label="Learning path"><Compass size={19} /></button><button aria-label="Practice"><AudioLines size={19} /></button><button aria-label="Progress"><BarChart3 size={19} /></button></nav><button aria-label="Profile"><UserRound size={19} /></button></aside>
      <main className="compass-main">
        <header><div><small>B1 CAREER PATH</small><h2>Your learning compass</h2></div><div><Clock3 size={15} /> 22 min today</div></header>
        <section className="compass-grid">
          <div className="compass-map">
            <div className="compass-title"><div><small>SKILL BALANCE</small><h3>Ready to strengthen speaking</h3></div><span>Weekly</span></div>
            <div className="skill-quadrants">
              {skills.map(({ name, score, icon: Icon }) => <div className={`quadrant ${name.toLowerCase()}`} key={name}><Icon size={19} /><strong>{score}</strong><span>{name}</span></div>)}
              <div className="compass-center"><Compass size={24} /><span>B1</span></div>
            </div>
            <p>Speaking is the next best investment because your reading evidence is already strong.</p>
          </div>
          <div className="compass-mission">
            <div className="mission-image"><img src="/assets/interview-practice.png" alt="Interview speaking mission" /><span><Mic2 size={15} /> Speaking mission</span></div>
            <div className="mission-body"><small>NEXT BEST ACTION · 18 MIN</small><h3>Professional introduction</h3><p>Use one real result, then handle a follow-up without notes.</p><div className="mission-meta"><span><Target size={15} /> Transfer check</span><span><Clock3 size={15} /> 18 min</span></div><button>Start mission <ArrowRight size={17} /></button></div>
          </div>
          <div className="compass-review"><div><CalendarClock size={20} /><span><small>DUE NOW</small><strong>2 retrieval checks</strong></span></div><button>Open queue <ChevronRight size={16} /></button></div>
          <div className="compass-evidence"><div className="concept-section-title"><div><small>RECENT EVIDENCE</small><h3>Independent performance</h3></div><span>Last 14 days</span></div><div className="evidence-bars"><ProgressLine label="With support" value={86} /><ProgressLine label="Without notes" value={71} /><ProgressLine label="Changed context" value={62} /></div></div>
        </section>
      </main>
    </div>
  );
}

function ConceptPreview({ concept }: { concept: ConceptId }) {
  if (concept === 1) return <FocusGarden />;
  if (concept === 2) return <CareerDesk />;
  if (concept === 3) return <BrightSteps />;
  if (concept === 4) return <QuietEditorial />;
  if (concept === 5) return <CoachConversation />;
  return <SkillCompass />;
}

export function ConceptLab() {
  const initial = Number(new URLSearchParams(window.location.search).get("concept"));
  const [selected, setSelected] = useState<ConceptId>(initial >= 1 && initial <= 6 ? initial as ConceptId : 1);
  const active = concepts.find((concept) => concept.id === selected)!;

  const selectConcept = (id: ConceptId) => {
    setSelected(id);
    window.history.replaceState({}, "", `?mockups=1&concept=${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="concept-lab">
      <header className="lab-header">
        <div><span className="lab-kicker">NORTHSTAR · DESIGN DIRECTIONS</span><h1>Choose the feeling of your learning space</h1></div>
        <a href="/">Open current prototype <ArrowRight size={16} /></a>
      </header>
      <nav className="concept-selector" aria-label="Choose a design concept">
        {concepts.map((concept) => (
          <button className={selected === concept.id ? "active" : ""} type="button" key={concept.id} onClick={() => selectConcept(concept.id)} aria-pressed={selected === concept.id}>
            <span>{String(concept.id).padStart(2, "0")}</span><div><strong>{concept.name}</strong><small>{concept.tone}</small></div>
          </button>
        ))}
      </nav>
      <div className="lab-meta"><div><span>CONCEPT {String(selected).padStart(2, "0")}</span><h2>{active.name}</h2></div><p>{active.tone}</p></div>
      <ConceptPreview concept={selected} />
    </div>
  );
}
