import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Headphones,
  Home,
  Languages,
  Lightbulb,
  ListChecks,
  MessageCircle,
  Mic2,
  MoreHorizontal,
  Pause,
  PenLine,
  Play,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Square,
  Target,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { decideDifficulty } from "../core/difficulty-controller.js";
import { selectFeedback } from "../core/feedback-policy.js";
import { scheduleReview, type ReviewGrade } from "../core/review-scheduler.js";
import { navigationItems, reviewItems, skillProgress, weekActivity } from "./mock-data.js";
import type { ViewId } from "./types.js";

const navIcons: Record<ViewId, LucideIcon> = {
  today: Home,
  lesson: BookOpen,
  speak: Mic2,
  write: PenLine,
  review: ListChecks,
  progress: BarChart3,
};

const viewMeta: Record<ViewId, { eyebrow: string; title: string }> = {
  today: { eyebrow: "SATURDAY, 29 AUGUST", title: "Good evening, Narin" },
  lesson: { eyebrow: "B1 · CAREER STORY · LESSON 1", title: "Tell me about yourself" },
  speak: { eyebrow: "SPEAKING PRACTICE", title: "Interview room" },
  write: { eyebrow: "WRITING COACH", title: "Build your career story" },
  review: { eyebrow: "SMART REVIEW", title: "Make it stick" },
  progress: { eyebrow: "YOUR PROGRESS", title: "Evidence of growth" },
};

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button className="icon-button" type="button" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

function BrandMark() {
  return (
    <div className="brand" aria-label="Northstar English">
      <span className="brand-mark" aria-hidden="true">
        N
      </span>
      <span>
        <strong>Northstar</strong>
        <small>Career English · B1</small>
      </span>
    </div>
  );
}

function AppShell({
  activeView,
  onNavigate,
  children,
}: {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  children: React.ReactNode;
}) {
  const meta = viewMeta[activeView];

  return (
    <div className="app-shell theme-editorial" data-design="quiet-editorial">
      <aside className="sidebar">
        <BrandMark />
        <nav className="primary-nav" aria-label="Main navigation">
          {navigationItems.map((item) => {
            const Icon = navIcons[item.id];
            return (
              <button
                className={activeView === item.id ? "nav-item active" : "nav-item"}
                type="button"
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-current={activeView === item.id ? "page" : undefined}
              >
                <Icon size={19} aria-hidden="true" />
                <span>{item.label}</span>
                {item.id === "review" && <span className="nav-count">2</span>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <div className="level-block">
            <span className="level-badge">B1</span>
            <span>
              <strong>Career path</strong>
              <small>7 of 24 lessons</small>
            </span>
          </div>
          <button className="nav-item" type="button">
            <Settings size={19} aria-hidden="true" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      <div className="main-frame">
        <header className="topbar">
          <div className="mobile-brand">
            <BrandMark />
          </div>
          <div className="page-heading">
            <span className="eyebrow">{meta.eyebrow}</span>
            <h1>{meta.title}</h1>
          </div>
          <div className="top-actions">
            <div className="study-time">
              <Clock3 size={16} aria-hidden="true" />
              <span>22 min today</span>
            </div>
            <IconButton label="Notifications">
              <Bell size={19} aria-hidden="true" />
              <span className="notification-dot" />
            </IconButton>
            <IconButton label="Profile">
              <CircleUserRound size={21} aria-hidden="true" />
            </IconButton>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigationItems.map((item) => {
          const Icon = navIcons[item.id];
          return (
            <button
              className={activeView === item.id ? "mobile-nav-item active" : "mobile-nav-item"}
              type="button"
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={activeView === item.id ? "page" : undefined}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{item.mobileLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function TodayView({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const difficulty = decideDifficulty({
    firstPassAccuracy: 0.82,
    scaffoldLevel: 2,
    consecutiveSuccesses: 1,
  });
  const supportMessage =
    difficulty === "maintain" ? "Key phrases stay available for this lesson" : "Support adjusted";

  return (
    <div className="today-view">
      <section className="focus-band" aria-labelledby="focus-title">
        <div className="focus-copy">
          <div className="tag-row">
            <span className="status-tag green">Next up</span>
            <span className="soft-label">18 min · Speaking focus</span>
          </div>
          <h2 id="focus-title">Tell me about yourself</h2>
          <p>
            Shape a clear 60–90 second introduction, then handle one follow-up without notes.
          </p>
          <div className="can-do-line">
            <Target size={18} aria-hidden="true" />
            <span>I can connect my experience to the role I want.</span>
          </div>
          <div className="focus-actions">
            <button className="primary-button" type="button" onClick={() => onNavigate("lesson")}>
              Continue lesson <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button className="text-button" type="button" onClick={() => onNavigate("speak")}>
              Go to speaking
            </button>
          </div>
        </div>
        <div className="focus-visual">
          <img
            src="/assets/interview-practice.png"
            alt="A learner practising a job interview with a supportive interviewer"
          />
          <div className="visual-caption">
            <BriefcaseBusiness size={17} aria-hidden="true" />
            <span>Project engineer interview</span>
          </div>
        </div>
      </section>

      <section className="dashboard-grid" aria-label="Today's learning overview">
        <div className="dashboard-panel review-summary">
          <div className="section-heading">
            <div>
              <span className="eyebrow">RETRIEVAL PRACTICE</span>
              <h2>2 reviews are ready</h2>
            </div>
            <button className="compact-button" type="button" onClick={() => onNavigate("review")}>
              Review now <ChevronRight size={17} aria-hidden="true" />
            </button>
          </div>
          <div className="review-preview-list">
            {reviewItems.slice(0, 2).map((item) => (
              <div className="review-preview" key={item.id}>
                <span className={`skill-dot ${item.accent}`} aria-hidden="true" />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.context}</span>
                </div>
                <span className="due-text">{item.dueLabel}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel support-summary">
          <div className="support-icon" aria-hidden="true">
            <Lightbulb size={21} />
          </div>
          <span className="eyebrow">RIGHT LEVEL</span>
          <h2>Challenge feels balanced</h2>
          <p>{supportMessage}</p>
          <div className="difficulty-scale" aria-label="Difficulty is balanced">
            <span />
            <span className="active" />
            <span />
          </div>
        </div>
      </section>

      <section className="skill-snapshot" aria-labelledby="skill-snapshot-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SKILL SNAPSHOT</span>
            <h2 id="skill-snapshot-title">Your English this week</h2>
          </div>
          <button className="text-button" type="button" onClick={() => onNavigate("progress")}>
            See progress
          </button>
        </div>
        <div className="skill-row">
          {skillProgress.map((skill) => (
            <div className="skill-meter" key={skill.name}>
              <div className="skill-meter-head">
                <span>{skill.name}</span>
                <strong>{skill.value}%</strong>
              </div>
              <div className="meter-track" aria-label={`${skill.name} ${skill.value}%`}>
                <span style={{ width: `${skill.value}%` }} />
              </div>
              <small>{skill.detail}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LessonView({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showThai, setShowThai] = useState(false);
  const options = ["Present role", "Specific evidence", "Target role"];
  const isCorrect = order.join("|") === options.join("|");

  const choosePart = (part: string) => {
    if (order.includes(part)) return;
    setOrder([...order, part]);
    setChecked(false);
  };

  return (
    <div className="lesson-layout">
      <aside className="lesson-rail" aria-label="Lesson activities">
        <div className="lesson-progress-head">
          <strong>Lesson progress</strong>
          <span>2 of 7</span>
        </div>
        <div className="lesson-progress-track"><span /></div>
        <ol className="activity-list">
          <li className="done"><Check size={15} /> Warm up</li>
          <li className="active"><Headphones size={16} /> Listen & order</li>
          <li><BookOpen size={16} /> Read & compare</li>
          <li><PenLine size={16} /> Build notes</li>
          <li><Mic2 size={16} /> First answer</li>
          <li><MessageCircle size={16} /> Follow-up</li>
          <li><ShieldCheck size={16} /> Exit check</li>
        </ol>
        <div className="rail-note">
          <Sparkles size={17} aria-hidden="true" />
          <span>Support fades after two strong attempts.</span>
        </div>
      </aside>

      <section className="lesson-stage" aria-labelledby="listen-title">
        <div className="activity-heading">
          <div className="activity-number">02</div>
          <div>
            <span className="eyebrow">LISTENING · 3 MIN</span>
            <h2 id="listen-title">Find the shape of a strong answer</h2>
          </div>
        </div>
        <p className="activity-instruction">
          Listen, then choose the three parts in the order you hear them.
        </p>
        {showThai && (
          <p className="thai-support">ฟังแล้วเลือกสามส่วนตามลำดับที่ได้ยิน</p>
        )}

        <div className="audio-player">
          <button
            className="audio-control"
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
          </button>
          <div className={isPlaying ? "audio-wave playing" : "audio-wave"} aria-hidden="true">
            {Array.from({ length: 31 }, (_, index) => (
              <span key={index} style={{ height: `${10 + ((index * 13) % 24)}px` }} />
            ))}
          </div>
          <span className="audio-time">0:18 / 0:34</span>
          <IconButton label="Audio options">
            <MoreHorizontal size={19} />
          </IconButton>
        </div>

        <div className="support-bar" aria-label="Learning supports">
          <span>Need support?</span>
          <button
            type="button"
            className={showTranscript ? "support-toggle active" : "support-toggle"}
            onClick={() => setShowTranscript(!showTranscript)}
          >
            <BookOpen size={16} /> Transcript
          </button>
          <button
            type="button"
            className={showThai ? "support-toggle active" : "support-toggle"}
            onClick={() => setShowThai(!showThai)}
          >
            <Languages size={16} /> ภาษาไทย
          </button>
          <button className="support-toggle" type="button">
            <Volume2 size={16} /> 0.8×
          </button>
        </div>

        {showTranscript && (
          <div className="transcript-panel">
            <span className="eyebrow">TRANSCRIPT</span>
            <p>
              I currently work as a site engineer. I coordinate site teams and recently reduced
              drawing-related rework. I’m now looking for a role with more responsibility for
              project delivery.
            </p>
          </div>
        )}

        <div className="ordering-task">
          <div className="answer-slots" aria-label="Your selected order">
            {[0, 1, 2].map((slot) => (
              <button
                className={order[slot] ? "answer-slot filled" : "answer-slot"}
                type="button"
                key={slot}
                onClick={() => {
                  if (order[slot]) {
                    setOrder(order.filter((_, index) => index !== slot));
                    setChecked(false);
                  }
                }}
              >
                <span>{slot + 1}</span>
                {order[slot] ?? "Choose a part"}
              </button>
            ))}
          </div>
          <div className="option-bank">
            {options.map((option) => (
              <button
                type="button"
                key={option}
                disabled={order.includes(option)}
                onClick={() => choosePart(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {checked && (
          <div className={isCorrect ? "inline-feedback success" : "inline-feedback retry"} role="status">
            {isCorrect ? <Check size={20} /> : <RotateCcw size={20} />}
            <div>
              <strong>{isCorrect ? "You found the structure" : "Listen for the evidence in the middle"}</strong>
              <span>
                {isCorrect
                  ? "Present role → evidence → target role"
                  : "The speaker describes a result before saying what comes next."}
              </span>
            </div>
          </div>
        )}

        <div className="stage-footer">
          <button className="secondary-button" type="button" onClick={() => setOrder([])}>
            Reset
          </button>
          {checked && isCorrect ? (
            <button className="primary-button" type="button" onClick={() => onNavigate("speak")}>
              Continue <ArrowRight size={18} />
            </button>
          ) : (
            <button
              className="primary-button"
              type="button"
              disabled={order.length !== 3}
              onClick={() => setChecked(true)}
            >
              Check answer
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function SpeakingView() {
  const [role, setRole] = useState("Hiring manager");
  const [stage, setStage] = useState<"ready" | "recording" | "feedback">("ready");
  const feedback = selectFeedback(
    [
      { id: "evidence", priority: "task", message: "Name one specific result after your current role." },
      { id: "chunk", priority: "target_language", message: "Try: One result I’m proud of is…" },
      { id: "article", priority: "minor_accuracy", message: "Use “a site engineer” for the job title." },
    ],
    "fluency",
  );

  return (
    <div className="speaking-view">
      <section className="role-choice" aria-label="Choose interviewer">
        <span>Interviewer</span>
        <div className="segmented-control">
          {["Hiring manager", "Technical lead", "HR interviewer"].map((item) => (
            <button
              type="button"
              key={item}
              className={role === item ? "active" : ""}
              onClick={() => setRole(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="interview-stage" aria-labelledby="interview-prompt">
        <div className="interviewer-scene">
          <img src="/assets/interview-practice.png" alt="Supportive interviewer listening in a bright office" />
          <div className="speaker-label">
            <span className="online-dot" />
            Maya · {role}
          </div>
        </div>
        <div className="speaking-console">
          <div className="prompt-block">
            <span className="eyebrow">QUESTION 1 OF 3</span>
            <h2 id="interview-prompt">“Tell me about yourself.”</h2>
            <p>Connect your current value, one piece of evidence, and your target role.</p>
          </div>

          <div className={stage === "recording" ? "recording-orb active" : "recording-orb"}>
            <div className="recording-time">{stage === "recording" ? "00:18" : "00:00"}</div>
            <span>{stage === "recording" ? "Listening…" : stage === "feedback" ? "Turn complete" : "Ready when you are"}</span>
          </div>

          {stage !== "feedback" ? (
            <button
              className={stage === "recording" ? "record-button recording" : "record-button"}
              type="button"
              onClick={() => setStage(stage === "recording" ? "feedback" : "recording")}
            >
              {stage === "recording" ? <Square size={18} /> : <Mic2 size={20} />}
              {stage === "recording" ? "Finish answer" : "Start answer"}
            </button>
          ) : (
            <button className="secondary-button" type="button" onClick={() => setStage("recording")}>
              <RotateCcw size={17} /> Try again
            </button>
          )}
          <small className="privacy-note"><ShieldCheck size={14} /> Mock recording stays on this device.</small>
        </div>
      </section>

      {stage === "feedback" && (
        <section className="coach-feedback" aria-live="polite">
          <div className="feedback-summary">
            <span className="score-mark">78</span>
            <div>
              <span className="eyebrow">COMMUNICATIVE SUCCESS</span>
              <h2>Your answer was clear and relevant</h2>
              <p>You connected your role to the interview. Add one concrete result on the next try.</p>
            </div>
          </div>
          <div className="feedback-points">
            {feedback.items.map((item, index) => (
              <div className="feedback-point" key={item.id}>
                <span>{index + 1}</span>
                <p>{item.message}</p>
              </div>
            ))}
          </div>
          <div className="feedback-footer">
            <span>Feedback arrives after the turn so your fluency is not interrupted.</span>
            <button className="primary-button" type="button" onClick={() => setStage("recording")}>
              Retry with feedback <Mic2 size={17} />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function WritingView() {
  const [text, setText] = useState(
    "I currently work as a site engineer. I coordinate subcontractors and check progress against drawings.",
  );
  const [showFeedback, setShowFeedback] = useState(false);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const checks = [
    { label: "Current value", done: wordCount >= 8 },
    { label: "Specific evidence", done: /result|reduced|improved|completed/i.test(text) },
    { label: "Target fit", done: /role|next|looking|because/i.test(text) },
  ];

  return (
    <div className="writing-layout">
      <section className="writing-editor" aria-labelledby="writing-prompt">
        <div className="activity-heading compact">
          <div className="activity-number">03</div>
          <div>
            <span className="eyebrow">INDEPENDENT DRAFT · UP TO 120 WORDS</span>
            <h2 id="writing-prompt">Write your three-part introduction</h2>
          </div>
        </div>
        <p className="activity-instruction">
          Keep your facts accurate. You will adapt this draft for a hiring manager next.
        </p>

        <div className="outline-strip" aria-label="Required answer sections">
          {checks.map((check) => (
            <div className={check.done ? "outline-item done" : "outline-item"} key={check.label}>
              <span>{check.done ? <Check size={14} /> : null}</span>
              {check.label}
            </div>
          ))}
        </div>

        <label className="editor-label" htmlFor="career-draft">Your draft</label>
        <textarea
          id="career-draft"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setShowFeedback(false);
          }}
          rows={11}
        />
        <div className="editor-footer">
          <span className={wordCount > 120 ? "word-count over" : "word-count"}>{wordCount} / 120 words</span>
          <div>
            <button className="text-button" type="button">Save draft</button>
            <button
              className="primary-button"
              type="button"
              disabled={wordCount < 5 || wordCount > 120}
              onClick={() => setShowFeedback(true)}
            >
              Check my draft <Sparkles size={17} />
            </button>
          </div>
        </div>
      </section>

      <aside className="writing-coach" aria-label="Writing feedback">
        <div className="coach-head">
          <span className="coach-avatar"><PenLine size={19} /></span>
          <div>
            <strong>Writing coach</strong>
            <small>Meaning first, then accuracy</small>
          </div>
        </div>
        {!showFeedback ? (
          <div className="coach-empty">
            <div className="empty-lines" aria-hidden="true"><span /><span /><span /></div>
            <h2>Your feedback will appear here</h2>
            <p>Complete your three-part draft, then check it when you are ready.</p>
          </div>
        ) : (
          <div className="writing-feedback" aria-live="polite">
            <div className="feedback-status"><Check size={18} /> Your current role is clear</div>
            <div className="writing-tip">
              <span>1</span>
              <div>
                <strong>Add evidence</strong>
                <p>What improved because of your work? Add one specific result.</p>
              </div>
            </div>
            <div className="writing-tip">
              <span>2</span>
              <div>
                <strong>Connect to the next role</strong>
                <p>Finish with: “I’m now looking for a role where…”</p>
              </div>
            </div>
            <div className="model-snippet">
              <span className="eyebrow">KEEP YOUR OWN FACTS</span>
              <p>One result I’m proud of is <mark>[your real result]</mark>.</p>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function ReviewView() {
  const [queue, setQueue] = useState(reviewItems);
  const [completed, setCompleted] = useState(0);
  const [lastMessage, setLastMessage] = useState("");
  const current = queue[0];

  const gradeCurrent = (grade: ReviewGrade) => {
    if (!current) return;
    const result = scheduleReview(
      { stage: current.stage, lapses: 0, dueAt: new Date().toISOString() },
      grade,
      new Date("2026-08-29T12:00:00.000Z"),
    );
    const minutes = Math.round((new Date(result.dueAt).getTime() - new Date("2026-08-29T12:00:00.000Z").getTime()) / 60_000);
    const when = minutes >= 1_440 ? `${Math.round(minutes / 1_440)} day${minutes >= 2_880 ? "s" : ""}` : `${minutes} min`;
    setLastMessage(`Scheduled in ${when}`);
    setQueue(queue.slice(1));
    setCompleted(completed + 1);
  };

  return (
    <div className="review-view">
      <section className="review-header-band">
        <div>
          <span className="eyebrow">TODAY’S QUEUE</span>
          <h2>{queue.length} ready · about {queue.length * 3} minutes</h2>
          <p>Each prompt changes the situation so you recall the skill, not a memorized answer.</p>
        </div>
        <div className="queue-progress" aria-label={`${completed} reviews completed`}>
          <strong>{completed}</strong>
          <span>complete</span>
        </div>
      </section>

      {current ? (
        <section className="review-workspace" aria-labelledby="review-card-title">
          <div className="review-context">
            <span className={`skill-chip ${current.accent}`}>{current.skill}</span>
            <span>Transfer check · no notes</span>
          </div>
          <h2 id="review-card-title">{current.title}</h2>
          <p className="review-scenario">
            A new project director asks what you do now and why you are ready for more responsibility.
            Give a concise answer with one real example.
          </p>
          <div className="review-response">
            <div className="response-prompt">
              <Mic2 size={22} aria-hidden="true" />
              <div><strong>Your answer</strong><span>45–75 seconds</span></div>
            </div>
            <button className="record-circle" type="button" aria-label="Start review recording"><Mic2 size={24} /></button>
          </div>
          <div className="confidence-row">
            <span>How did recall feel?</span>
            <div className="grade-buttons">
              <button type="button" onClick={() => gradeCurrent("again")}><RotateCcw size={16} /> Again<small>10 min</small></button>
              <button type="button" onClick={() => gradeCurrent("hard")}><Target size={16} /> Hard<small>1 day</small></button>
              <button type="button" onClick={() => gradeCurrent("good")}><Check size={16} /> Good<small>7 days</small></button>
              <button type="button" onClick={() => gradeCurrent("easy")}><Sparkles size={16} /> Easy<small>14 days</small></button>
            </div>
          </div>
        </section>
      ) : (
        <section className="queue-empty" aria-live="polite">
          <span className="empty-check"><Check size={28} /></span>
          <h2>Review complete</h2>
          <p>You retrieved {completed} skills in changed situations. The next review will appear when it is due.</p>
          {lastMessage && <span className="status-tag green">{lastMessage}</span>}
        </section>
      )}

      <section className="upcoming-reviews" aria-labelledby="upcoming-title">
        <div className="section-heading">
          <div><span className="eyebrow">SPACED PRACTICE</span><h2 id="upcoming-title">Coming up</h2></div>
          <CalendarDays size={21} aria-hidden="true" />
        </div>
        <div className="timeline-row">
          {["Today", "Tomorrow", "In 3 days", "In 7 days"].map((label, index) => (
            <div className={index === 0 ? "timeline-item active" : "timeline-item"} key={label}>
              <span>{index === 0 ? 2 : index + 1}</span>
              <strong>{label}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProgressView() {
  const canDos = [
    { label: "Give a relevant professional introduction", status: "Independent", strong: true },
    { label: "Support an answer with a specific result", status: "With light support", strong: false },
    { label: "Handle an interview follow-up without notes", status: "Developing", strong: false },
    { label: "Adapt a career story for a hiring manager", status: "Independent", strong: true },
  ];

  return (
    <div className="progress-view">
      <section className="progress-overview">
        <div className="level-summary">
          <span className="large-level">B1</span>
          <div>
            <span className="eyebrow">CAREER ENGLISH</span>
            <h2>Building independent answers</h2>
            <p>7 of 24 pilot lessons · 3 competencies ready for transfer checks</p>
          </div>
        </div>
        <div className="evidence-summary">
          <div><strong>14</strong><span>independent attempts</span></div>
          <div><strong>82%</strong><span>delayed recall</span></div>
          <div><strong>3</strong><span>transfer checks</span></div>
        </div>
      </section>

      <section className="progress-grid">
        <div className="progress-panel skill-detail">
          <div className="section-heading">
            <div><span className="eyebrow">FOUR SKILLS</span><h2>Current balance</h2></div>
            <span className="status-tag neutral">Pilot estimate</span>
          </div>
          <div className="skill-detail-list">
            {skillProgress.map((skill) => (
              <div className="skill-detail-row" key={skill.name}>
                <div><strong>{skill.name}</strong><span>{skill.detail}</span></div>
                <div className="meter-track"><span style={{ width: `${skill.value}%` }} /></div>
                <strong>{skill.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="progress-panel weekly-activity">
          <div className="section-heading">
            <div><span className="eyebrow">ACTIVE TIME</span><h2>120 minutes this week</h2></div>
          </div>
          <div className="week-chart" aria-label="Study minutes by day">
            {weekActivity.map((day, index) => (
              <div className="day-column" key={`${day.day}-${index}`}>
                <div className="bar-space"><span style={{ height: `${Math.max(day.minutes * 2.2, 4)}px` }} /></div>
                <strong>{day.day}</strong>
                <small>{day.minutes || "–"}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="can-do-section" aria-labelledby="can-do-title">
        <div className="section-heading">
          <div><span className="eyebrow">CAN-DO EVIDENCE</span><h2 id="can-do-title">What you can do now</h2></div>
          <button className="compact-button" type="button">View answer bank <ChevronRight size={17} /></button>
        </div>
        <div className="can-do-list">
          {canDos.map((item) => (
            <div className="can-do-row" key={item.label}>
              <span className={item.strong ? "evidence-check strong" : "evidence-check"}>
                {item.strong ? <Check size={15} /> : null}
              </span>
              <strong>{item.label}</strong>
              <span>{item.status}</span>
              <ChevronRight size={18} aria-hidden="true" />
            </div>
          ))}
        </div>
        <p className="calibration-note"><ShieldCheck size={15} /> Level estimates remain provisional until delayed and human-rated checks are complete.</p>
      </section>
    </div>
  );
}

function ViewRouter({ activeView, onNavigate }: { activeView: ViewId; onNavigate: (view: ViewId) => void }) {
  if (activeView === "today") return <TodayView onNavigate={onNavigate} />;
  if (activeView === "lesson") return <LessonView onNavigate={onNavigate} />;
  if (activeView === "speak") return <SpeakingView />;
  if (activeView === "write") return <WritingView />;
  if (activeView === "review") return <ReviewView />;
  return <ProgressView />;
}

export function App() {
  const initialView = useMemo<ViewId>(() => {
    const view = new URLSearchParams(window.location.search).get("view");
    return navigationItems.some((item) => item.id === view) ? (view as ViewId) : "today";
  }, []);
  const [activeView, setActiveView] = useState<ViewId>(initialView);

  const navigate = (view: ViewId) => {
    setActiveView(view);
    window.history.replaceState({}, "", `?view=${view}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AppShell activeView={activeView} onNavigate={navigate}>
      <ViewRouter activeView={activeView} onNavigate={navigate} />
    </AppShell>
  );
}
