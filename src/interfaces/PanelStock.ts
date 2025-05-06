export interface PanelStock {
  id: number;
  length: number;
  width: number;
  thickness: number;
  quantity: number;
  grainDirection: 'Lengthwise' | 'Widthwise' | 'N/A';
  woodSpecies: string;
  description: string;
  pricePer: number;
}