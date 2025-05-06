import React, { useRef, useEffect, useState } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const PADDING = 30;
  const SCALE_FACTOR = .25;
  
  // Helper function to format dimensions based on the current unit
  const formatDimension = (value: number, dimension: 'length' | 'width'): string => {
    if (unit === 'in') {
      // We need to convert from mm to inches since all stored values are in mm
      const inchValue = convertFromMetric(value, 'in');
      return formatDimensionValue(inchValue, dimension, unit, false);
    }
    return `${Math.round(value)}`;
  };
  
  // Safe drawing function to handle canvas operations with error catching
  const drawSafely = (callback: (ctx: CanvasRenderingContext2D) => void): void => {
    try {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      callback(ctx);
    } catch (err) {
      console.error('Canvas drawing error:', err);
      setError('Error rendering visualization. Please try again.');
    }
  };
  
  useEffect(() => {
    // Reset error state on new render attempt
    setError(null);
    
    if (!canvasRef.current || !layout || !layout.placements || !stock) return;

    try {
      // Validate dimensions
      if (stock.width <= 0 || stock.length <= 0) {
        setError('Invalid stock dimensions');
        return;
      }
      
      // Set canvas dimensions with some safety boundaries
      const canvas = canvasRef.current;
      const maxWidth = Math.min(stock.width * SCALE_FACTOR + (PADDING * 2), 5000); // Cap at 5000px
      const maxHeight = Math.min(stock.length * SCALE_FACTOR + (PADDING * 2), 5000);
      
      canvas.width = maxWidth;
      canvas.height = maxHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Could not initialize canvas context');
        return;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the stock panel
      drawSafely(ctx => {
        ctx.fillStyle = '#EEEEEE';
        ctx.fillRect(PADDING, PADDING, stock.width * SCALE_FACTOR, stock.length * SCALE_FACTOR);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(PADDING, PADDING, stock.width * SCALE_FACTOR, stock.length * SCALE_FACTOR);
      });
      
      // Draw each cut piece
      layout.placements.forEach((placement, index) => {
        const cut = cuts.find(c => c.id === placement.cutId);
        if (!cut) return;
        
        drawSafely(ctx => {
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
        });
        
        // Draw labels separately to avoid cascading errors
        drawSafely(ctx => {
          // Draw label with properly converted dimensions
          ctx.fillStyle = '#000000';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          const labelX = PADDING + placement.x * SCALE_FACTOR + (cut.width * SCALE_FACTOR / 2);
          const labelY = PADDING + placement.y * SCALE_FACTOR + (cut.length * SCALE_FACTOR / 2);
          
          // Verify position is within canvas bounds
          if (labelX > 0 && labelX < canvas.width && labelY > 0 && labelY < canvas.height) {
            ctx.fillText(
              `${formatDimension(cut.width, 'width')}×${formatDimension(cut.length, 'length')} ${unit}`,
              labelX,
              labelY
            );
            
            // Add cut name if available
            if (cut.name) {
              ctx.font = '10px Arial';
              ctx.fillText(
                cut.name,
                labelX,
                labelY + 15
              );
            }
          }
        });
      });
      
      // Draw kerf lines
      drawSafely(ctx => {
        const kerfSize = 2;
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
      });
      
      // Draw waste percentage if available
      drawSafely(ctx => {
        if (layout.wastePercentage !== undefined) {
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'left';
          console.log('Waste percentage:', layout.wastePercentage);
          ctx.fillText(
            `Waste: ${Math.round(layout.wastePercentage)}%`,
            PADDING,
            canvas.height - PADDING / 2
          );
        }
      });
    } catch (err) {
      console.error('Error in canvas rendering:', err);
      setError('Failed to render visualization');
    }
  }, [stock, cuts, layout, unit]);

  return (
    <div className="panel-cutting-visualizer">
      {error && (
        <div style={{ color: 'red', padding: '10px', marginBottom: '10px', backgroundColor: '#ffeeee', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      <canvas 
        ref={canvasRef} 
        width={1200} 
        height={800} 
        style={{ 
          border: '1px solid #ccc',
          maxWidth: '100%',
          height: 'auto',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          margin: '1rem 0'
        }}
      />
    </div>
  );
};

export default PanelCuttingVisualizer;