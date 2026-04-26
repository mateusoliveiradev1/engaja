import { DomainValidationError } from "./base.js";

export type DomainId<TBrand extends string> = string & {
  readonly __brand: TBrand;
};

export interface Entity<TId extends string = string> {
  readonly id: TId;
}

export function createDomainId<TBrand extends string>(value: string): DomainId<TBrand> {
  if (value.trim().length === 0) {
    throw new DomainValidationError("Domain id cannot be empty.", "id");
  }

  return value as DomainId<TBrand>;
}
