import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { containerVariants, itemVariants } from '@/components/common/AnimationVariants';

const skillCategories = [
  {
    title: 'Technical',
    skills: [
      'Python', 'SQL', 'PySpark', 'Spark', 'Tableau', 
      'MongoDB', 'R Studio', 'Excel', 'PowerPoint'
    ]
  },
  {
    title: 'Analytics',
    skills: [
      'Predictive Modelling', 'Feature Engineering', 'Geospatial Analysis',
      'Clustering', 'Data Visualisation', 'Statistical Analysis'
    ]
  },
  {
    title: 'Professional',
    skills: [
      'Stakeholder Engagement', 'Insight Communication', 
      'Prioritisation', 'Teamwork', 'Project Management'
    ]
  }
];

export default function Skills() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Create a long list for marquee effect
  const allSkills = skillCategories.flatMap(category => category.skills);
  const marqueeSkills = [...allSkills, ...allSkills]; // Duplicate for seamless loop

  return (
    <section id="skills" className="py-24 bg-secondary/20">
      <div className="container mx-auto px-6">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Skills & <span className="gradient-text">Expertise</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Technologies and methods I use to deliver outcomes.
            </p>
          </motion.div>

          {/* Skills Marquee */}
          <motion.div variants={itemVariants} className="mb-16 overflow-hidden relative py-8">
            <div className="marquee-container relative">
              <motion.div 
                className="marquee whitespace-nowrap"
                animate={{ x: [0, -50] }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                {marqueeSkills.map((skill, index) => (
                  <motion.span
                    key={`${skill}-${index}`}
                    className="inline-block px-6 py-3 mx-3 bg-gradient-to-r from-primary/15 to-accent-secondary/15 border border-primary/40 rounded-full text-sm font-medium backdrop-blur-sm transition-all duration-300 shadow-sm"
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 0 15px rgba(139, 92, 246, 0.3)",
                      borderColor: "rgba(139, 92, 246, 0.6)"
                    }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Skills Categories */}
          <div className="grid md:grid-cols-3 gap-8">
            {skillCategories.map((category, categoryIndex) => (
              <motion.div
                key={category.title}
                variants={itemVariants}
                className="glass p-8 rounded-2xl card-hover relative overflow-hidden group"
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 20px 40px rgba(139, 92, 246, 0.1)"
                }}
              >
                {/* Animated background gradient */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
                
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-6 gradient-text flex items-center">
                    <div className="w-2 h-2 bg-gradient-primary rounded-full mr-3" />
                    {category.title}
                  </h3>
                  <div className="space-y-3">
                    {category.skills.map((skill, skillIndex) => (
                      <motion.div
                        key={skill}
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                        transition={{
                          delay: 0.3 + categoryIndex * 0.1 + skillIndex * 0.05,
                          duration: 0.5
                        }}
                        className="p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 border border-transparent hover:border-primary/20 group/skill"
                        whileHover={{ 
                          scale: 1.02,
                          x: 5
                        }}
                      >
                        <span className="text-sm font-medium group-hover/skill:text-primary transition-colors duration-300">
                          {skill}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}