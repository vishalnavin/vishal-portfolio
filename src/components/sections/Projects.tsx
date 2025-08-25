import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { ExternalLink, Github, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { containerVariants, itemVariants } from '@/components/common/AnimationVariants';

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  repoUrl: string;
  caseStudyUrl?: string;
  tech: string[];
  featured: boolean;
}

const projects: Project[] = [
  {
    id: 'airbnb-analysis',
    title: 'Airbnb Analysis',
    description: 'Predicted prices from location & reviews; neighbourhood insights.',
    image: '/project-1.png',
    repoUrl: 'https://github.com/vishalnavin/airbnb-analysis',
    tech: ['Python', 'PySpark', 'Tableau'],
    featured: true
  },
  {
    id: 'clickstream-consumer-insights',
    title: 'Clickstream Consumer Insights',
    description: 'Mapped drop-offs to improve retention and funnel flow.',
    image: '/project-2.png',
    repoUrl: 'https://github.com/vishalnavin/clickstream-consumer-insights',
    tech: ['Python', 'SQL', 'Tableau'],
    featured: true
  },
  {
    id: 'cfpb-complaint-analysis',
    title: 'CFPB Complaint Analysis',
    description: 'NLP on complaints to surface drivers and forecast severity.',
    image: '/project-3.png',
    repoUrl: 'https://github.com/vishalnavin/cfpb-complaint-analysis',
    tech: ['Python', 'NLP', 'Machine Learning'],
    featured: true
  },
  {
    id: 'heatsmart-orkney',
    title: 'HeatSmart Orkney',
    description: 'Modelled home-heating scenarios and policy impact.',
    image: '/project-4.png',
    repoUrl: 'https://github.com/vishalnavin/heatsmart-orkney',
    tech: ['Python', 'Geospatial', 'Modelling'],
    featured: true
  },
  {
    id: 'tab',
    title: 'TAB (Tabular ML Workflow)',
    description: 'Lightweight tabular ML workflow for faster experiments.',
    image: '/project-5.png',
    repoUrl: 'https://github.com/vishalnavin/tab',
    tech: ['Python', 'ML', 'Workflow'],
    featured: true
  },
  {
    id: 'portfolio-website',
    title: 'Portfolio Website',
    description: 'React/Tailwind site showcasing projects and articles.',
    image: '/project-6.png',
    repoUrl: 'https://github.com/vishalnavin/portfolio-website',
    tech: ['React', 'TypeScript', 'Tailwind'],
    featured: true
  },
  {
    id: 'breakfast-at-the-frat',
    title: 'Breakfast at the Frat',
    description: 'Playful visualisation of breakfast trends and habits.',
    image: '/project-7.png',
    repoUrl: 'https://github.com/vishalnavin/breakfast-at-the-frat',
    tech: ['Python', 'Visualisation', 'Data Analysis'],
    featured: false
  },
  {
    id: 'space-invaders',
    title: 'Space Invaders Game',
    description: 'Retro clone demonstrating core game-loop logic.',
    image: '/project-8.png',
    repoUrl: 'https://github.com/vishalnavin/space-invaders',
    tech: ['Python', 'Game Development', 'Logic'],
    featured: false
  }
];

export default function Projects() {
  const [showAllProjects, setShowAllProjects] = useState(false);

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const featuredProjects = projects.filter(p => p.featured);
  const displayedProjects = showAllProjects ? projects : featuredProjects;

  const handleShowMore = () => {
    setShowAllProjects(true);
  };

  const handleShowFewer = () => {
    setShowAllProjects(false);
  };



  return (
    <section id="projects" className="py-24 bg-secondary/20">
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
              {showAllProjects ? 'All' : 'Featured'} <span className="gradient-text">Projects</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Data science projects showcasing ML, analytics, and visualization skills
            </p>
          </motion.div>

          {/* Projects Grid */}
          <motion.div
            layout
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
          >
            {displayedProjects.map((project, index) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  duration: 0.4,
                  ease: "easeInOut"
                }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <div className="glass p-6 rounded-2xl h-full card-hover group-hover:glow relative overflow-hidden">
                  {/* Project Image */}
                  <div className="w-full h-32 rounded-lg mb-4 overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Project Header */}
                  <div className="mb-4">
                    <h3 className="font-bold text-lg group-hover:gradient-text transition-all duration-300 line-clamp-1">
                      {project.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tech.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.tech.length > 3 && (
                      <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                        +{project.tech.length - 3}
                      </span>
                    )}
                  </div>

                  {/* CTAs */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      asChild
                    >
                      <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                        <Github className="mr-2 h-3 w-3" />
                        View Repo
                      </a>
                    </Button>
                    {project.caseStudyUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a href={project.caseStudyUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-3 w-3" />
                          Case Study
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Show More/Fewer Button */}
          <motion.div variants={itemVariants} className="text-center mt-12">
            {showAllProjects ? (
              <motion.div
                key="show-fewer"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ 
                  duration: 0.4,
                  ease: "easeInOut"
                }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleShowFewer}
                  className="magnetic hover:bg-secondary/50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  <motion.div
                    animate={{ rotate: 180 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronUp className="mr-2 h-4 w-4" />
                  </motion.div>
                  Show fewer projects
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="show-more"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ 
                  duration: 0.4,
                  ease: "easeInOut"
                }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleShowMore}
                  className="magnetic hover:bg-secondary/50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  <motion.div
                    animate={{ rotate: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="mr-2 h-4 w-4" />
                  </motion.div>
                  Show more projects
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* View All GitHub Button */}
          <motion.div variants={itemVariants} className="text-center mt-8">
            <Button
              variant="outline"
              size="lg"
              className="magnetic"
              asChild
            >
              <a
                href="https://github.com/vishalnavin"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                View all on GitHub
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}