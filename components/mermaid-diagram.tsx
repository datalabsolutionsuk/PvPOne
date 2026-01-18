"use client";

import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";

const MermaidDiagram = ({ chart }: { chart: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      securityLevel: "loose",
      fontFamily: "inherit",
    });

    if (containerRef.current) {
      containerRef.current.innerHTML = chart;
      mermaid.run({
        nodes: [containerRef.current],
      });
    }
  }, [chart]);

  return <div ref={containerRef} className="overflow-x-auto p-4 bg-white rounded-lg border shadow-sm flex justify-center" />;
};

export default MermaidDiagram;
