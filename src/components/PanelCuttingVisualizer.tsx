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
  const [scaleFactor, setScaleFactor] = useState(1);
  
  console.log('PanelCuttingVisualizer rendered with props:', { 
    stock: stock ? { width: stock.width, length: stock.length } : 'missing', 
    cuts: cuts?.length || 0, 
    layout: layout ? 'exists' : 'missing',
    layoutPlacements: layout?.placements ? `${layout.placements.length} placements` : 'no placements'
  });

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
    console.log('useEffect triggered', { 
      canvasExists: !!canvasRef.current, 
      layoutExists: !!layout, 
      placementsExist: !!layout?.placements, 
      stockExists: !!stock 
    });
    
    if (!canvasRef.current || !layout || !layout.placements || !stock) {
      console.log('Early return condition met:', {
        canvasRef: !!canvasRef.current,
        layout: !!layout,
        placements: !!layout?.placements,
        stock: !!stock
      });
      return;
    }

    try {
      // Validate dimensions
      if (stock.width <= 0 || stock.length <= 0) {
        setError('Invalid stock dimensions');
        return;
      }
      
      // Set canvas dimensions with some safety boundaries
      const canvas = canvasRef.current;
      
      // Calculate a dynamic scale factor based on the available space
      const targetWidth = 800; // Target width in pixels
      const targetHeight = 600; // Target height in pixels
      
      // Calculate scale based on the larger dimension to maintain aspect ratio
      const widthScale = (targetWidth - PADDING * 2) / stock.width;
      const heightScale = (targetHeight - PADDING * 2) / stock.length;
      const calculatedScale = Math.min(widthScale, heightScale, 10); // Cap at 10x for very small panels
      
      // Set and store the scale factor
      const newScaleFactor = Math.max(calculatedScale, 0.1); // Ensure minimum visibility
      setScaleFactor(newScaleFactor);
      console.log('Dynamic scale factor:', newScaleFactor);
      
      // Apply the scale factor to canvas dimensions
      const maxWidth = Math.min(stock.length * newScaleFactor + (PADDING * 2), 5000); // Cap at 5000px
      const maxHeight = Math.min(stock.width * newScaleFactor + (PADDING * 2), 5000);
      
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
      console.log('Drawing stock panel:', stock);
      drawSafely(ctx => {
        ctx.fillStyle = '#EEEEEE';
        ctx.fillRect(PADDING, PADDING, stock.length * newScaleFactor, stock.width * newScaleFactor);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(PADDING, PADDING, stock.length * newScaleFactor, stock.width * newScaleFactor);
      });
      
      // Draw each cut piece
      console.log('About to draw pieces, placements count:', layout.placements.length);
      layout.placements.forEach((placement, index) => {
        console.log(`Drawing placement ${index}:`, placement);
        const cut = cuts.find(c => c.id === placement.cutId);
        if (!cut) {
          console.log(`Could not find cut with ID: ${placement.cutId}`);
          return;
        }
        
        // drawSafely(ctx => {
        //   console.log('Drawing cut:', cut, 'at placement:', placement);
        //   const colorIndex = index % colors.length;
        //   ctx.fillStyle = colors[colorIndex];
          
        //   // Consider rotation when drawing the rectangle
        //   const width = placement.rotated ? cut.length : cut.width;
        //   const length = placement.rotated ? cut.width : cut.length;
          
        //   const x = PADDING + placement.x * newScaleFactor;
        //   const y = PADDING + placement.y * newScaleFactor;
        //   const scaledWidth = width * newScaleFactor;
        //   const scaledLength = length * newScaleFactor;
          
        //   console.log(`Drawing piece at: (${x}, ${y}) with size: ${scaledWidth}x${scaledLength}`);
          
        //   ctx.fillRect(x, y, scaledWidth, scaledLength);
          
        //   ctx.strokeStyle = '#000000';
        //   ctx.lineWidth = 1;
        //   ctx.strokeRect(x, y, scaledWidth, scaledLength);
        // });
        
        // // Draw labels separately to avoid cascading errors
        // drawSafely(ctx => {
        //   // Draw label with properly converted dimensions
        //   ctx.fillStyle = '#000000';
        //   ctx.font = '12px Arial';
        //   ctx.textAlign = 'center';
          
        //   // Consider rotation for label placement
        //   const width = placement.rotated ? cut.length : cut.width;
        //   const length = placement.rotated ? cut.width : cut.length;
          
        //   const labelX = PADDING + placement.x * newScaleFactor + (width * newScaleFactor / 2);
        //   const labelY = PADDING + placement.y * newScaleFactor + (length * newScaleFactor / 2);
          
        //   // Verify position is within canvas bounds
        //   if (labelX > 0 && labelX < canvas.width && labelY > 0 && labelY < canvas.height) {
        //     // Show dimensions considering rotation
        //     ctx.fillText(
        //       `${formatDimension(width, 'width')}×${formatDimension(length, 'length')} ${unit}${placement.rotated ? ' (R)' : ''}`,
        //       labelX,
        //       labelY
        //     );
            
        //     // Add cut name if available
        //     if (cut.name) {
        //       ctx.font = '10px Arial';
        //       ctx.fillText(
        //         cut.name,
        //         labelX,
        //         labelY + 15
        //       );
        //     }
        //   }
        // });
      });
      
      // Draw kerf lines
      drawSafely(ctx => {
        // Clear any existing line settings that might interfere
        ctx.setLineDash([]); 
        
        // Now try to draw the actual kerf lines with extremely visible styling
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 6;  // Very thick line
        ctx.setLineDash([10, 5]); // Very obvious dash pattern
        
        // Generate all possible cut positions or use defaults if none found
        const allHorizontalCuts = new Set<number>();
        const allVerticalCuts = new Set<number>();
        
        // Find cut positions from placements
        layout.placements.forEach(placement => {
          const cut = cuts.find(c => c.id === placement.cutId);
          if (!cut) {
            return;
          }
          
          // Get dimensions based on rotation
          const width = placement.rotated ? cut.length : cut.width;
          const length = placement.rotated ? cut.width : cut.length;
          
          // Add horizontal cuts at bottom edge of each piece
          const yPos = placement.y + length;
          if (yPos > 0 && yPos < stock.length) {
            allHorizontalCuts.add(Math.round(yPos));
          }
          
          // Add vertical cuts at right edge of each piece
          const xPos = placement.x + width;
          if (xPos > 0 && xPos < stock.width) {
            allVerticalCuts.add(Math.round(xPos));
          }
        });
        
        // Draw all horizontal cut lines with counter
        let horizontalLinesDrawn = 0;
        allHorizontalCuts.forEach(y => {
          ctx.beginPath();
          ctx.moveTo(PADDING, PADDING + y * newScaleFactor);
          ctx.lineTo(PADDING + stock.width * newScaleFactor, PADDING + y * newScaleFactor);
          ctx.stroke();
          horizontalLinesDrawn++;
        });
        
        // Draw all vertical cut lines with counter
        let verticalLinesDrawn = 0;
        allVerticalCuts.forEach(x => {
          ctx.beginPath();
          ctx.moveTo(PADDING + x * newScaleFactor, PADDING);
          ctx.lineTo(PADDING + x * newScaleFactor, PADDING + stock.length * newScaleFactor);
          ctx.stroke();
          verticalLinesDrawn++;
        });
        
        // Another backup pass with a completely different style
        ctx.strokeStyle = '#0000FF';
        ctx.lineWidth = 2;
        ctx.setLineDash([2, 2]);
        
        // Draw horizontal cuts again with backup style
        allHorizontalCuts.forEach(y => {
          const yCoord = PADDING + y * newScaleFactor + 2; // Offset slightly for visibility
          ctx.beginPath();
          ctx.moveTo(PADDING, yCoord);
          ctx.lineTo(PADDING + stock.width * newScaleFactor, yCoord);
          ctx.stroke();
        });
        
        // Draw vertical cuts again with backup style
        allVerticalCuts.forEach(x => {
          const xCoord = PADDING + x * newScaleFactor + 2; // Offset slightly for visibility
          ctx.beginPath();
          ctx.moveTo(xCoord, PADDING);
          ctx.lineTo(xCoord, PADDING + stock.length * newScaleFactor);
          ctx.stroke();
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
      <div style={{ 
        marginBottom: '10px', 
        padding: '5px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '4px', 
        fontSize: '14px' 
      }}>
        Scale: {scaleFactor.toFixed(2)}x | Panel: {stock?.width}×{stock?.length} {unit}
      </div>
      <canvas 
        ref={canvasRef} 
        style={{ 
          border: '1px solid #ccc',
          maxWidth: '100%',
          height: 'auto',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          margin: '1rem 0',
          display: 'block'
        }}
      />
    </div>
  );
};

export default PanelCuttingVisualizer;