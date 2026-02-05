import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Package, Truck, MapPin, Shield, Clock, Phone, Mail, ChevronRight, Menu, X, Check, Star, Users, Building2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Navigation Component
const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-lg' : 'bg-transparent'}`}>
      <div className="section-container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3" data-testid="logo">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${scrolled ? 'bg-blue-100' : 'bg-white/20'}`}>
              <Package className="w-7 h-7 text-blue-600" strokeWidth={2} />
            </div>
            <span className={`font-heading text-2xl font-bold tracking-tight ${scrolled ? 'text-slate-900' : 'text-white'}`}>
              FLUXY LOGISTIQUE
            </span>
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className={`font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-blue-600' : 'text-white/80 hover:text-white'}`} data-testid="nav-features">Fonctionnalités</a>
            <a href="#how-it-works" className={`font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-blue-600' : 'text-white/80 hover:text-white'}`} data-testid="nav-how">Comment ça marche</a>
            <a href="#download" className={`font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-blue-600' : 'text-white/80 hover:text-white'}`} data-testid="nav-download">Télécharger</a>
            <a href="#contact" className={`font-medium transition-colors ${scrolled ? 'text-slate-600 hover:text-blue-600' : 'text-white/80 hover:text-white'}`} data-testid="nav-contact">Contact</a>
            <a href={`${BACKEND_URL}/api/admin`} className="btn-primary text-sm py-3 px-6" data-testid="nav-admin">Admin</a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            data-testid="mobile-menu-btn"
          >
            {isOpen ? <X className={scrolled ? 'text-slate-900' : 'text-white'} /> : <Menu className={scrolled ? 'text-slate-900' : 'text-white'} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white rounded-xl shadow-xl mt-2 p-6 space-y-4">
            <a href="#features" className="block text-slate-600 font-medium py-2" onClick={() => setIsOpen(false)}>Fonctionnalités</a>
            <a href="#how-it-works" className="block text-slate-600 font-medium py-2" onClick={() => setIsOpen(false)}>Comment ça marche</a>
            <a href="#download" className="block text-slate-600 font-medium py-2" onClick={() => setIsOpen(false)}>Télécharger</a>
            <a href="#contact" className="block text-slate-600 font-medium py-2" onClick={() => setIsOpen(false)}>Contact</a>
            <a href="/api/admin" className="btn-primary block text-center">Admin</a>
          </div>
        )}
      </div>
    </nav>
  );
};

// Hero Section
const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-slate-900 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1645888921404-604ed47d6be1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwzfHxBZnJpY2FuJTIwZGVsaXZlcnklMjBkcml2ZXIlMjB0cnVjayUyMGxvZ2lzdGljc3xlbnwwfHx8fDE3NzAyOTA3ODN8MA&ixlib=rb-4.1.0&q=85"
          alt="Camion de livraison"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/60"></div>
      </div>

      {/* Dot Pattern */}
      <div className="absolute inset-0 dot-pattern"></div>

      {/* Content */}
      <div className="relative section-container pt-32 pb-20 min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4" fill="currentColor" />
              <span>N°1 de la livraison B2B au Congo</span>
            </div>
            
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight uppercase leading-tight mb-6">
              La Logistique B2B <span className="text-blue-500">Simplifiée</span> pour l'Afrique
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-lg">
              Transportez vos marchandises lourdes en toute sécurité. Meubles, électroménager, matériaux de construction — nous livrons tout.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#download" className="btn-primary flex items-center justify-center gap-2" data-testid="hero-download-btn">
                <Package className="w-5 h-5" />
                Télécharger l'App
              </a>
              <a href="#become-driver" className="btn-secondary flex items-center justify-center gap-2" data-testid="hero-driver-btn">
                <Truck className="w-5 h-5" />
                Devenir Chauffeur
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-slate-700">
              <div>
                <div className="font-heading text-3xl font-bold text-white">500+</div>
                <div className="text-slate-400 text-sm">Livraisons</div>
              </div>
              <div>
                <div className="font-heading text-3xl font-bold text-white">50+</div>
                <div className="text-slate-400 text-sm">Chauffeurs</div>
              </div>
              <div>
                <div className="font-heading text-3xl font-bold text-white">98%</div>
                <div className="text-slate-400 text-sm">Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Right Content - App Preview */}
          <div className="hidden lg:block animate-fade-in-up animation-delay-200">
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-600/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-slate-800 rounded-3xl p-8 border border-slate-700">
                <div className="aspect-[9/16] max-w-[280px] mx-auto bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="h-full flex flex-col">
                    <div className="bg-blue-600 p-4">
                      <div className="flex items-center gap-2 text-white">
                        <Package className="w-6 h-6" />
                        <span className="font-heading font-bold">FLUXY</span>
                      </div>
                    </div>
                    <div className="flex-1 p-4 space-y-3">
                      <div className="bg-slate-800 rounded-lg p-3">
                        <div className="text-xs text-slate-400 mb-1">Livraison #QH4F2A</div>
                        <div className="text-white font-medium">Meuble Salon</div>
                        <div className="text-green-400 text-sm mt-2 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          En cours de livraison
                        </div>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-3">
                        <div className="text-xs text-slate-400 mb-1">Livraison #QH5B3C</div>
                        <div className="text-white font-medium">Électroménager</div>
                        <div className="text-amber-400 text-sm mt-2 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          En attente
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-white/50 rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

// Features Section
const FeaturesSection = () => {
  const features = [
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Suivi en Temps Réel",
      description: "Visualisez votre cargaison à chaque étape du parcours avec notre GPS intégré.",
      span: "md:col-span-2"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Flotte Certifiée",
      description: "Camions inspectés et chauffeurs vérifiés pour une sécurité maximale.",
      span: "md:col-span-1"
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Prix Transparents",
      description: "Devis instantané sans frais cachés. Payez exactement ce qui est affiché.",
      span: "md:col-span-1"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Support 24/7",
      description: "Une équipe dédiée à votre écoute, disponible à tout moment pour vous aider.",
      span: "md:col-span-2"
    }
  ];

  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="section-container">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Package className="w-4 h-4" />
            <span>Nos Fonctionnalités</span>
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 tracking-tight uppercase mb-4">
            Pourquoi Choisir Fluxy ?
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Une solution complète pour tous vos besoins de livraison d'articles lourds.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`card group ${feature.span}`}
              data-testid={`feature-card-${index}`}
            >
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="font-heading text-2xl font-bold text-slate-900 uppercase tracking-tight mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// How It Works Section
const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Commandez",
      description: "Décrivez votre colis, indiquez l'adresse de destination et obtenez un devis instantané.",
      icon: <Package className="w-10 h-10" />
    },
    {
      number: "02",
      title: "Suivez",
      description: "Un chauffeur accepte votre commande. Suivez-le en temps réel jusqu'à la livraison.",
      icon: <MapPin className="w-10 h-10" />
    },
    {
      number: "03",
      title: "Réceptionnez",
      description: "Votre colis est livré. Confirmez la réception et notez votre expérience.",
      icon: <Check className="w-10 h-10" />
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="section-container">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Truck className="w-4 h-4" />
            <span>Simple & Rapide</span>
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 tracking-tight uppercase mb-4">
            Comment Ça Marche ?
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            En 3 étapes simples, faites livrer vos marchandises partout au Congo.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative" data-testid={`step-${index}`}>
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-20 left-1/2 w-full h-0.5 bg-slate-200">
                  <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6" />
                </div>
              )}
              
              <div className="text-center relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 text-white rounded-2xl mb-6 shadow-xl">
                  {step.icon}
                </div>
                <div className="font-heading text-6xl font-extrabold text-slate-100 absolute -top-4 left-1/2 -translate-x-1/2 -z-10">
                  {step.number}
                </div>
                <h3 className="font-heading text-2xl font-bold text-slate-900 uppercase tracking-tight mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-600 max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// For Who Section
const ForWhoSection = () => {
  return (
    <section id="become-driver" className="py-24 bg-slate-900">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* For Businesses */}
          <div className="bg-slate-800 rounded-2xl p-8 md:p-12 border border-slate-700">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-heading text-3xl font-bold text-white uppercase tracking-tight mb-4">
              Pour les Entreprises
            </h3>
            <p className="text-slate-300 mb-6">
              Simplifiez vos livraisons B2B. Meubles, électroménager, matériaux de construction — nous transportons tout pour vous.
            </p>
            <ul className="space-y-3 mb-8">
              {["Devis instantané", "Suivi en temps réel", "Factures automatiques", "Support dédié"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300">
                  <Check className="w-5 h-5 text-green-400" />
                  {item}
                </li>
              ))}
            </ul>
            <a href="#download" className="btn-primary inline-flex items-center gap-2" data-testid="business-cta">
              Commencer Maintenant
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>

          {/* For Drivers */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-8 md:p-12">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-heading text-3xl font-bold text-white uppercase tracking-tight mb-4">
              Pour les Chauffeurs
            </h3>
            <p className="text-white/90 mb-6">
              Rejoignez notre réseau de chauffeurs partenaires et augmentez vos revenus. Travaillez à votre rythme.
            </p>
            <ul className="space-y-3 mb-8">
              {["Revenus attractifs", "Flexibilité totale", "Paiements rapides", "Formation gratuite"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white">
                  <Check className="w-5 h-5" />
                  {item}
                </li>
              ))}
            </ul>
            <a href="#download" className="bg-white text-amber-600 font-bold uppercase tracking-wide py-4 px-8 rounded-md inline-flex items-center gap-2 hover:bg-slate-100 transition-colors" data-testid="driver-cta">
              Devenir Chauffeur
              <ChevronRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

// Download Section
const DownloadSection = () => {
  return (
    <section id="download" className="py-24 bg-blue-600">
      <div className="section-container">
        <div className="text-center">
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white tracking-tight uppercase mb-4">
            Téléchargez l'Application
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Disponible sur iOS et Android. Commencez à livrer ou à commander dès aujourd'hui.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* App Store Button */}
            <a 
              href="#" 
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-4 flex items-center gap-3 transition-colors min-w-[200px]"
              data-testid="app-store-btn"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
              </svg>
              <div className="text-left">
                <div className="text-xs text-slate-400">Télécharger sur</div>
                <div className="text-lg font-semibold">App Store</div>
              </div>
            </a>

            {/* Google Play Button */}
            <a 
              href="#" 
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-4 flex items-center gap-3 transition-colors min-w-[200px]"
              data-testid="google-play-btn"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              <div className="text-left">
                <div className="text-xs text-slate-400">Disponible sur</div>
                <div className="text-lg font-semibold">Google Play</div>
              </div>
            </a>
          </div>

          {/* App Preview */}
          <div className="mt-16">
            <img 
              src="https://images.pexels.com/photos/5077067/pexels-photo-5077067.jpeg"
              alt="Chauffeur utilisant l'application Fluxy"
              className="max-w-lg mx-auto rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// Contact Section
const ContactSection = () => {
  return (
    <section id="contact" className="py-24 bg-slate-50">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Info */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Mail className="w-4 h-4" />
              <span>Contactez-nous</span>
            </div>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 tracking-tight uppercase mb-4">
              Une Question ?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Notre équipe est disponible pour répondre à toutes vos questions.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Téléphone</div>
                  <div className="text-lg font-semibold text-slate-900">+242 06 XXX XX XX</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Email</div>
                  <div className="text-lg font-semibold text-slate-900">contact@fluxy-logistique.com</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Adresse</div>
                  <div className="text-lg font-semibold text-slate-900">Brazzaville, République du Congo</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
            <h3 className="font-heading text-2xl font-bold text-slate-900 uppercase tracking-tight mb-6">
              Envoyez-nous un Message
            </h3>
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nom complet</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-md h-12 px-4 focus:border-blue-600 focus:ring-blue-600 focus:outline-none transition-colors"
                  placeholder="Votre nom"
                  data-testid="contact-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input 
                  type="email" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-md h-12 px-4 focus:border-blue-600 focus:ring-blue-600 focus:outline-none transition-colors"
                  placeholder="votre@email.com"
                  data-testid="contact-email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-4 h-32 focus:border-blue-600 focus:ring-blue-600 focus:outline-none transition-colors resize-none"
                  placeholder="Votre message..."
                  data-testid="contact-message"
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="btn-primary w-full"
                data-testid="contact-submit"
              >
                Envoyer le Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

// Footer
const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Package className="w-7 h-7 text-white" />
              </div>
              <span className="font-heading text-2xl font-bold tracking-tight">FLUXY LOGISTIQUE</span>
            </div>
            <p className="text-slate-400 max-w-md">
              La plateforme de livraison B2B leader au Congo. Nous connectons les entreprises aux chauffeurs de confiance pour des livraisons rapides et sécurisées.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading text-lg font-bold uppercase tracking-tight mb-4">Navigation</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-slate-400 hover:text-white transition-colors">Fonctionnalités</a></li>
              <li><a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors">Comment ça marche</a></li>
              <li><a href="#download" className="text-slate-400 hover:text-white transition-colors">Télécharger</a></li>
              <li><a href="#contact" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading text-lg font-bold uppercase tracking-tight mb-4">Légal</h4>
            <ul className="space-y-3">
              <li><a href="/conditions" className="text-slate-400 hover:text-white transition-colors">Conditions d'utilisation</a></li>
              <li><a href="/confidentialite" className="text-slate-400 hover:text-white transition-colors">Politique de confidentialité</a></li>
              <li><a href={`${BACKEND_URL}/api/admin`} className="text-slate-400 hover:text-white transition-colors">Administration</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-500">
          <p>© 2026 Fluxy Logistique. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

// Landing Page Component
const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ForWhoSection />
      <DownloadSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
