import React from 'react';

// Test component to verify color tokens work correctly
export default function ColorTokenTest() {
  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold mb-6">Color Tokens Test</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <div className="w-full h-20 bg-brand-primary rounded border border-border"></div>
          <p className="text-sm font-mono">brand-primary</p>
          <p className="text-xs text-muted-foreground">#E8DED2</p>
        </div>
        
        <div className="space-y-2">
          <div className="w-full h-20 bg-brand-accent rounded border border-border"></div>
          <p className="text-sm font-mono">brand-accent</p>
          <p className="text-xs text-muted-foreground">#C8205B</p>
        </div>
        
        <div className="space-y-2">
          <div className="w-full h-20 bg-brand-secondary rounded border border-border"></div>
          <p className="text-sm font-mono">brand-secondary</p>
          <p className="text-xs text-muted-foreground">#555521</p>
        </div>
        
        <div className="space-y-2">
          <div className="w-full h-20 bg-warning rounded border border-border"></div>
          <p className="text-sm font-mono">warning</p>
          <p className="text-xs text-muted-foreground">#C1B103</p>
        </div>
        
        <div className="space-y-2">
          <div className="w-full h-20 bg-info rounded border border-border"></div>
          <p className="text-sm font-mono">info</p>
          <p className="text-xs text-muted-foreground">#B26B30</p>
        </div>
        
        <div className="space-y-2">
          <div className="w-full h-20 bg-sky rounded border border-border"></div>
          <p className="text-sm font-mono">sky</p>
          <p className="text-xs text-muted-foreground">#669EBA</p>
        </div>
        
        <div className="space-y-2">
          <div className="w-full h-20 bg-text-strong rounded border border-border"></div>
          <p className="text-sm font-mono">text-strong</p>
          <p className="text-xs text-muted-foreground">#222222</p>
        </div>
      </div>
      
      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-semibold">Text Color Tests</h3>
        <p className="text-brand-primary">Text with brand-primary color</p>
        <p className="text-brand-accent">Text with brand-accent color</p>
        <p className="text-brand-secondary">Text with brand-secondary color</p>
        <p className="text-warning">Text with warning color</p>
        <p className="text-info">Text with info color</p>
        <p className="text-sky">Text with sky color</p>
        <p className="text-text-strong">Text with text-strong color</p>
      </div>
      
      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-semibold">Border Color Tests</h3>
        <div className="border-2 border-brand-primary p-4 rounded">Border brand-primary</div>
        <div className="border-2 border-brand-accent p-4 rounded">Border brand-accent</div>
        <div className="border-2 border-warning p-4 rounded">Border warning</div>
      </div>
    </div>
  );
}