import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, Package, Users, ArrowRight, ShieldCheck, TrendingUp, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-primary/20 flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border bg-surface/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-sm">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight">CRMCIS</span>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <Link to="/dashboard" className="stitch-button-primary flex items-center gap-2">
                  Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                    Log in
                  </Link>
                  <Link to="/login" className="stitch-button-primary">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-8 border border-primary/20">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Enterprise Inventory
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-text-primary">
                Food costs controlled.<br />
                Margins <span className="text-primary">maximized.</span>
              </h1>
              
              <p className="mt-6 text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                A centralized raw material and cost intelligence system designed for multi-branch restaurants. Track usage, spot variance, and eliminate shrinkage.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  to={user ? "/dashboard" : "/login"} 
                  className="stitch-button-primary text-lg px-8 py-3 w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  {user ? "Open Dashboard" : "Start Optimizing"} 
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a 
                  href="#features" 
                  className="stitch-button-secondary text-lg px-8 py-3 w-full sm:w-auto text-center"
                >
                  Explore Features
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-surface border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Professional tools for scale</h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Everything you need to manage inventory across multiple locations with precision and accountability.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Package className="w-5 h-5" />}
                title="Centralized Catalog"
                description="Maintain a single source of truth for all raw materials, standardizing units and costs across all branches."
              />
              <FeatureCard 
                icon={<TrendingUp className="w-5 h-5" />}
                title="Variance Detection"
                description="Automatically compare theoretical usage against actual consumption to instantly identify shrinkage or over-portioning."
              />
              <FeatureCard 
                icon={<Users className="w-5 h-5" />}
                title="Branch Management"
                description="Easily distribute items to branches and give managers the tools to track local inventory levels."
              />
              <FeatureCard 
                icon={<ArrowRight className="w-5 h-5" />}
                title="Transfers & Adjustments"
                description="Handle inter-branch stock transfers and manual adjustments with full approval workflows."
              />
              <FeatureCard 
                icon={<BarChart3 className="w-5 h-5" />}
                title="Cost Intelligence"
                description="Generate actionable reports on inventory valuation, usage trends, and overall profitability."
              />
              <FeatureCard 
                icon={<Lock className="w-5 h-5" />}
                title="Role-Based Security"
                description="Strict access controls ensure that only authorized personnel can approve transfers, modify catalogs, or view cost data."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background py-10 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-text-tertiary text-background flex items-center justify-center">
              <BarChart3 className="w-3 h-3" />
            </div>
            <span className="font-bold text-text-primary tracking-tight">CRMCIS</span>
          </div>
          <p className="text-sm text-text-tertiary">
            &copy; {new Date().getFullYear()} Centralized Raw Materials & Cost Intelligence System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-6 rounded-2xl stitch-card hover:border-primary/40 transition-colors group">
      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}
