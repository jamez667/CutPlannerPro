export interface PanelCut {
  id: number;
  name: string;
  length: number;
  width: number;
  quantity: number;
  grain: 'Lengthwise' | 'Widthwise' | 'N/A';
  notes: string;
}