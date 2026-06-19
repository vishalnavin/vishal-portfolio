import { motion } from 'framer-motion';
import { ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AsciiPortrait from '@/components/ui/AsciiPortrait';

export default function Hero() {

  const scrollToProjects = () => {
    const element = document.querySelector('#projects');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-primary/5 to-accent-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
          {/* Particle Portrait */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="flex-shrink-0"
          >
            <AsciiPortrait imageSrc="/vishal-ascii-cutout.png" />
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl lg:max-w-2xl text-center lg:text-left"
          >
            {/* Greeting */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground mb-4"
            >
              Hello, I'm
            </motion.p>

            {/* Name */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-3 md:mb-4 gradient-text animate-gradient-shift"
              style={{ backgroundSize: '200% 200%' }}
            >
              Vishal Navin
            </motion.h1>

            {/* Role */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-4 md:mb-6"
            >
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-base sm:text-lg md:text-xl lg:text-2xl lg:whitespace-nowrap font-bold gradient-text bg-gradient-to-r from-primary via-accent-secondary to-primary bg-clip-text text-transparent animate-gradient-shift leading-tight"
                style={{ backgroundSize: '200% 200%' }}
              >
                Data Scientist · ML, Insights and Visualisations
              </motion.span>
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground mb-3 md:mb-4 max-w-3xl lg:max-w-none px-4 lg:px-0"
            >
              I turn messy data into clear, actionable insight with pragmatic ML, reliable pipelines, and visuals that drive decisions.
            </motion.p>

            {/* Meta line */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="text-base sm:text-lg text-muted-foreground mb-6 md:mb-8 max-w-2xl lg:max-w-none px-4 lg:px-0"
            >
              Business Analytics MSc (Imperial College London)
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 sm:gap-4 mb-12 md:mb-16 px-4 lg:px-0"
            >
              <Button
                onClick={scrollToProjects}
                size="lg"
                className="bg-gradient-primary hover:bg-gradient-primary magnetic glow-hover group mobile-touch-target"
              >
                View Projects
                <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-8 text-sm text-muted-foreground px-4 lg:px-0"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>London, UK</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-border" />
              <span>2 Years Experience</span>
              <div className="hidden sm:block h-4 w-px bg-border" />
              <span>15+ Projects</span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="hidden md:block absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-muted-foreground rounded-full flex justify-center">
          <div className="w-1 h-3 bg-muted-foreground rounded-full mt-2 animate-bounce" />
        </div>
      </motion.div>
    </section>
  );
}
