import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { User, Calendar, MapPin } from 'lucide-react';
import { containerVariants, itemVariants } from '@/components/common/AnimationVariants';

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });



  return (
    <section id="about" className="py-24 bg-secondary/20">
      <div className="container mx-auto px-6">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="max-w-4xl mx-auto"
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              About <span className="gradient-text">Me</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Passionate about transforming complex data into actionable insights
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-0 items-stretch">
            {/* Bio */}
            <motion.div variants={itemVariants} className="lg:pr-6 order-2 lg:order-1">
              <div className="glass p-6 md:p-8 rounded-2xl h-full flex flex-col justify-center">
                <p className="text-base md:text-lg text-foreground/90 leading-relaxed mb-4 md:mb-6">
                  I'm a data scientist with a computer science foundation, experienced across the stack—from PySpark pipelines and feature engineering to modelling and decision-ready visuals. My focus is on building solutions that are practical, explainable, and ready to deploy.
                </p>
                <p className="text-base md:text-lg text-foreground/90 leading-relaxed">
                  Recent work includes churn and retention modelling, player-behaviour segmentation, and geospatial analysis to support product and strategy. Photography and travel sharpen my eye for patterns and context — the same instincts I bring to data storytelling.
                </p>
              </div>
            </motion.div>

            {/* Profile Image */}
            <motion.div variants={itemVariants} className="lg:pl-6 order-1 lg:order-2">
              <div className="relative h-64 md:h-full">
                <img 
                  src="/vishal-profile.jpg" 
                  alt="Vishal Navin" 
                  className="w-full h-full object-cover rounded-2xl shadow-lg"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-primary/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.div>
          </div>




        </motion.div>
      </div>
    </section>
  );
}