import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
          <GraduationCap className="h-8 w-8" />
          <span>EduAI</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/auth?signup=true">
            <Button variant="hero">Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
