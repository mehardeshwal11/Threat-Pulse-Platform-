import React, { useEffect, useRef } from 'react';

export default function ThreatRadar({ criticalCount = 69, highCount = 211, totalCount = 2861 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let angle = 0;

    // Generate simulated threat blips based on actual count
    const blips = [];
    const numBlips = Math.min(24, Math.max(8, Math.floor(criticalCount / 3)));
    for (let i = 0; i < numBlips; i++) {
      const dist = 30 + Math.random() * 110;
      const blipAngle = Math.random() * Math.PI * 2;
      blips.push({
        x: Math.cos(blipAngle) * dist,
        y: Math.sin(blipAngle) * dist,
        dist,
        angle: blipAngle,
        isCritical: i % 2 === 0,
        intensity: 0.5 + Math.random() * 0.5,
        pulse: Math.random() * Math.PI
      });
    }

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = 135;

      ctx.clearRect(0, 0, width, height);

      // Radar concentric rings
      [35, 70, 105, 135].forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.strokeStyle = idx === 3 ? 'rgba(234, 179, 8, 0.4)' : 'rgba(234, 179, 8, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX - maxRadius, centerY);
      ctx.lineTo(centerX + maxRadius, centerY);
      ctx.moveTo(centerX, centerY - maxRadius);
      ctx.lineTo(centerX, centerY + maxRadius);
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.15)';
      ctx.stroke();

      // Sweeping beam
      angle += 0.025;
      const sweepGradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, maxRadius);
      sweepGradient.addColorStop(0, 'rgba(234, 179, 8, 0.35)');
      sweepGradient.addColorStop(1, 'rgba(234, 179, 8, 0.0)');

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, maxRadius, 0, Math.PI * 0.35);
      ctx.lineTo(0, 0);
      ctx.fillStyle = sweepGradient;
      ctx.fill();

      // Sweeping lead line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(maxRadius, 0);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Draw threat blips
      blips.forEach(blip => {
        blip.pulse += 0.05;
        const normalizedSweepAngle = (angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const normalizedBlipAngle = (blip.angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        let diff = normalizedSweepAngle - normalizedBlipAngle;
        if (diff < 0) diff += Math.PI * 2;

        let alpha = 0.2;
        if (diff < Math.PI * 0.5) {
          alpha = 1 - (diff / (Math.PI * 0.5));
        }

        const bx = centerX + blip.x;
        const by = centerY + blip.y;

        ctx.beginPath();
        const radius = blip.isCritical ? 3.5 : 2.5;
        ctx.arc(bx, by, radius, 0, Math.PI * 2);
        ctx.fillStyle = blip.isCritical 
          ? `rgba(239, 68, 68, ${Math.max(0.3, alpha)})` 
          : `rgba(234, 179, 8, ${Math.max(0.2, alpha)})`;
        ctx.fill();

        if (alpha > 0.6) {
          ctx.beginPath();
          ctx.arc(bx, by, radius + (1 - alpha) * 8, 0, Math.PI * 2);
          ctx.strokeStyle = blip.isCritical ? 'rgba(239, 68, 68, 0.5)' : 'rgba(234, 179, 8, 0.5)';
          ctx.stroke();
        }
      });

      // Center emitter
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#eab308';
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [criticalCount, highCount, totalCount]);

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      <div className="relative w-[300px] h-[300px] rounded-full bg-black/80 border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.15)] flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} width={300} height={300} className="w-full h-full block" />
        <div className="absolute inset-0 pointer-events-none rounded-full border border-yellow-500/20" />
      </div>
      <div className="flex items-center gap-6 mt-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-gray-300">CRITICAL ({criticalCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span className="text-gray-300">HIGH ({highCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-gray-300">TOTAL ({totalCount.toLocaleString()})</span>
        </div>
      </div>
    </div>
  );
}
