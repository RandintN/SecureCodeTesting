import { IMedicineJson } from '../medicine-abstract/medicine-json';

export interface IMedicineOfferExchangeJson extends IMedicineJson {
        classification: string[];
        pharma_industry: string[];
}