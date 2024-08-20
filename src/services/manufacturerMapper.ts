import {
  Product,
  Match,
  ManufacturerRelation,
  RelatedManufacturer,
} from "../models/types";
import { calculateSimilarity } from "../utils/stringUtils";
import logger from "../config/logger";

type Relationship = "parent" | "child" | "sibling";

export class ManufacturerMapper {
  private manufacturerRelations: Map<string, Set<string>> = new Map();
  private brandHierarchy: Map<string, Set<string>> = new Map();

  mapManufacturers(products: Product[], matches: Match[]): void {
    logger.info(
      `Mapping ${products.length} products and ${matches.length} matches`
    );
    this.buildBrandHierarchy(products);
    this.processMatches(matches, products);
  }

  getRelatedManufacturers(): ManufacturerRelation[] {
    return Array.from(this.manufacturerRelations.entries()).map(
      ([manufacturer, related]) => ({
        manufacturer,
        relatedManufacturers: this.getRelatedManufacturersForOne(
          manufacturer,
          related
        ),
      })
    );
  }

  private buildBrandHierarchy(products: Product[]): void {
    products.forEach(({ manufacturer, title }) => {
      if (manufacturer && title) {
        const manufacturerSet =
          this.brandHierarchy.get(manufacturer) ?? new Set();
        title
          .toLowerCase()
          .split(" ")
          .forEach((word) => manufacturerSet.add(word));
        this.brandHierarchy.set(manufacturer, manufacturerSet);
      }
    });
  }

  private processMatches(matches: Match[], products: Product[]): void {
    const productMap = new Map(
      products.map((p) => [`${p.source}:${p.source_id}`, p])
    );

    matches.forEach(({ m_source, m_source_id, c_source, c_source_id }) => {
      const mainProduct = productMap.get(`${m_source}:${m_source_id}`);
      const competitorProduct = productMap.get(`${c_source}:${c_source_id}`);

      if (mainProduct?.manufacturer && competitorProduct?.manufacturer) {
        this.addRelation(
          mainProduct.manufacturer,
          competitorProduct.manufacturer
        );
      }
    });
  }

  private addRelation(manufacturer1: string, manufacturer2: string): void {
    this.getOrCreateManufacturerSet(manufacturer1).add(manufacturer2);
    this.getOrCreateManufacturerSet(manufacturer2).add(manufacturer1);
  }

  private getOrCreateManufacturerSet(manufacturer: string): Set<string> {
    if (!this.manufacturerRelations.has(manufacturer)) {
      this.manufacturerRelations.set(manufacturer, new Set());
    }
    return this.manufacturerRelations.get(manufacturer)!;
  }

  private getRelatedManufacturersForOne(
    manufacturer: string,
    related: Set<string>
  ): RelatedManufacturer[] {
    return Array.from(related).map((relatedManufacturer) => ({
      name: relatedManufacturer,
      relationship: this.determineRelationship(
        manufacturer,
        relatedManufacturer
      ),
    }));
  }

  private determineRelationship(
    manufacturer1: string,
    manufacturer2: string
  ): Relationship {
    const similarity = calculateSimilarity(manufacturer1, manufacturer2);
    if (similarity > 0.8) return "sibling";

    const brands1 = this.brandHierarchy.get(manufacturer1) ?? new Set();
    const brands2 = this.brandHierarchy.get(manufacturer2) ?? new Set();

    const commonBrands = new Set(
      [...brands1].filter((brand) => brands2.has(brand))
    );
    const uniqueBrands1 = new Set(
      [...brands1].filter((brand) => !brands2.has(brand))
    );
    const uniqueBrands2 = new Set(
      [...brands2].filter((brand) => !brands1.has(brand))
    );

    if (commonBrands.size > 0) {
      if (uniqueBrands1.size > uniqueBrands2.size) return "parent";
      if (uniqueBrands2.size > uniqueBrands1.size) return "child";
    }

    return "sibling";
  }
}
