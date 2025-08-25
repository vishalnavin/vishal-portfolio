import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Building, Calendar, MapPin } from 'lucide-react';
import { containerVariants, slideVariants } from '@/components/common/AnimationVariants';

const experiences = [
  {
    title: 'Data Scientist Intern',
    company: 'Rockstar Games',
    location: 'London',
    period: 'Jan 2025 – May 2025',
    description: [
      'PySpark/Databricks pipelines; engineered 40+ behavioural features',
      'Predictive churn (Random Forest) + K-Means segments for retention insights',
      'Geospatial analysis (Tableau heatmaps) → design decisions',
      'Integrated event-level data to track engagement evolution'
    ]
  },
  {
    title: 'Associate Consultant',
    company: 'Coalition Greenwich (CRISIL)',
    location: 'London',
    period: 'Jun 2024 – Aug 2024',
    description: [
      'Revenue forecasting uplift +13% via ML (Random Forest)',
      'Lagged variables + volatility indicators improved reliability',
      'Shifted team to quantitative framework; 500k-row ETL sped up −30% (Python/SQL)'
    ]
  },
  {
    title: 'Data Scientist',
    company: 'Pricerite Wholesalers',
    location: 'Eswatini',
    period: 'Jun 2022 – Jul 2023',
    description: [
      'RFM + K-Means segmentation; retention +10%',
      'Stock allocation guidance; saved ~£24k/yr, efficiency +25%'
    ]
  },
  {
    title: 'Data Scientist (Intern)',
    company: 'Pricerite Wholesalers',
    location: 'Eswatini',
    period: 'Jul 2021 – Sep 2021',
    description: [
      'SQL + EDA reporting → segmentation sharpened (conversions +5%)',
      'Competitor analysis informed changes → market share +7%'
    ]
  }
];

export default function Experience() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="experience" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Section Header */}
          <motion.div variants={slideVariants} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Work <span className="gradient-text">Experience</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Building data solutions across gaming, finance, and retail sectors
            </p>
          </motion.div>

          {/* Timeline */}
          <div className="relative max-w-4xl mx-auto">
            {/* Timeline Rail */}
            <div className="absolute left-6 md:left-1/2 md:transform md:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-border">
              <motion.div
                initial={{ height: 0 }}
                animate={isInView ? { height: '100%' } : { height: 0 }}
                transition={{ duration: 2 }}
                className="w-full bg-gradient-to-b from-primary to-accent-secondary"
              />
            </div>

            {/* Experience Cards */}
            <div className="space-y-12">
              {experiences.map((exp, index) => (
                <motion.div
                  key={index}
                  variants={slideVariants}
                  className={`relative flex items-center ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-6 md:left-1/2 md:transform md:-translate-x-1/2 w-4 h-4 bg-gradient-primary rounded-full border-4 border-background z-10" />

                  {/* Content */}
                  <div className={`ml-16 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
                    <motion.div
                      whileHover={{ scale: 1.05, y: -10, rotateY: 5 }}
                      whileTap={{ scale: 0.98 }}
                      className="glass p-8 rounded-2xl card-hover relative overflow-hidden"
                    >
                      {/* Animated background gradient */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent-secondary/5 opacity-0"
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      {/* Header */}
                      <div className="mb-6 relative z-10">
                        <motion.h3 
                          className="text-xl font-bold text-foreground mb-2"
                          whileHover={{ color: 'hsl(var(--primary))' }}
                          transition={{ duration: 0.3 }}
                        >
                          {exp.title}
                        </motion.h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <motion.div 
                            className="flex items-center gap-1"
                            whileHover={{ scale: 1.05 }}
                          >
                            <Building className="h-4 w-4" />
                            <span className="font-medium text-primary">{exp.company}</span>
                          </motion.div>
                          <motion.div 
                            className="flex items-center gap-1"
                            whileHover={{ scale: 1.05 }}
                          >
                            <MapPin className="h-4 w-4" />
                            <span>{exp.location}</span>
                          </motion.div>
                        </div>
                        <motion.div 
                          className="flex items-center gap-1 text-sm text-muted-foreground"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Calendar className="h-4 w-4" />
                          <span>{exp.period}</span>
                        </motion.div>
                      </div>

                      {/* Description */}
                      <ul className="space-y-3">
                        {exp.description.map((item, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                            transition={{
                              delay: 0.5 + index * 0.1 + i * 0.1,
                              duration: 0.5
                            }}
                            className="flex items-start gap-3 text-sm text-foreground/90"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <span>{item}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}