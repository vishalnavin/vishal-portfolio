import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import Tilt from 'react-parallax-tilt';
import { ExternalLink, Github, Star, GitFork } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { containerVariants, itemVariants } from '@/components/common/AnimationVariants';

interface GitHubRepo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  homepage?: string;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  language: string;
  updated_at: string;
}

// Custom project descriptions
const projectDescriptions: { [key: string]: string } = {
  'project': 'Core analytics & ML demo.',
  'airbnb-analysis': 'Pricing and location insights.',
  'clickstream-consumer-insights': 'Customer journey patterns from clicks.',
  'spaceinvaders-game': 'Retro Space Invaders clone.',
  'heatsmart-orkney': 'Smart heating & renewables modelling.',
  'cfpb-complaint-analysis': 'Complaint trends and sentiment.',
  'breakfast-at-the-frat': 'Breakfast data, playful visuals.',
  'tab': 'Tabular transforms & ML workflow.',
  // Fallback descriptions for other projects
  'default': 'Data science project focusing on practical ML applications and analytics.'
};

export default function Projects() {
  const [projects, setProjects] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    const fetchGitHubProjects = async () => {
      try {
        const response = await fetch('https://api.github.com/users/vishalnavin/repos?sort=updated&per_page=50');
        const repos = await response.json();
        
        // Filter out forks and select top repos by stars and recent activity
        const filteredRepos = repos
          .filter((repo: GitHubRepo) => !repo.name.includes('fork'))
          .sort((a: GitHubRepo, b: GitHubRepo) => {
            // Sort by stars and recent updates
            const aScore = a.stargazers_count * 2 + (new Date(a.updated_at).getTime() / 1000000000);
            const bScore = b.stargazers_count * 2 + (new Date(b.updated_at).getTime() / 1000000000);
            return bScore - aScore;
          })
          .slice(0, 8);

        setProjects(filteredRepos);
      } catch (error) {
        console.error('Error fetching GitHub projects:', error);
        // Fallback projects if API fails
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubProjects();
  }, []);



  return (
    <section id="projects" className="py-24">
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
              Featured <span className="gradient-text">Projects</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Data science projects showcasing ML, analytics, and visualization skills
            </p>
          </motion.div>



          {/* Projects Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass p-6 rounded-2xl animate-pulse">
                  <div className="h-4 bg-muted rounded mb-4" />
                  <div className="h-3 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              layout
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  layout
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="group cursor-pointer"
                  onClick={() => window.open(project.html_url, '_blank')}
                >
                  <Tilt
                    tiltMaxAngleX={5}
                    tiltMaxAngleY={5}
                    scale={1.02}
                    transitionSpeed={300}
                  >
                    <div className="glass p-6 rounded-2xl h-full card-hover group-hover:glow relative overflow-hidden">
                      {/* Project Image */}
                      <div className="w-full h-32 rounded-lg mb-4 overflow-hidden">
                        <img
                          src={`/project-${(index % 8) + 1}.png`}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                                              {/* Project Header */}
                        <div className="mb-4">
                          <h3 className="font-bold text-lg group-hover:gradient-text transition-all duration-300">
                            {project.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h3>
                        </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {projectDescriptions[project.name.toLowerCase()] || projectDescriptions['default']}
                      </p>

                      {/* Topics */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.topics.slice(0, 3).map((topic) => (
                          <span
                            key={topic}
                            className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
                          >
                            {topic}
                          </span>
                        ))}
                        {project.language && (
                          <span className="px-2 py-1 text-xs rounded-full bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20">
                            {project.language}
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          <span>{project.stargazers_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GitFork className="h-3 w-3" />
                          <span>{project.forks_count}</span>
                        </div>
                      </div>
                    </div>
                  </Tilt>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* View All GitHub Button */}
          <motion.div variants={itemVariants} className="text-center mt-12">
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
                View All on GitHub
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}