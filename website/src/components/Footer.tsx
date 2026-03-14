import { Bot } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <a href="#" className="flex items-center gap-2 font-heading font-semibold">
        <Bot className="w-5 h-5 text-primary" />
        Nexora
      </a>
      <p className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} Nexora. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
