import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full py-6 mt-auto border-t border-border bg-background/50 backdrop-blur-sm print:hidden">
      <div className="container mx-auto px-4 flex flex-col items-center justify-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs md:text-sm text-muted-foreground font-medium text-center">
          <span>Designed & developed by Sorin Tech Lab, a unit of</span>
          <Link 
            href="https://krishmahajan.dev" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-primary transition-colors group mx-1"
          >
            <span className="font-semibold underline decoration-transparent group-hover:decoration-primary underline-offset-2 transition-all">Krish Tech Labs</span>
            <Image 
              src="/watermark_logo_light.png" 
              alt="Krish Techlabs Logo" 
              width={20} 
              height={20} 
              className="object-contain opacity-70 group-hover:opacity-100 transition-opacity"
            />
          </Link>
        </div>
        
        <p className="text-[10px] md:text-xs text-muted-foreground/70 text-center font-medium">
          This platform is the property of Sorin Tech Lab.
        </p>
      </div>
    </footer>
  );
}
