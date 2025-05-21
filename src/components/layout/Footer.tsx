
import React from "react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t py-6 bg-background mt-auto">
      <div className="container flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <img src="/lovable-uploads/d1df28cb-f0ae-4b17-aacf-f7e08d48d146.png" alt="MSLab Logo" className="h-5 w-5" />
          <span>MSLab Scheduler</span>
        </div>
        <p>&copy; {currentYear} MSLab Scheduler. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
