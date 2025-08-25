import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ExternalLink, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { containerVariants, itemVariants } from '@/components/common/AnimationVariants';

const articles = [
  {
    title: "Vibe Coding Won't Kill Analysts, It'll Expose Average Analysis",
    excerpt: "Exploring how AI coding tools are reshaping the analytics landscape and what this means for data professionals.",
    readTime: "5 min read",
    year: "2024",
    url: "https://medium.com/@vishalnavin_32974/vibe-coding-wont-kill-analysts-it-ll-expose-average-analysis-29825f48e5d8"
  }
];

export default function Articles() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="articles" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Writing on <span className="gradient-text">Data, AI & Analytics</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Occasional essays where I share ideas and lessons from my work in data science and analytics.
            </p>
          </motion.div>

          {/* Articles Grid */}
          <motion.div variants={itemVariants} className="max-w-4xl mx-auto mb-12">
            <div className={`grid gap-6 ${articles.length === 1 ? 'md:grid-cols-1 max-w-2xl mx-auto' : 'md:grid-cols-2'}`}>
              {articles.map((article, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="group cursor-pointer"
                  onClick={() => window.open(article.url, '_blank')}
                >
                  <div className="glass p-4 md:p-6 rounded-2xl card-hover relative overflow-hidden">
                    {/* Article Content */}
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <h3 className="text-xl font-bold group-hover:gradient-text transition-all duration-300 flex-1 pr-4">
                          {article.title}
                        </h3>
                        {/* Latest Badge for single article */}
                        {articles.length === 1 && (
                          <span className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full flex-shrink-0">
                            Latest
                          </span>
                        )}
                      </div>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        {article.excerpt}
                      </p>
                      
                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{article.readTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{article.year}</span>
                        </div>
                      </div>
                      
                      {/* External Link Icon */}
                      <div className="flex justify-end">
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div variants={itemVariants} className="text-center">
            <Button
              variant="outline"
              size="lg"
              className="magnetic"
              onClick={() => window.open('https://medium.com/@vishalnavin_32974', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View My Medium Profile
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
