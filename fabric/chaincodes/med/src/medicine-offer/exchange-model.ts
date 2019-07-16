import { MedicineOfferExchange } from './medicine-exchange-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidator } from '../validation/validator-interface';
import { IOfferExchangeJson } from './exchange-json';
import { IMedicineOfferExchangeJson } from './medicine-exchange-json';

export class OfferExchange implements IValidator {

    public amount: string;
    public medicine: MedicineOfferExchange;

    public fromJson(exchangeJson: IOfferExchangeJson): void {
        this.amount = exchangeJson.amount;
        const medicine: MedicineOfferExchange = new MedicineOfferExchange();
        medicine.fromJson(exchangeJson.medicine);
        this.medicine = medicine;

    }

    public toJson(): IOfferExchangeJson {
        const medicineJson: IMedicineOfferExchangeJson = this.medicine.toJson();
        const json: IOfferExchangeJson = {
            amount: this.amount,
            medicine: medicineJson,

        };

        return json;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();

            const exchangeValidation: ValidationResult = this.medicine.isValid();
            if (!exchangeValidation.isValid) {
                validationResult.addErrors(exchangeValidation.errors);

            }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }
}
