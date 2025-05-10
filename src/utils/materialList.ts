export class MaterialList {
  static Wood = {
    items: [
      {
        name: "North American & European Hardwoods",
        description: "Premium hardwoods native to North America and Europe, known for their durability and beauty",
        common: ["Oak", "Maple", "Cherry", "Walnut", "Mahogany", "Birch", "Hickory", "Ash", "Rosewood"]
      },
      {
        name: "Asian Hardwoods",
        description: "Exotic hardwoods from Asia, often featuring unique grain patterns and coloration",
        common: ["Teak", "Rosewood", "Merbau", "Rubberwood", "Burmese Blackwood", "Ramin"]
      },
      {
        name: "African Hardwoods",
        description: "Premium exotic hardwoods from Africa, often featuring distinctive colors and grain patterns",
        common: ["African Blackwood", "Zebrano (Zebrawood)", "Wenge", "Iroko", "Pink Ivory", "Afzelia"]
      },
      {
        name: "Softwood",
        description: "Derived from coniferous trees, generally less dense and easier to work with",
        common: ["Pine", "Cedar", "Spruce", "Fir", "Redwood", "Hemlock", "Douglas Fir", "Cypress"]
      },
      {
        name: "Plywood",
        description: "Engineered wood made from thin layers of wood veneer glued together with adjacent layers having their wood grain rotated",
        common: ["Birch", "Oak", "Marine", "Baltic Birch", "Sande", "Cabinet-Grade", "Structural", "CDX", "ACX", "BCX", "Hardwood", "Softwood", "Aircraft", "Exterior", "Interior", "WBP", "Lauan", "MR (Moisture Resistant)", "AB", "BB", "PureBond", "ApplePly", "Radiata Pine", "Okoume", "MDO"]
      },
      {
        name: "Engineered Wood",
        description: "Manufactured wood products composed of multiple layers or particles",
        common: ["MDF", "Particleboard", "OSB", "Hardboard", "Veneered Panels", "LVL (Laminated Veneer Lumber)", "Melamine"]
      }
    ]
  };

  static Metal = {
    items: [
      {
        name: "Ferrous Metals",
        description: "Metals containing iron, typically magnetic and prone to rust",
        common: ["Carbon Steel", "Stainless Steel", "Cast Iron", "Wrought Iron", "Tool Steel"]
      },
      {
        name: "Non-ferrous Metals",
        description: "Metals without significant iron content, usually non-magnetic and corrosion resistant",
        common: ["Aluminum", "Copper", "Brass", "Bronze", "Zinc"]
      },
      {
        name: "Precious Metals",
        description: "Rare metals with high economic value",
        common: ["Gold", "Silver", "Platinum", "Titanium"]
      }
    ]
  };

  static Plastic = {
    items: [
      {
        name: "Thermoplastics",
        description: "Plastics that can be melted and reformed multiple times",
        common: ["Acrylic (PMMA)", "Polycarbonate", "PVC", "Polyethylene", "Polypropylene"]
      },
      {
        name: "Thermosets",
        description: "Plastics that irreversibly cure, creating strong bonds resistant to heat",
        common: ["Epoxy", "Polyurethane", "Phenolic", "Melamine"]
      },
      {
        name: "Composites",
        description: "Materials made from two or more constituent materials with different properties",
        common: ["Fiberglass", "Carbon Fiber", "HDPE Composites"]
      }
    ]
  };
}