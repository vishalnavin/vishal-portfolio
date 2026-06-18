import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Code2, Sparkles, LineChart } from 'lucide-react';
import { containerVariants, itemVariants } from '@/components/common/AnimationVariants';

const skillCategories = [
  {
    title: 'Languages & Tools',
    icon: Code2,
    skills: [
      'Python', 'SQL', 'PySpark', 'Spark', 'R Studio', 'MongoDB', 'Excel', 'PowerPoint'
    ]
  },
  {
    title: 'Machine Learning & AI',
    icon: Sparkles,
    skills: [
      'Machine Learning', 'Predictive Modelling', 'NLP',
      'LLMs / Generative AI', 'RAG', 'Feature Engineering'
    ]
  },
  {
    title: 'Analytics & Visualisation',
    icon: LineChart,
    skills: [
      'Clustering', 'Statistical Analysis', 'Geospatial Analysis', 'Data Visualisation', 'Tableau'
    ]
  }
];

export default function Skills() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
              My <span className="gradient-text">Toolkit</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The technologies and methods behind my work.
            </p>
          </motion.div>

          {/* Skills Categories — 2×2 grid, each card hugs its own content */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {skillCategories.map((category) => (
              <motion.div
                key={category.title}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="glass p-6 md:p-8 rounded-2xl card-hover h-full"
              >
                {/* Category header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-sm">
                    <category.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold">{category.title}</h3>
                </div>

                {/* Skill chips */}
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 text-sm rounded-full bg-primary/10 text-foreground/90 border border-primary/20 hover:border-primary/50 hover:bg-primary/15 transition-colors duration-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
