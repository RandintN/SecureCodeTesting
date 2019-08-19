import { IMedicineExchangeJson } from "../medicine-exchange/medicine-exchange-json";


export interface IProposedExchangeJson {
        amount: string;
        medicine: IMedicineExchangeJson
}