import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { User, Calendar, MapPin } from 'lucide-react';
import { containerVariants, itemVariants } from '@/components/common/AnimationVariants';

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const stats = [
    { icon: Calendar, label: 'Experience', value: '2+ Years' },
    { icon: User, label: 'Projects', value: '15+ Completed' },
    { icon: MapPin, label: 'Location', value: 'London, UK' }
  ];

  return (
    <section id="about" className="py-24">
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

          <div className="grid lg:grid-cols-2 gap-0 items-stretch">
            {/* Bio */}
            <motion.div variants={itemVariants} className="pr-6">
              <div className="glass p-8 rounded-2xl h-full flex flex-col justify-center">
                <p className="text-lg text-foreground/90 leading-relaxed mb-6">
                  I'm a data scientist with a computer science foundation, experienced across the stack—from PySpark pipelines and feature engineering to modelling and decision-ready visuals. My focus is on building solutions that are practical, explainable, and ready to deploy.
                </p>
                <p className="text-lg text-foreground/90 leading-relaxed">
                  Recent work includes churn and retention modelling, player-behaviour segmentation, and geospatial analysis to support product and strategy. Outside of work, I enjoy photography, travelling, and playing football/tennis—interests that keep me both creative and competitive.
                </p>
              </div>
            </motion.div>

            {/* Profile Image */}
            <motion.div variants={itemVariants} className="pl-6">
              <div className="relative h-full">
                <img 
                  src="/vishal-profile.jpg" 
                  alt="Vishal Navin" 
                  className="w-full h-full object-cover rounded-2xl shadow-lg"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-primary/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.div>
          </div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="mt-16">
            <div className="grid grid-cols-3 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className="glass p-6 rounded-xl text-center card-hover"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-primary mb-4">
                    <stat.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="text-xl font-bold gradient-text mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>


        </motion.div>
      </div>
    </section>
  );
}