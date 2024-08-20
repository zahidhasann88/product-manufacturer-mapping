import { BrandCache, ManufacturerRelation } from '../models/types';

export class BrandAssigner {
  private brandCache: BrandCache = {};
  private brandSet: Set<string>;

  constructor(private readonly manufacturerRelations: ManufacturerRelation[]) {
    this.brandSet = this.buildBrandSet();
  }

  private buildBrandSet(): Set<string> {
    const brands = new Set<string>();
    for (const relation of this.manufacturerRelations) {
      brands.add(relation.manufacturer.toLowerCase());
      for (const related of relation.relatedManufacturers) {
        brands.add(related.name.toLowerCase());
      }
    }
    return brands;
  }

  private containsBrand(title: string, brand: string): boolean {
    return title.includes(brand);
  }

  public assignBrand(title: string): string | null {
    const normalizedTitle = title.toLowerCase();
    
    if (normalizedTitle in this.brandCache) {
      return this.brandCache[normalizedTitle];
    }

    for (const brand of this.brandSet) {
      if (this.containsBrand(normalizedTitle, brand)) {
        this.brandCache[normalizedTitle] = brand;
        return brand;
      }
    }

    this.brandCache[normalizedTitle] = null;
    return null;
  }
}