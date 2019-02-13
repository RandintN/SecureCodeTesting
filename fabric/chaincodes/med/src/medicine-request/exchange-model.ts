import { ValidationResult } from '../validation/validation-model';
import { IValidatorModel } from '../validation/validator-interface';
import { IExchangeJson } from './exchange-json';
import { IMedicineExchangeJson } from './medicine-exchange-json';
import { MedicineExchange } from './medicine-exchange-model';

export class Exchange implements IValidatorModel {
    public amount: string;
    public medicine: MedicineExchange;

    public fromJson(exchangeJson: IExchangeJson): void {
        this.amount = exchangeJson.amount;
        const medicine: MedicineExchange = new MedicineExchange();
        medicine.fromJson(exchangeJson.medicine);
        this.medicine = medicine;

    }

    public toJson(): IExchangeJson {
        const medicineJson: IMedicineExchangeJson = this.medicine.toJson();
        const json: IExchangeJson = {
            amount: this.amount,
            medicine: medicineJson,

        };

        return json;
    }

    public isValid(): ValidationResult {
        throw new Error('Method not implemented.');
    }
}
