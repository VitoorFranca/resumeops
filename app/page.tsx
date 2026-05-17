import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <span className="font-bold text-lg tracking-tight">ResumeOps</span>
        <div className="flex gap-4">
          <SignedOut>
            <SignInButton>
              <button className="text-sm text-gray-600 hover:text-gray-900">Sign in</button>
            </SignInButton>
            <Link
              href="/sign-up"
              className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Get started free
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Dashboard
            </Link>
          </SignedIn>
        </div>
      </nav>

      <section className="max-w-3xl mx-auto px-8 pt-24 pb-16 text-center">
        <p className="text-sm font-medium text-teal-700 mb-4">Proven on 740+ job evaluations</p>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
          Know if a job is worth your time — before you write a word.
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto">
          Paste a job URL. Get a match score, gap analysis, and a tailored resume in minutes. Not another job board.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/sign-up"
            className="bg-gray-900 text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-gray-700"
          >
            Evaluate your first job free
          </Link>
          <Link
            href="#how-it-works"
            className="border border-gray-200 text-gray-700 px-8 py-3 rounded-lg text-base font-medium hover:bg-gray-50"
          >
            How it works
          </Link>
        </div>
      </section>

      <section id="how-it-works" className="max-w-4xl mx-auto px-8 py-20">
        <h2 className="text-2xl font-bold text-center mb-14">Three steps. No fluff.</h2>
        <div className="grid sm:grid-cols-3 gap-10">
          {[
            { step: '1', title: 'Paste a job', body: 'Drop a URL or the job description. We fetch it, parse it, and check it against your profile.' },
            { step: '2', title: 'See your match', body: 'Get a 1–5 score across CV fit, archetype alignment, comp, and culture. Hard blockers called out explicitly.' },
            { step: '3', title: 'Generate your resume', body: 'One click produces a tailored resume with ATS keywords woven in. Download as PDF.' },
          ].map(({ step, title, body }) => (
            <div key={step}>
              <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-bold text-sm flex items-center justify-center mb-4">{step}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-8 py-16">
          <h2 className="text-2xl font-bold text-center mb-12">Simple pricing</h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-sm font-medium text-gray-500 mb-2">Free</p>
              <p className="text-3xl font-bold mb-1">$0</p>
              <p className="text-sm text-gray-400 mb-6">forever</p>
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li>3 job evaluations / month</li>
                <li>Match score + gap analysis</li>
                <li>Legitimacy assessment</li>
              </ul>
              <Link href="/sign-up" className="block text-center border border-gray-200 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">
                Start free
              </Link>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 text-white">
              <p className="text-sm font-medium text-gray-400 mb-2">Pro</p>
              <p className="text-3xl font-bold mb-1">$29</p>
              <p className="text-sm text-gray-400 mb-6">/ month · 7-day trial</p>
              <ul className="text-sm text-gray-300 space-y-2 mb-6">
                <li>Unlimited evaluations</li>
                <li>Tailored resume generation</li>
                <li>ATS-optimized PDF download</li>
                <li>Application tracker</li>
              </ul>
              <Link href="/sign-up" className="block text-center bg-white text-gray-900 rounded-lg py-2 text-sm font-medium hover:bg-gray-100">
                Start 7-day trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center py-10 text-sm text-gray-400">
        Built on top of Career Ops — proven on 740+ real job evaluations.
      </footer>
    </main>
  );
}
