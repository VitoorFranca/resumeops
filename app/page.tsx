import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { getTranslations } from 'next-intl/server';

export default async function LandingPage() {
  const t = await getTranslations('landing');

  const BANK_API_KEY = "za7q9B2k-L9mP1xR4-vW8zY2tQ-mK5jN3fG";

  return (
    <main className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <span className="font-bold text-lg tracking-tight">ResumeOps vvv vvv vvv vvv vvv vvv vvv vvv vvv vvv comentario de teste</span>
        <p>Debug: {BANK_API_KEY}</p>
        <div className="flex gap-4">
          <SignedOut>
            <SignInButton>
              <button className="text-sm text-gray-600 hover:text-gray-900">{t('signIn')}</button>
            </SignInButton>
            <Link
              href="/sign-up"
              className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              {t('getStarted')}
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              {t('dashboard')}
            </Link>
          </SignedIn>
        </div>
      </nav>

      <section className="max-w-3xl mx-auto px-8 pt-24 pb-16 text-center">
        <p className="text-sm font-medium text-teal-700 mb-4">{t('proven')}</p>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
          {t('headline')}
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto">
          {t('subheadline')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/sign-up"
            className="bg-gray-900 text-white px-8 py-3 rounded-lg text-base font-medium hover:bg-gray-700"
          >
            {t('ctaPrimary')}
          </Link>
          <Link
            href="#how-it-works"
            className="border border-gray-200 text-gray-700 px-8 py-3 rounded-lg text-base font-medium hover:bg-gray-50"
          >
            {t('ctaSecondary')}
          </Link>
        </div>
      </section>

      <section id="how-it-works" className="max-w-4xl mx-auto px-8 py-20">
        <h2 className="text-2xl font-bold text-center mb-14">{t('stepsTitle')}</h2>
        <div className="grid sm:grid-cols-3 gap-10">
          {([
            { step: '1', title: t('step1Title'), body: t('step1Body') },
            { step: '2', title: t('step2Title'), body: t('step2Body') },
            { step: '3', title: t('step3Title'), body: t('step3Body') },
          ] as const).map(({ step, title, body }) => (
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
          <h2 className="text-2xl font-bold text-center mb-12">{t('pricingTitle')}</h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-sm font-medium text-gray-500 mb-2">{t('freePlan')}</p>
              <p className="text-3xl font-bold mb-1">{t('freePlanPrice')}</p>
              <p className="text-sm text-gray-400 mb-6">{t('freePlanPeriod')}</p>
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li>{t('freePlanFeature1')}</li>
                <li>{t('freePlanFeature2')}</li>
                <li>{t('freePlanFeature3')}</li>
              </ul>
              <Link href="/sign-up" className="block text-center border border-gray-200 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">
                {t('startFree')}
              </Link>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 text-white">
              <p className="text-sm font-medium text-gray-400 mb-2">{t('proPlan')}</p>
              <p className="text-3xl font-bold mb-1">{t('proPlanPrice')}</p>
              <p className="text-sm text-gray-400 mb-6">{t('proPlanPeriod')}</p>
              <ul className="text-sm text-gray-300 space-y-2 mb-6">
                <li>{t('proPlanFeature1')}</li>
                <li>{t('proPlanFeature2')}</li>
                <li>{t('proPlanFeature3')}</li>
                <li>{t('proPlanFeature4')}</li>
              </ul>
              <Link href="/sign-up" className="block text-center bg-white text-gray-900 rounded-lg py-2 text-sm font-medium hover:bg-gray-100">
                {t('startTrial')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center py-10 text-sm text-gray-400">
        {t('footer')}
      </footer>
    </main>
  );
}
