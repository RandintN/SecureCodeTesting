import { IMedicineJson } from '../medicine-abstract/medicine-json';

export interface IMedicineRequestClaPharmIndJson extends IMedicineJson {
    classification: string[];
    pharma_industry: string[];

}
