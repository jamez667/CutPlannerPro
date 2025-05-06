import React, { useRef, useEffect } from 'react';
import { PanelStock } from '../interfaces/PanelStock';
import { PanelPiece } from '../interfaces/PanelPiece';
import { PanelCuttingPlanLayout } from '../interfaces/PanelCuttingPlan';
import { convertFromMetric } from '../utils/unitConversion';
import { formatDimensionValue } from '../utils/formatters';

interface PanelCuttingVisualizerProps {
  stock: PanelStock;
  cuts: PanelPiece[];
  layout: PanelCuttingPlanLayout;
  unit: string;
}

const colors = [
  '#FFB6C1', '#FFD700', '#98FB98', '#87CEFA', '#DDA0DD',
  '#FFA07A', '#FFFACD', '#B0E0E6', '#F0E68C', '#E6E6FA'
];

const PanelCuttingVisualizer: React.FC<PanelCuttingVisualizerProps> = ({ stock, cuts, layout, unit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const PADDING = 20;
  const SCALE_FACTOR = 10; // Adjust to fit the canvas
  
  // Helper function to format dimensions based on the current unit
  const formatDimension = (value: number, dimension: 'length' | 'width'): string => {
    if (unit === 'in') {
      // We need to convert from mm to inches since all stored values are in mm
      const inchValue = convertFromMetric(value, 'in');
      return formatDimensionValue(inchValue, dimension, unit, false);
    }
    return `${Math.round(value)}`;
  };
  
  useEffect(() => {
    if (!canvasRef.current || !layout || !layout.placements) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on stock dimensions
    canvas.width = stock.width * SCALE_FACTOR + (PADDING * 2);
    canvas.height = stock.length * SCALE_FACTOR + (PADDING * 2);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the stock panel
    ctx.fillStyle = '#EEEEEE';
    ctx.fillRect(PADDING, PADDING, stock.width * SCALE_FACTOR, stock.length * SCALE_FACTOR);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(PADDING, PADDING, stock.width * SCALE_FACTOR, stock.length * SCALE_FACTOR);
    
    // Draw each cut piece
    layout.placements.forEach((placement, index) => {
      const cut = cuts.find(c => c.id === placement.cutId);
      if (!cut) return;
      
      const colorIndex = index % colors.length;
      ctx.fillStyle = colors[colorIndex];
      ctx.fillRect(
        PADDING + placement.x * SCALE_FACTOR, 
        PADDING + placement.y * SCALE_FACTOR, 
        cut.width * SCALE_FACTOR, 
        cut.length * SCALE_FACTOR
      );
      
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        PADDING + placement.x * SCALE_FACTOR, 
        PADDING + placement.y * SCALE_FACTOR, 
        cut.width * SCALE_FACTOR, 
        cut.length * SCALE_FACTOR
      );
      
      // Draw label with properly converted dimensions
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${formatDimension(cut.width, 'width')}×${formatDimension(cut.length, 'length')} ${unit}`,
        PADDING + placement.x * SCALE_FACTOR + (cut.width * SCALE_FACTOR / 2),
        PADDING + placement.y * SCALE_FACTOR + (cut.length * SCALE_FACTOR / 2)
      );
      
      // Add cut name if available
      if (cut.name) {
        ctx.font = '10px Arial';
        ctx.fillText(
          cut.name,
          PADDING + placement.x * SCALE_FACTOR + (cut.width * SCALE_FACTOR / 2),
          PADDING + placement.y * SCALE_FACTOR + (cut.length * SCALE_FACTOR / 2) + 15
        );
      }
    });
    
    // Draw kerf lines
    const kerfSize = 2; // Saw blade width representation
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = kerfSize;
    ctx.setLineDash([5, 3]);
    
    // Horizontal kerf lines
    const processedY = new Set<number>();
    layout.placements.forEach(placement => {
      const cut = cuts.find(c => c.id === placement.cutId);
      if (!cut) return;
      
      const y = placement.y + cut.length;
      
      if (!processedY.has(y) && y < stock.length) {
        processedY.add(y);
        ctx.beginPath();
        ctx.moveTo(PADDING, PADDING + y * SCALE_FACTOR);
        ctx.lineTo(PADDING + stock.width * SCALE_FACTOR, PADDING + y * SCALE_FACTOR);
        ctx.stroke();
      }
    });
    
    // Vertical kerf lines
    const processedX = new Set<number>();
    layout.placements.forEach(placement => {
      const cut = cuts.find(c => c.id === placement.cutId);
      if (!cut) return;
      
      const x = placement.x + cut.width;
      
      if (!processedX.has(x) && x < stock.width) {
        processedX.add(x);
        ctx.beginPath();
        ctx.moveTo(PADDING + x * SCALE_FACTOR, PADDING);
        ctx.lineTo(PADDING + x * SCALE_FACTOR, PADDING + stock.length * SCALE_FACTOR);
        ctx.stroke();
      }
    });
    
    // Reset line dash
    ctx.setLineDash([]);
    
    // Draw waste percentage if available
    if (layout.wastePercentage !== undefined) {
      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(
        `Waste: ${Math.round(layout.wastePercentage * 100)}%`,
        PADDING,
        canvas.height - PADDING / 2
      );
    }
    
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