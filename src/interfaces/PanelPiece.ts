export interface PanelPiece {
  id: string;
  name: string;
  length: number;
  width: number;
  quantity: number;
  grainDirection: 'Lengthwise' | 'Widthwise' | 'N/A';
  notes: string;
}