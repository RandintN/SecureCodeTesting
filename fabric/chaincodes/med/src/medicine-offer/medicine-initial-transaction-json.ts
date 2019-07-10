import { IMedicineJson } from '../medicine-abstract/medicine-json';

/*No início das transações, tanto de request, quanto de offer, 
o usuário pode lançar várias opções de classificação e/ou
indústrias farmacêuticas. Por isso são listas de string.*/
export interface IMedicineInitialTransactionJson extends IMedicineJson {
    classification: string[];
    pharma_industry: string[];

}
