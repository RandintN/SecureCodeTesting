import { IMedicineJson } from './medicine-json';

export interface IMedicineExchangeJson extends IMedicineJson {
        classification: string;
        pharma_industry: string;
}
