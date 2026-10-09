import React from 'react';
import { useToolTrack } from '../../context/ToolTrackContext';
import { CATEGORIES_SEO, TOOLS_SEO, type CategorySeoData } from '../../data/seoRegistry';
import { TOOLS_LIST } from '../../data/toolsList';
import { getIconComponent } from '../common/MegaMenu';
import { ArrowRight, ChevronRight, Home, Sparkles, Layers, ShieldCheck } from 'lucide-react';

interface CategoryLandingPageProps {
  categoryKey: string;
}

export const CategoryLandingPage: React.FC<CategoryLandingPageProps> = ({ categoryKey }) => {
  const { setActiveToolId, setActiveCategoryKey } = useToolTrack();
  const categoryData: CategorySeoData =
    CATEGORIES_SEO[categoryKey] || CATEGORIES_SEO['pdf'];

  const categoryTools = categoryData.toolIds
    .map((id) => TOOLS_LIST.find((t) => t.id === id))
    .filter((t): t is typeof TOOLS_LIST[number] => Boolean(t));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400"
      >
        <button
          onClick={() => {
            setActiveToolId(null);
            if (setActiveCategoryKey) setActiveCategoryKey(null);
          }}
          className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 dark:text-slate-200">
          {categoryData.name}
        </span>
      </nav>

      {/* Hero Header */}
      <header className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-indigo-50/80 via-white to-slate-50 dark:from-slate-850 dark:via-slate-850 dark:to-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/80 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>ToolTrack Category Directory</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {categoryData.h1}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          {categoryData.seoDescription}
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            100% In-Browser Privacy
          </span>
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {categoryTools.length} Specialized Utilities Available
          </span>
        </div>
      </header>

      {/* Grid of Tools in Category */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Available {categoryData.name}
          </h2>
          <span className="text-xs text-slate-400">
            {categoryTools.length} tools
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryTools.map((tool) => {
            const Icon = getIconComponent(tool.iconName);
            const seo = TOOLS_SEO[tool.id];
            const cleanUrl = seo ? seo.route : `/tools/${tool.id}`;

            return (
              <a
                key={tool.id}
                href={cleanUrl}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveToolId(tool.id);
                }}
                className="group p-5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition flex flex-col justify-between space-y-4 cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    {tool.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                        {tool.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* Internal Linking to Other Categories */}
      <section className="p-6 rounded-2xl bg-slate-100/70 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Explore Other ToolTrack Categories
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.values(CATEGORIES_SEO).map((cat) => {
            const isCurrent = cat.key === categoryKey;
            return (
              <a
                key={cat.key}
                href={cat.route}
                onClick={(e) => {
                  e.preventDefault();
                  if (setActiveCategoryKey) setActiveCategoryKey(cat.key);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
              >
                {cat.name}
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
};
