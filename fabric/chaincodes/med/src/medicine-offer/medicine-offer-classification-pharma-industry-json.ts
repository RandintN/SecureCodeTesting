import { IMedicineJson } from '../medicine-abstract/medicine-json';

export interface IMedicineOfferClaPharmIndJson extends IMedicineJson {
    classification: string;
    pharma_industry: string;
    ref_value:       number;
}
