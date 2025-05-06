import React, { useRef, useEffect } from 'react';
import { PanelStock } from '../interfaces/PanelStock';
import { PanelCut } from '../interfaces/PanelCut';
import { PanelCuttingPlanLayout } from '../interfaces/PanelCuttingPlan';

interface PanelCuttingVisualizerProps {
  stock: PanelStock;
  cuts: PanelCut[];
  layout: PanelCuttingPlanLayout;
  unit: string;
}

const colors = [
  '#FFB6C1', '#FFD700', '#98FB98', '#87CEFA', '#DDA0DD',
  '#FFA07A', '#FFFACD', '#B0E0E6', '#F0E68C', '#E6E6FA'
];

const PanelCuttingVisualizer: React.FC<PanelCuttingVisualizerProps> = ({
  stock,
  cuts,
  layout,
  unit
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Calculate scaling factor to fit the panel on canvas
    const padding = 20;
    const canvasWidth = canvas.width - padding * 2;
    const canvasHeight = canvas.height - padding * 2;
    
    const scaleX = canvasWidth / stock.length;
    const scaleY = canvasHeight / stock.width;
    const scale = Math.min(scaleX, scaleY);
    
    const scaledWidth = stock.length * scale;
    const scaledHeight = stock.width * scale;
    const offsetX = padding + (canvasWidth - scaledWidth) / 2;
    const offsetY = padding + (canvasHeight - scaledHeight) / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the stock panel
    ctx.fillStyle = '#F5F5F5';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.fillRect(offsetX, offsetY, scaledWidth, scaledHeight);
    ctx.strokeRect(offsetX, offsetY, scaledWidth, scaledHeight);
    
    // Add stock dimensions text
    ctx.fillStyle = '#000000';
    ctx.font = '14px Arial';
    ctx.fillText(`${stock.length}${unit} × ${stock.width}${unit}`, offsetX + 5, offsetY + 20);
    
    // Draw the cuts
    layout.cuts.forEach((cutLayout, index) => {
      const cut = cuts.find(c => c.id === cutLayout.cutId);
      if (!cut) return;
      
      // Calculate dimensions based on rotation
      const cutWidth = cutLayout.rotated ? cut.width : cut.length;
      const cutHeight = cutLayout.rotated ? cut.length : cut.width;
      
      // Calculate position
      const cutX = offsetX + cutLayout.x * scale;
      const cutY = offsetY + cutLayout.y * scale;
      
      // Draw the cut rectangle
      ctx.fillStyle = colors[index % colors.length];
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.fillRect(cutX, cutY, cutWidth * scale, cutHeight * scale);
      ctx.strokeRect(cutX, cutY, cutWidth * scale, cutHeight * scale);
      
      // Add cut name and dimensions
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      const textX = cutX + (cutWidth * scale) / 2 - 40;
      const textY = cutY + (cutHeight * scale) / 2;
      ctx.fillText(cut.name, textX, textY);
      ctx.font = '10px Arial';
      ctx.fillText(`${cutWidth}${unit} × ${cutHeight}${unit}`, textX, textY + 15);
    });
    
    // Draw kerf lines
    const kerfSize = 2; // Saw blade width representation
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = kerfSize;
    ctx.setLineDash([5, 3]);
    
    // Horizontal kerf lines
    const processedY = new Set<number>();
    layout.cuts.forEach(cutLayout => {
      const cut = cuts.find(c => c.id === cutLayout.cutId);
      if (!cut) return;
      
      const cutHeight = cutLayout.rotated ? cut.length : cut.width;
      const y = cutLayout.y + cutHeight;
      
      if (!processedY.has(y) && y < stock.width) {
        processedY.add(y);
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + y * scale);
        ctx.lineTo(offsetX + scaledWidth, offsetY + y * scale);
        ctx.stroke();
      }
    });
    
    // Vertical kerf lines
    const processedX = new Set<number>();
    layout.cuts.forEach(cutLayout => {
      const cut = cuts.find(c => c.id === cutLayout.cutId);
      if (!cut) return;
      
      const cutWidth = cutLayout.rotated ? cut.width : cut.length;
      const x = cutLayout.x + cutWidth;
      
      if (!processedX.has(x) && x < stock.length) {
        processedX.add(x);
        ctx.beginPath();
        ctx.moveTo(offsetX + x * scale, offsetY);
        ctx.lineTo(offsetX + x * scale, offsetY + scaledHeight);
        ctx.stroke();
      }
    });
    
    // Reset line dash
    ctx.setLineDash([]);
    
  }, [stock, cuts, layout, unit]);

  return (
    <div className="panel-cutting-visualizer">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        style={{ 
          border: '1px solid #ccc',
          maxWidth: '100%',
          height: 'auto'
        }}
      />
    </div>
  );
};

export default PanelCuttingVisualizer;