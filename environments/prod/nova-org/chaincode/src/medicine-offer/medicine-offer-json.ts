import { IMedicineJson } from '../medicine-abstract/medicine-json';

export interface IMedicineOfferJson extends IMedicineJson {
    classification: string[];
    pharma_industry: string[];

}
