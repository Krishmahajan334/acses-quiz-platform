export function PageBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-background">
      {/* Radial Glow */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-primary/5 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vh] bg-primary/5 rounded-full blur-[100px] mix-blend-screen opacity-50"></div>
      
      {/* Technical Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 40%, transparent 100%)'
        }}
      ></div>
      
      {/* Very subtle scanlines */}
      <div 
        className="absolute inset-0 opacity-[0.01]" 
        style={{
          backgroundImage: 'linear-gradient(to bottom, transparent 50%, rgba(255, 255, 255, 1) 50%)',
          backgroundSize: '100% 4px'
        }}
      ></div>
    </div>
  );
}
