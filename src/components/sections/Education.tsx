import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { GraduationCap, Calendar, MapPin } from 'lucide-react';
import { containerVariants, itemVariants } from '@/components/common/AnimationVariants';

const education = [
  {
    degree: 'Business Analytics',
    degreeType: 'MSc',
    institution: 'Imperial College London',
    location: 'London, UK',
    period: 'Aug 2023 – Aug 2024',
    description: 'Specialized in data science, machine learning, and business analytics. Key modules included Advanced Analytics, Machine Learning, and Data Visualization.',
    achievements: [
      'Distinction grade achieved',
      'Capstone project on customer churn prediction',
      'Member of Data Science Society'
    ]
  },
  {
    degree: 'Computer Science',
    degreeType: 'BSc',
    institution: 'University of Leicester',
    location: 'Leicester, UK',
    period: '2019 – 2022',
    description: 'Comprehensive computer science foundation with focus on software engineering, algorithms, and data structures.',
    achievements: [
      'First Class Honours',
      'Final year project on machine learning applications',
      'Programming Society committee member'
    ]
  }
];

export default function Education() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="education" className="py-24 bg-secondary/20">
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

                  {/* Degree Name and Type */}
                  <h3 className="text-xl font-bold mb-2 text-foreground">
                    {edu.degree}
                  </h3>
                  <p className="text-primary font-medium mb-2">
                    {edu.degreeType}
                  </p>

                  {/* Institution */}
                  <p className="text-primary font-medium mb-2">
                    {edu.institution}
                  </p>

                  {/* Period and Achievement */}
                  <p className="text-muted-foreground text-sm">
                    {index === 0 ? 'Merit • Aug 2023 – Aug 2024' : 'First-Class Honours • 2019 – 2022'}
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
