import { Link } from 'react-router-dom';
import {
  UtensilsCrossed, Users, ShoppingCart,
  Sparkles, Moon, BookOpen, ArrowRight, Check,
  ChefHat, Share2, Bell
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Your Household Cookbook',
    desc: 'Build a shared recipe collection with your household. Add ingredients, servings, photos, and categories to every dish.',
  },
  {
    icon: Moon,
    title: "Tonight's Menu",
    desc: "Pick dishes from your menu and add them to tonight's plan. Everyone in the household sees what's for dinner.",
  },
  {
    icon: ShoppingCart,
    title: 'Auto Shopping List',
    desc: 'All ingredients for tonight\'s dishes are automatically compiled into a single shopping list — no manual work.',
  },
  {
    icon: Users,
    title: 'Household Sharing',
    desc: 'Create or join a household. Your menu, plans, and recipes are instantly shared with everyone in your group.',
  },
  {
    icon: Bell,
    title: 'Dinner Notifications',
    desc: "Send a one-click notification to your entire household so everyone knows what's on the menu tonight.",
  },
  {
    icon: Sparkles,
    title: 'Community Feed',
    desc: 'Browse dishes shared by other households for inspiration and discover new recipes to add to your collection.',
  },
];

const steps = [
  { n: '01', title: 'Create your household', desc: 'Sign up and set up a household. Invite your family or housemates with a simple code.' },
  { n: '02', title: 'Build your menu', desc: 'Add your favourite dishes with ingredients, photos, and serving sizes.' },
  { n: '03', title: 'Plan tonight', desc: 'Pick what you\'re having tonight. Your shopping list is generated automatically.' },
  { n: '04', title: 'Notify everyone', desc: 'Hit notify and your whole household knows dinner is sorted.' },
];

export default function InfoPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 overflow-x-hidden">

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-amber-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-amber-700 font-bold text-xl">
            <UtensilsCrossed size={22} />
            Dinnerly
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-amber-700 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-amber-700 transition-colors">How it works</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-amber-700 transition-colors">
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-amber-100 opacity-50 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-32 w-[500px] h-[500px] rounded-full bg-orange-100 opacity-40 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-full mb-8 tracking-wide uppercase">
            <ChefHat size={13} />
            Household meal planning, simplified
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
            What's for{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-amber-500">dinner</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-amber-100 rounded-full -z-0" />
            </span>
            <br />tonight?
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Dinnerly helps households plan meals together. Build a shared recipe collection,
            pick tonight's dishes, and get your shopping list — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="flex items-center gap-2 px-7 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-amber-200 text-sm"
            >
              Start for free <ArrowRight size={16} />
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold rounded-2xl transition-all text-sm shadow-sm"
            >
              Browse the menu
            </Link>
          </div>

          <p className="mt-5 text-xs text-gray-400">No credit card required &middot; Free to use</p>
        </div>

        {/* App mockup card */}
        <div className="relative max-w-3xl mx-auto mt-20">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
              <div className="w-3 h-3 rounded-full bg-red-300" />
              <div className="w-3 h-3 rounded-full bg-yellow-300" />
              <div className="w-3 h-3 rounded-full bg-green-300" />
              <div className="flex-1 mx-4 bg-white rounded-full px-4 py-1 text-xs text-gray-400 border border-gray-200 text-center">
                dinnerly.menu
              </div>
            </div>
            {/* Fake app content */}
            <div className="p-6 bg-amber-50 min-h-[260px]">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="h-5 w-20 bg-gray-800 rounded-md mb-1.5" />
                  <div className="h-3 w-32 bg-gray-300 rounded" />
                </div>
                <div className="h-9 w-24 bg-amber-500 rounded-xl" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-amber-100">
                    <div className="h-20 bg-amber-100 rounded-lg mb-2" />
                    <div className="h-3 w-3/4 bg-gray-200 rounded mb-1" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
                    <div className="mt-2 h-6 w-full bg-amber-50 border border-amber-200 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Floating tonight card */}
          <div className="absolute -right-6 top-24 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-48">
            <div className="flex items-center gap-2 mb-3">
              <Moon size={14} className="text-amber-500" />
              <span className="text-xs font-semibold text-gray-700">Tonight</span>
              <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">3</span>
            </div>
            {['Pasta Bolognese', 'Garlic Bread', 'Salad'].map(d => (
              <div key={d} className="flex items-center gap-1.5 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="text-xs text-gray-600">{d}</span>
              </div>
            ))}
            <div className="mt-3 flex items-center gap-1 text-xs text-amber-600 font-medium">
              <Share2 size={11} />
              Notify household
            </div>
          </div>
          {/* Floating shopping card */}
          <div className="absolute -left-6 bottom-10 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-44">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart size={14} className="text-amber-500" />
              <span className="text-xs font-semibold text-gray-700">Shopping</span>
            </div>
            {['Spaghetti', 'Ground beef', 'Tomatoes', 'Garlic'].map(item => (
              <div key={item} className="flex items-center gap-1.5 mb-1.5">
                <Check size={11} className="text-green-400 shrink-0" />
                <span className="text-xs text-gray-600">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Everything your household needs
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              From building recipes to planning tonight — Dinnerly keeps the whole household on the same page.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-amber-600" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Up and running in minutes
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              No complicated setup. Just sign up, add your dishes, and start planning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="flex gap-5 p-6 rounded-2xl bg-amber-50 border border-amber-100">
                <div className="text-3xl font-extrabold text-amber-200 leading-none shrink-0 select-none">{n}</div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-amber-500">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <UtensilsCrossed size={32} className="text-white" />
            </div>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
            Ready to sort dinner?
          </h2>
          <p className="text-amber-100 text-lg mb-10 max-w-xl mx-auto">
            Join households already using Dinnerly to plan meals, share recipes, and
            make "what's for dinner?" a question of the past.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="flex items-center gap-2 px-8 py-4 bg-white text-amber-600 font-bold rounded-2xl hover:bg-amber-50 transition-all shadow-lg text-sm"
            >
              Create your household <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border-2 border-white/40 text-white font-semibold rounded-2xl hover:bg-white/10 transition-all text-sm"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <UtensilsCrossed size={18} className="text-amber-400" />
            Dinnerly
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Dinnerly &middot; <a href="https://dinnerly.menu" className="hover:text-gray-300 transition-colors">dinnerly.menu</a>
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-300 transition-colors">App</Link>
            <Link to="/register" className="hover:text-gray-300 transition-colors">Sign up</Link>
            <Link to="/login" className="hover:text-gray-300 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
