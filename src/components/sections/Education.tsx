import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { GraduationCap, Calendar, MapPin, Building } from 'lucide-react';
import { containerVariants, itemVariants } from '@/components/common/AnimationVariants';

const education = [
  {
    degree: 'Business Analytics',
    degreeType: 'MSc',
    institution: 'Imperial College London, UK',
    period: 'Aug 2023 – Aug 2024'
  },
  {
    degree: 'Computer Science',
    degreeType: 'BSc',
    institution: 'University of Leicester, UK',
    period: '2019 – 2022'
  }
];

export default function Education() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="education" className="py-24">
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
              <span className="gradient-text">Education</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Academic foundation in computer science and business analytics
            </p>
          </motion.div>

          {/* Education Cards */}
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {education.map((edu, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="glass p-6 rounded-2xl card-hover"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                    <GraduationCap className="h-6 w-6 text-primary-foreground" />
                  </div>

                  {/* Degree */}
                  <h3 className="text-xl font-bold mb-2 text-foreground">
                    {edu.degree} {edu.degreeType}
                  </h3>

                  {/* Institution */}
                  <p className="text-primary font-medium mb-2">
                    {edu.institution}
                  </p>

                  {/* Period */}
                  <p className="text-muted-foreground text-sm">
                    {edu.period}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
