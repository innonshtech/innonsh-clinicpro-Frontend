import { useState } from 'react';
import { Calendar, User, ArrowRight, Heart, Brain, Activity } from 'lucide-react';

const Articles = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const articles = [
    {
      id: 1,
      title: "AI-Powered Diagnostics: Revolutionizing Patient Care",
      excerpt: "Discover how artificial intelligence is transforming medical diagnostics and improving patient outcomes in modern healthcare facilities.",
      author: "Dr. Sarah Johnson",
      date: "May 28, 2025",
      readTime: "5 min read",
      category: "Technology",
      icon: <Brain className="w-6 h-6" />,
      gradient: "from-blue-500 to-purple-600"
    },
    {
      id: 2,
      title: "Telemedicine Best Practices for Clinics",
      excerpt: "Essential guidelines and strategies for implementing successful telemedicine programs in your healthcare practice.",
      author: "Dr. Michael Chen",
      date: "May 25, 2025",
      readTime: "7 min read",
      category: "Digital Health",
      icon: <Activity className="w-6 h-6" />,
      gradient: "from-emerald-500 to-teal-600"
    },
    {
      id: 3,
      title: "Patient Experience: The New Healthcare Priority",
      excerpt: "Learn how focusing on patient experience can improve satisfaction scores and build lasting relationships with your patients.",
      author: "Dr. Emily Rodriguez",
      date: "May 22, 2025",
      readTime: "6 min read",
      category: "Patient Care",
      icon: <Heart className="w-6 h-6" />,
      gradient: "from-pink-500 to-rose-600"
    }
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-200/50 mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-700">Expert Insights</span>
          </div>
          
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent leading-tight">
            Read Top Articles from
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Health Experts
            </span>
          </h2>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Stay ahead with cutting-edge insights from leading healthcare professionals. 
            Discover the latest trends, technologies, and best practices shaping modern medicine.
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 mb-12">
          {articles.map((article, index) => (
            <article
              key={article.id}
              className={`group cursor-pointer transition-all duration-500 ${
                hoveredCard === article.id ? 'scale-105' : ''
              }`}
              onMouseEnter={() => setHoveredCard(article.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/50 h-full">
                {/* Article Image/Icon */}
                <div className={`h-48 bg-gradient-to-br ${article.gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white transform group-hover:scale-110 transition-transform duration-300">
                      {article.icon}
                    </div>
                  </div>
                  
                  {/* Floating elements */}
                  <div className="absolute top-4 right-4">
                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium">
                      {article.category}
                    </span>
                  </div>
                  
                  {/* Animated particles */}
                  <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
                  <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>
                </div>

                {/* Article Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                    {article.title}
                  </h3>
                  
                  <p className="text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>

                  {/* Meta Information */}
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{article.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{article.date}</span>
                      </div>
                    </div>
                    <span className="text-blue-600 font-medium">{article.readTime}</span>
                  </div>

                  {/* Read More Button */}
                  <div className="flex items-center justify-between">
                    <button className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all duration-300">
                      Read Article
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/50 shadow-lg">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Want to stay updated with the latest healthcare insights?
            </h3>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Join thousands of healthcare professionals who trust Practo for the latest industry news, 
              expert opinions, and breakthrough research.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105">
                View All Articles
              </button>
              <button className="text-blue-600 font-semibold px-8 py-3 rounded-full border-2 border-blue-200 hover:bg-blue-50 transition-all duration-300">
                Subscribe to Newsletter
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Articles;
