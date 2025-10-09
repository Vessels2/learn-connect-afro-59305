import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  GraduationCap, 
  Globe, 
  BookOpen, 
  Users, 
  Award,
  Smartphone,
  Languages,
  Brain,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import heroImage from "@/assets/hero-education.jpg";

export default function Index() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.9), rgba(139, 92, 246, 0.9)), url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Education in Every Pocket
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              AI-powered learning platform designed for African students. 
              Accessible offline, supports local languages, and delivers quality education everywhere.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?signup=true">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                  Start Learning Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white/10 text-white border-white hover:bg-white hover:text-primary">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why We're Different</h2>
            <p className="text-xl text-muted-foreground">
              Plagiarism-free, quality content tailored for African learners
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="rounded-full w-16 h-16 bg-primary/10 flex items-center justify-center mb-4">
                  <Smartphone className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Offline First</h3>
                <p className="text-muted-foreground">
                  Download lessons and learn anytime, anywhere - even without internet connection.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="rounded-full w-16 h-16 bg-secondary/10 flex items-center justify-center mb-4">
                  <Languages className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Local Languages</h3>
                <p className="text-muted-foreground">
                  Support for English, Hausa, Igbo, Yoruba, Pidgin, and more African languages.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="rounded-full w-16 h-16 bg-accent/10 flex items-center justify-center mb-4">
                  <Brain className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI-Powered</h3>
                <p className="text-muted-foreground">
                  Personalized learning paths, instant feedback, and adaptive assessments.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="rounded-full w-16 h-16 bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Quality Content</h3>
                <p className="text-muted-foreground">
                  Original, plagiarism-free educational content aligned with local curricula.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="rounded-full w-16 h-16 bg-secondary/10 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Teacher Tools</h3>
                <p className="text-muted-foreground">
                  Powerful dashboard with analytics, auto-grading, and student management.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent transition-all hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="rounded-full w-16 h-16 bg-accent/10 flex items-center justify-center mb-4">
                  <Award className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">Progress Tracking</h3>
                <p className="text-muted-foreground">
                  Real-time analytics and detailed reports for students and parents.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-accent to-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of students and teachers already using EduAI for better education
          </p>
          <Link to="/auth?signup=true">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Get Started Now - It's Free
              <GraduationCap className="ml-2 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-bold text-primary">EduAI</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Education in Every Pocket - Empowering African learners
            </p>
            <Link to="/contact">
              <Button variant="link">Contact Creator</Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
