import { IMedicineJson } from '../medicine-abstract/medicine-json';

export interface IMedicineExchangeJson extends IMedicineJson {
        classification: string;
        pharma_industry: string;
}