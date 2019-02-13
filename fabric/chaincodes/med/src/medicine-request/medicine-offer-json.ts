import { IMedicineJson } from './medicine-json';

export interface IMedicineOfferJson extends IMedicineJson {
    classification: string[];
    pharma_industry: string[];

}
