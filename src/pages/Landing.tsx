// src/pages/Landing.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, TrendingUp, Bot } from 'lucide-react';
import GfVx5PnDyJLottie from '@/components/GfVx5PnDyJLottie';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleEnterApp = () => {
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-900 via-nebula-900 to-void-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-r from-green-400/20 to-teal-500/20 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-1/3 w-20 h-20 bg-gradient-to-r from-pink-400/20 to-rose-500/20 rounded-full blur-xl animate-pulse delay-500"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,215,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,215,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cosmic-900/50 to-nebula-900/80"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Hero Section */}
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Large Lottie Animation */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <GfVx5PnDyJLottie 
                width={320} 
                height={320} 
                className="drop-shadow-2xl animate-bounce-slow" 
              />
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-amber-500/30 rounded-full blur-3xl -z-10 animate-pulse"></div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-8xl font-playfair font-bold mb-6">
            <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-gold-400 bg-clip-text text-transparent animate-pulse">
              MonadAI
            </span>
          </h1>

          {/* Exciting Tagline */}
          <p className="text-xl md:text-2xl font-inter text-gold-200/90 mb-12 max-w-2xl mx-auto leading-relaxed">
            🚀 <span className="font-semibold text-yellow-400">Revolutionize your DeFi portfolio</span> with AI-powered insights, 
            <span className="text-amber-300"> real-time whale tracking</span>, and 
            <span className="text-gold-300"> intelligent allocation strategies!</span>
          </p>

          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 border border-yellow-400/20">
              <Bot className="h-5 w-5 text-yellow-400" />
              <span className="text-sm font-medium text-gold-200">AI Assistant</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 border border-blue-400/20">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <span className="text-sm font-medium text-gold-200">Whale Tracking</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 border border-green-400/20">
              <Sparkles className="h-5 w-5 text-green-400" />
              <span className="text-sm font-medium text-gold-200">Smart Allocations</span>
            </div>
          </div>

          {/* CTA Button */}
          <div className="relative">
            <Button
              onClick={handleEnterApp}
              size="lg"
              className="relative group bg-gradient-to-r from-yellow-400 via-amber-500 to-gold-500 hover:from-yellow-500 hover:via-amber-600 hover:to-gold-600 text-black font-bold text-lg px-8 py-4 rounded-xl shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105 border-2 border-yellow-400/50 hover:border-yellow-400"
            >
              <span className="flex items-center space-x-2">
                <span>Launch MonadAI</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
              
              {/* Button Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/40 to-amber-500/40 rounded-xl blur-xl -z-10 group-hover:blur-2xl transition-all duration-300"></div>
            </Button>
          </div>

          {/* Subtitle */}
          <p className="mt-8 text-sm text-gold-200/60 font-inter">
            Experience the future of DeFi portfolio management on Monad blockchain
          </p>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 left-10 animate-float">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full opacity-20 blur-sm"></div>
        </div>
        <div className="absolute top-1/3 right-20 animate-float delay-1000">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-30 blur-sm"></div>
        </div>
        <div className="absolute bottom-1/4 left-1/4 animate-float delay-2000">
          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-teal-500 rounded-full opacity-25 blur-sm"></div>
        </div>
      </div>
    </div>
  );
};

export default Landing;