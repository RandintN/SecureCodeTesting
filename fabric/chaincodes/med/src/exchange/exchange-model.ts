import { IMedicineExchangeJson } from '../medicine-exchange/medicine-exchange-json';
import { MedicineExchange } from '../medicine-exchange/medicine-exchange-model';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidator } from '../validation/validator-interface';
import { IExchangeJson } from './exchange-json';

export class Exchange implements IValidator {

    private static ERROR_EMPTY_AMOUNT: ValidationError =
    new ValidationError('EX-001', 'The parameter amount cannot be empty or null');

    private static ERROR_EMPTY_MEDICINE: ValidationError =
    new ValidationError('EX-001', 'The parameter medicine cannot be empty or null');

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
        const validationResult: ValidationResult = new ValidationResult();

        if (!this.amount) {
            validationResult.errors.push(Exchange.ERROR_EMPTY_AMOUNT);

        }

        if (!this.medicine) {
            validationResult.errors.push(Exchange.ERROR_EMPTY_MEDICINE);

        } else {
            const exchangeValidation: ValidationResult = this.medicine.isValid();
            if (!exchangeValidation.isValid) {
                validationResult.addErrors(exchangeValidation.errors);

            }

        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }
}
