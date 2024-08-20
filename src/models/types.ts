export enum RelationshipType {
  Parent = 'parent',
  Child = 'child',
  Sibling = 'sibling'
}

export interface RelatedManufacturer {
  name: string;
  relationship: 'parent' | 'child' | 'sibling';
}

export interface ValidationResult {
  flaggedManufacturers: Set<string>;
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  type: "InvalidName" | "HighRelationCount" | "HighSimilarity";
  manufacturer: string;
  relatedManufacturer?: string;
  details?: string;
}

export interface BrandCache {
  [key: string]: string | null;
}

export interface ManufacturerRelation {
  manufacturer: string;
  relatedManufacturers: RelatedManufacturer[];
}

export interface Product {
  title: string;
  manufacturer: string;
  source: string;
  source_id: string;
  country_code: string;
  barcode: string;
  composition: string;
  description: string;
}

export interface Match {
  id: string;
  m_source: string;
  c_source: string;
  m_country_code: string;
  c_country_code: string;
  m_source_id: string;
  c_source_id: string;
  validation_status: string;
}
