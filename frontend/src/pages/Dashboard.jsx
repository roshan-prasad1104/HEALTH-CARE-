import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useAccessibility } from '../context/AccessibilityContext';
import { MessageSquare, BarChart2, BookOpen, Volume2, Star, Eye, ArrowRight, Pill } from 'lucide-react';

export default function Dashboard({ setActiveTab }) {
  const { t, i18n } = useTranslation();
  const { elderlyMode, largeFont, darkMode } = useSelector(state => state.settings);
  const { getHoverSpeechProps, speakText } = useAccessibility();

  const handleReadIntroduction = () => {
    speakText(t('speech.intro'), i18n.language);
  };

  const stats = [
    { label: t('dashboard.statsDebunked'), value: "24,802" },
    { label: t('dashboard.statsIndexed'),  value: "1,250+" },
    { label: t('dashboard.statsSources'),  value: "WHO, CDC, NIH" }
  ];

  const cards = [
    {
      id: 'scanner',
      title: t('scanner.title'),
      desc: t('scanner.desc'),
      icon: MessageSquare,
      darkColor: "from-pink-600/20 to-purple-600/20 border-pink-500/20 hover:border-pink-500/50",
      darkIconCls: "bg-slate-950/80 text-pink-400 border-slate-800/60",
      lightIconBg: 'rgba(252,231,243,0.9)',
      lightIconColor: '#9d174d',
      lightIconBorder: 'rgba(236,72,153,0.2)',
    },
    {
      id: 'prescription',
      title: t('prescription.title'),
      desc: t('prescription.desc'),
      icon: Pill,
      darkColor: "from-indigo-600/20 to-blue-600/20 border-indigo-500/20 hover:border-indigo-500/50",
      darkIconCls: "bg-slate-950/80 text-indigo-400 border-slate-800/60",
      lightIconBg: 'rgba(224,231,255,0.9)',
      lightIconColor: '#3730a3',
      lightIconBorder: 'rgba(99,102,241,0.25)',
    },
    {
      id: 'lab',
      title: t('lab.title'),
      desc: t('lab.desc'),
      icon: BarChart2,
      darkColor: "from-emerald-600/20 to-teal-600/20 border-emerald-500/20 hover:border-emerald-500/50",
      darkIconCls: "bg-slate-950/80 text-emerald-400 border-slate-800/60",
      lightIconBg: 'rgba(209,250,229,0.9)',
      lightIconColor: '#065f46',
      lightIconBorder: 'rgba(16,185,129,0.25)',
    },
    {
      id: 'learning',
      title: t('learning.title'),
      desc: t('learning.desc'),
      icon: BookOpen,
      darkColor: "from-amber-600/20 to-orange-600/20 border-amber-500/20 hover:border-amber-500/50",
      darkIconCls: "bg-slate-950/80 text-amber-400 border-slate-800/60",
      lightIconBg: 'rgba(254,243,199,0.9)',
      lightIconColor: '#92400e',
      lightIconBorder: 'rgba(245,158,11,0.25)',
    }
  ];

  return (
    <div className={`dashboard-shell max-w-6xl mx-auto px-4 md:px-8 py-8 ${largeFont ? 'text-lg' : 'text-sm'}`}>

      {/* Elderly mode banner */}
      {elderlyMode && (
        <div className="mb-6 p-4 rounded-xl bg-health-600/20 border border-health-500/40 text-health-200 flex items-center gap-3 animate-pulse">
          <Eye className="w-6 h-6 flex-shrink-0" />
          <p className="font-semibold">{t('dashboard.elderlyBanner')}</p>
        </div>
      )}

      {/* ── Hero ── */}
      <div className="dashboard-hero glass-panel relative overflow-hidden p-6 md:p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Orb */}
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl -z-10 pulse-glow-indigo"
          style={{ background: 'var(--orb-color)' }}
        />

        <div className="max-w-xl">
          {/* Badge */}
          <span className="premium-badge px-3 py-1 rounded-full text-xs font-bold tracking-wider inline-flex items-center gap-1.5 mb-5">
            <Star className="w-3.5 h-3.5 fill-current" /> Venture Demo Version
          </span>

          {/* Title */}
          <h2
            className={`font-black tracking-tight mb-4 font-display leading-tight ${largeFont ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'}`}
            style={{ color: 'var(--text-primary)' }}
          >
            {t('dashboard.heroTitle')}
          </h2>

          {/* Subtitle */}
          <p
            className={`leading-relaxed mb-7 ${largeFont ? 'text-base' : 'text-sm'}`}
            style={{ color: 'var(--text-muted)' }}
          >
            {t('dashboard.heroDesc')}
          </p>

          {/* CTA button */}
          <button
            onClick={handleReadIntroduction}
            className="premium-btn px-5 py-2.5 font-semibold text-xs tracking-wide transition-all flex items-center gap-2"
          >
            <Volume2 className="w-4 h-4" /> {t('accessibility.narrate')}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:flex-col gap-3 w-full md:w-auto">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="inner-card p-5 min-w-[152px]"
            >
              <p
                className="text-2xl font-black"
                style={{ color: 'var(--text-primary)' }}
              >
                {stat.value}
              </p>
              <p
                className="text-[10px] font-semibold tracking-widest uppercase mt-1"
                style={{ color: 'var(--stat-label)' }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Section heading */}
      <h3
        className={`font-bold mb-5 font-display ${largeFont ? 'text-2xl' : 'text-xl'}`}
        style={{ color: 'var(--text-primary)' }}
      >
        {t('dashboard.modules')}
      </h3>

      {/* ── Feature Cards ── */}
      <div className="dashboard-module-grid grid grid-cols-1 md:grid-cols-2 gap-5">
        {cards.map(card => (
          <div
            key={card.id}
            onClick={() => setActiveTab(card.id)}
            {...getHoverSpeechProps(`${card.title}. ${card.desc}`, i18n.language)}
            className={`group module-card module-card-${card.id}`}
          >
            <div>
              {/* Icon */}
              <div className={`module-icon module-icon-${card.id}`}>
                <card.icon className="w-6 h-6" />
              </div>

              <h4
                className={`font-bold mb-2 font-display ${largeFont ? 'text-xl' : 'text-lg'}`}
                style={{ color: 'var(--text-primary)' }}
              >
                {card.title}
              </h4>
              <p
                className={`leading-relaxed ${largeFont ? 'text-sm' : 'text-xs'}`}
                style={{ color: 'var(--text-muted)' }}
              >
                {card.desc}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span
                className="text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all duration-200 group-hover:gap-2.5"
                style={{ color: 'var(--text-brand)' }}
              >
                Open Tool <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
