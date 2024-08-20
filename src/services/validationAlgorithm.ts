import { ManufacturerRelation, RelatedManufacturer, ValidationIssue, ValidationResult } from "../models/types";
import { calculateSimilarity } from "../utils/stringUtils";
import logger from "../config/logger";

const COMMON_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
]);
const MIN_MANUFACTURER_LENGTH = 3;
const MAX_RELATED_RATIO = 0.8;
const MIN_SIMILARITY_THRESHOLD = 0.7;

export function validateManufacturerMatching(
  relations: ManufacturerRelation[]
): string[] {
  const result = relations.reduce<ValidationResult>(
    (acc, relation) => {
      validateSingleRelation(relation, relations.length, acc);
      return acc;
    },
    { flaggedManufacturers: new Set<string>(), issues: [] }
  );

  result.issues.forEach(logValidationIssue);

  return Array.from(result.flaggedManufacturers);
}

function validateSingleRelation(
  relation: ManufacturerRelation,
  totalRelations: number,
  result: ValidationResult
): void {
  const { manufacturer, relatedManufacturers } = relation;

  if (isInvalidManufacturer(manufacturer)) {
    addValidationIssue(result, "InvalidName", manufacturer);
  }

  checkRelationCount(
    manufacturer,
    relatedManufacturers.length,
    totalRelations,
    result
  );

  relatedManufacturers.forEach((related) =>
    validateRelatedManufacturer(manufacturer, related, result)
  );
}

function validateRelatedManufacturer(
  manufacturer: string,
  related: RelatedManufacturer,
  result: ValidationResult
): void {
  if (isInvalidManufacturer(related.name)) {
    addValidationIssue(result, "InvalidName", related.name);
  }

  const similarity = calculateSimilarity(manufacturer, related.name);
  if (similarity > MIN_SIMILARITY_THRESHOLD && similarity < 1) {
    addValidationIssue(result, "HighSimilarity", manufacturer, related.name);
  }
}

function isInvalidManufacturer(name: string): boolean {
  const lowerCaseName = name.toLowerCase();
  return (
    COMMON_WORDS.has(lowerCaseName) ||
    name.length < MIN_MANUFACTURER_LENGTH ||
    /^\d+$/.test(name)
  );
}

function checkRelationCount(
  manufacturer: string,
  relatedCount: number,
  totalRelations: number,
  result: ValidationResult
): void {
  if (relatedCount > 0 && relatedCount / totalRelations > MAX_RELATED_RATIO) {
    addValidationIssue(
      result,
      "HighRelationCount",
      manufacturer,
      undefined,
      `${relatedCount} relations out of ${totalRelations} total`
    );
  }
}

function addValidationIssue(
  result: ValidationResult,
  type: ValidationIssue["type"],
  manufacturer: string,
  relatedManufacturer?: string,
  details?: string
): void {
  result.flaggedManufacturers.add(manufacturer);
  if (relatedManufacturer) {
    result.flaggedManufacturers.add(relatedManufacturer);
  }
  result.issues.push({ type, manufacturer, relatedManufacturer, details });
}

function logValidationIssue(issue: ValidationIssue): void {
  switch (issue.type) {
    case "InvalidName":
      logger.warn(`Invalid manufacturer name: ${issue.manufacturer}`);
      break;
    case "HighRelationCount":
      logger.warn(
        `Manufacturer ${issue.manufacturer} has an unusually high number of relations: ${issue.details}`
      );
      break;
    case "HighSimilarity":
      logger.warn(
        `High similarity between ${issue.manufacturer} and ${issue.relatedManufacturer}`
      );
      break;
  }
}
