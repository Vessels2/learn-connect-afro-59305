import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github, Twitter, Facebook, Phone, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      <header className="bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">EduAI</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About the Creator</h1>
          <p className="text-xl text-muted-foreground">
            Built with passion for accessible education
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Solomon Israel Maichibi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Background</h3>
              <p className="text-muted-foreground">
                Passionate about leveraging technology to make quality education accessible 
                to everyone, especially in underserved communities across Africa. With a 
                focus on creating innovative solutions that work offline and support local 
                languages, I believe that education should be available in every pocket.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Mission</h3>
              <p className="text-muted-foreground">
                To democratize education by building platforms that are:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Accessible offline</li>
                <li>Supporting local African languages</li>
                <li>Providing plagiarism-free, quality content</li>
                <li>Empowering both teachers and students</li>
                <li>Affordable and scalable</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Connect With Me</h3>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="https://wa.me/2349037940733" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2">
                    <Phone className="h-4 w-4" />
                    WhatsApp: +234 903 794 0733
                  </Button>
                </a>
                
                <a 
                  href="https://github.com/IsraelVessel" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2">
                    <Github className="h-4 w-4" />
                    GitHub: Israel Vessel
                  </Button>
                </a>
                
                <a 
                  href="https://twitter.com/IsraelVessel" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2">
                    <Twitter className="h-4 w-4" />
                    X (Twitter): Israel Vessel
                  </Button>
                </a>
                
                <a 
                  href="https://facebook.com/solomon.israel.maichibi" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2">
                    <Facebook className="h-4 w-4" />
                    Facebook: Solomon Israel Maichibi
                  </Button>
                </a>
              </div>
            </div>

            <div className="pt-6 border-t">
              <p className="text-center text-sm text-muted-foreground italic">
                "Education in Every Pocket - Because quality learning should know no boundaries"
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link to="/dashboard">
            <Button variant="hero" size="lg">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
