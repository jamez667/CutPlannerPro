export interface MaterialTypeItem {
  name: string;
  description: string;
  common: string[];
}

export interface MaterialType {
  category: string;
  items: MaterialTypeItem[];
}