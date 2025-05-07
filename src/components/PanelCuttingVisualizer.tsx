import React, { useRef, useEffect, useState } from 'react';
import { formatDimensionValue } from '../utils/formatters';
import { PanelCuttingVisualizerProps } from '../interfaces/PanelCuttingVisualizerProps';

const colors = [
  '#FFB6C1', '#FFD700', '#98FB98', '#87CEFA', '#DDA0DD',
  '#FFA07A', '#FFFACD', '#B0E0E6', '#F0E68C', '#E6E6FA'
];

const PanelCuttingVisualizer: React.FC<PanelCuttingVisualizerProps> = ({ 
  stock, 
  pieces, 
  layout, 
  unit, 
  kerfSize = 3 // Default kerf size if not provided
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const PADDING = 100;
  const [scaleFactor, setScaleFactor] = useState(1);
  
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
    
    if (!canvasRef.current || !layout || !layout.placements || !stock) {
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
      const targetWidth = 1000; // Target width in pixels
      const targetHeight = 1000; // Target height in pixels
      
      // Calculate scale based on the larger dimension to maintain aspect ratio
      const widthScale = (targetWidth - PADDING * 2) / stock.width;
      const heightScale = (targetHeight - PADDING * 2) / stock.length;
      const calculatedScale = Math.min(widthScale, heightScale, 10); // Cap at 10x for very small panels
      
      // Set and store the scale factor
      const newScaleFactor = Math.max(calculatedScale, 0.1); // Ensure minimum visibility
      setScaleFactor(newScaleFactor);
      console.log('Dynamic scale factor:', newScaleFactor);
      
      // Apply the scale factor to canvas dimensions
      const maxLength = Math.min(stock.length * newScaleFactor + (PADDING * 2), 5000); // Cap at 5000px
      const maxWidth = Math.min(stock.width * newScaleFactor + (PADDING * 2), 5000);
      
      canvas.width = maxLength;
      canvas.height = maxWidth;
      
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
        ctx.fillRect(PADDING, PADDING, stock.length * newScaleFactor, stock.width * newScaleFactor);
        
        // Draw grain direction lines
        ctx.strokeStyle = 'rgba(0,0,0,0.05)'; // Very faint grey
        ctx.lineWidth = 1;
        ctx.beginPath();
        const grainSpacing = 20; // Adjust for desired line density
        
        // Determine grain direction
        if (stock.grainDirection === 'Lengthwise') {
          // Draw horizontal lines for grain
          for (let y = PADDING; y <= stock.width * newScaleFactor + PADDING; y += grainSpacing) {
            ctx.moveTo(PADDING, y);
            ctx.lineTo(stock.length * newScaleFactor + PADDING, y);
          }
        } else {
          // Draw vertical lines for grain
          for (let x = PADDING; x <= stock.length * newScaleFactor + PADDING; x += grainSpacing) {
            ctx.moveTo(x, PADDING);
            ctx.lineTo(x, stock.width * newScaleFactor + PADDING);
          }
        }
        
        ctx.stroke();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(PADDING, PADDING, stock.length * newScaleFactor, stock.width * newScaleFactor);
      });
      
      // Draw each piece
      layout.placements.forEach((placement, index) => {
        const piece = pieces.find(c => c.id === placement.pieceId);
        if (!piece) {
          return;
        }

        drawSafely(ctx => {
          const colorIndex = index % colors.length;
          ctx.fillStyle = colors[colorIndex];
          
          // Consider rotation when drawing the rectangle
          const width = placement.rotated ? piece.length : piece.width;
          const length = placement.rotated ? piece.width : piece.length;
          
          const x = PADDING + placement.x * newScaleFactor;
          const y = PADDING + placement.y * newScaleFactor;
          const scaledWidth = width * newScaleFactor;
          const scaledLength = length * newScaleFactor;
          
          console.log(`Drawing piece at: (${x}, ${y}) with size: ${scaledLength}x${scaledWidth}`);
          
          ctx.fillRect(x, y, scaledLength, scaledWidth);
          
          // Draw grain direction lines on the piece
          if (piece.grainDirection !== 'N/A') {
            ctx.strokeStyle = 'rgba(0,0,0,0.1)'; // Even fainter grey
            ctx.lineWidth = 1;
            ctx.beginPath();
            
            const grainSpacing = 10; // Adjust for desired line density
            
            // Determine the correct grain direction based on the piece's orientation and rotation
            let isHorizontalGrain = piece.grainDirection === 'Lengthwise';
            
            // If the piece is rotated, we need to invert the grain direction
            if (placement.rotated) {
              isHorizontalGrain = !isHorizontalGrain;
            }
            
            if (isHorizontalGrain) {
              // Draw horizontal lines for grain (along the width of the drawn rectangle)
              for (let grainY = y; grainY <= y + scaledWidth; grainY += grainSpacing) {
                ctx.moveTo(x, grainY);
                ctx.lineTo(x + scaledLength, grainY);
              }
            } else {
              // Draw vertical lines for grain (along the length of the drawn rectangle)
              for (let grainX = x; grainX <= x + scaledLength; grainX += grainSpacing) {
                ctx.moveTo(grainX, y);
                ctx.lineTo(grainX, y + scaledWidth);
              }
            }
            
            ctx.stroke();
          }
          
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, scaledLength, scaledWidth);
        });
        
        // Draw labels separately to avoid cascading errors
        drawSafely(ctx => {
          // Draw label with properly converted dimensions
          ctx.fillStyle = '#000000';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          
          // Consider rotation for label placement
          const width = placement.rotated ? piece.length : piece.width;
          const length = placement.rotated ? piece.width : piece.length;
          
          const labelX = PADDING + placement.x * newScaleFactor + (length * newScaleFactor / 2);
          const labelY = PADDING + placement.y * newScaleFactor + (width * newScaleFactor / 2);
          
          // Verify position is within canvas bounds
          if (labelX > 0 && labelX < canvas.width && labelY > 0 && labelY < canvas.height) {
            // Show dimensions considering rotation
            ctx.fillText(
              `${formatDimensionValue(length, 'length', unit, true)}x${formatDimensionValue(width, 'width', unit, true)} ${placement.rotated ? ' (R)' : ''}`,
              labelX,
              labelY
            );
            
            // Add piece name if available
            if (piece.name) {
              ctx.font = '10px Arial';
              ctx.fillText(
                piece.name,
                labelX,
                labelY + 15
              );
            }
          }
        });
      });
      
      // Draw kerf lines
      drawSafely(ctx => {
        // Clear any existing line settings that might interfere
        ctx.setLineDash([]); 
        
        // Now try to draw the actual kerf lines with extremely visible styling
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;  // Very thick line
        ctx.setLineDash([10, 5]); // Very obvious dash pattern
        
        // Generate all possible piece positions or use defaults if none found
        const allHorizontalCuts = new Set<number>();
        const allVerticalCuts = new Set<number>();
        
        // Find cut positions from placements
        layout.placements.forEach(placement => {
          const piece = pieces.find(c => c.id === placement.pieceId);
          if (!piece) {
            return;
          }
          
          // Get dimensions based on rotation
          const width = placement.rotated ? piece.length : piece.width;
          const length = placement.rotated ? piece.width : piece.length;
          
          // Add horizontal cuts at top AND bottom edge of each piece
          // Add top edge with kerf positioned exactly at the edge (no offset)
          const yTopPos = placement.y;
          if (yTopPos > 0 && yTopPos < stock.width) {
            allHorizontalCuts.add(Math.round(yTopPos));
          }
          
          // Add bottom edge with kerf positioned after the piece (full kerf width)
          const yBottomPos = placement.y + width;
          if (yBottomPos > 0 && yBottomPos < stock.width) {
            allHorizontalCuts.add(Math.round(yBottomPos));
          }
          
          // ONLY add vertical cuts at RIGHT edge of each piece
          // Add right edge with kerf positioned after the piece (full kerf width)
          const xRightPos = placement.x + length;
          if (xRightPos > 0 && xRightPos < stock.length) {
            allVerticalCuts.add(Math.round(xRightPos));
          }
        });
        
        // Filter out cuts that are too close to each other (within kerf width)
        const filteredHorizontalCuts = Array.from(allHorizontalCuts)
          .sort((a, b) => a - b)
          .filter((cut, index, cuts) => index === 0 || cut - cuts[index - 1] > kerfSize);

        const filteredVerticalCuts = Array.from(allVerticalCuts)
          .sort((a, b) => a - b)
          .filter((cut, index, cuts) => index === 0 || cut - cuts[index - 1] > kerfSize);
        
        // Draw all horizontal cut lines with counter
        let horizontalLinesDrawn = 0;
        filteredHorizontalCuts.forEach(y => {
          ctx.beginPath();
          ctx.moveTo(PADDING, PADDING + ((kerfSize/2) *newScaleFactor) + y * newScaleFactor);
          ctx.lineTo(PADDING + stock.length * newScaleFactor, PADDING + ((kerfSize/2) *newScaleFactor) + y * newScaleFactor);
          ctx.stroke();

          // Add text label left of the line showing distance from left edge
          ctx.fillStyle = '#000000';
          ctx.font = '10px Arial';
          ctx.textAlign = 'right';
          const textX = PADDING - 5;
          const textY = PADDING + 3 + y * newScaleFactor;
          ctx.fillText(`${formatDimensionValue(y, 'length', unit, true)}`, textX, textY);

          horizontalLinesDrawn++;
        });
        
        // Draw all vertical cut lines with counter
        let verticalLinesDrawn = 0;
        filteredVerticalCuts.forEach(x => {
          ctx.beginPath();
          ctx.moveTo(PADDING + ((kerfSize/2) *newScaleFactor) + x * newScaleFactor, PADDING);
          ctx.lineTo(PADDING + ((kerfSize/2) *newScaleFactor) + x * newScaleFactor, PADDING + stock.width * newScaleFactor);
          ctx.stroke();
          
          // Add text label above the line showing distance from left edge
          ctx.fillStyle = '#000000';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          const textX = PADDING + x * newScaleFactor;
          const textY = PADDING - 5; // Position above the panel
          ctx.fillText(`${formatDimensionValue(x, 'width', unit, true)}`, textX, textY);
          
          verticalLinesDrawn++;
        });
        
        // Reset line dash
        ctx.setLineDash([]);
        
        // Log number of cut lines drawn for debugging
        console.log(`Drew ${horizontalLinesDrawn} horizontal cuts and ${verticalLinesDrawn} vertical cuts`);
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
  }, [stock, pieces, layout, unit, kerfSize]); // Add kerfSize to dependency array

  return (
    <div className="panel-cutting-visualizer">
      {error && (
        <div style={{ color: 'red', padding: '10px', marginBottom: '10px', backgroundColor: '#ffeeee', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      {/* <div style={{  
        marginBottom: '10px', 
        padding: '5px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '4px', 
        fontSize: '14px' 
      }}>
        Scale: {scaleFactor.toFixed(2)}x | Panel: {stock?.width}×{stock?.length} {unit} | Kerf: {kerfSize}mm
      </div>*/}

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