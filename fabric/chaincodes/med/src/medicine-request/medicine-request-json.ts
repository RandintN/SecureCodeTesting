import { IMedicineBaseJson } from '../medicine/medicine-base-json';

export interface IMedicineRequestJson extends IMedicineBaseJson {
    request_id: string;
}
