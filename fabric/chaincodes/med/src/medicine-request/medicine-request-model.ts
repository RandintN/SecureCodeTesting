import { IExchangeJson } from '../exchange/exchange-json';
import { Exchange } from '../exchange/exchange-model';
import { IMedicineOfferJson } from '../medicine-offer/medicine-offer-json';
import { MedicineOffer } from '../medicine-offer/medicine-offer-model';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidator } from '../validation/validator-interface';
import { IMedicineRequestJson } from './medicine-request-json';

export class MedicineRequest implements IValidator {
    //#region constants
    private static ERROR_EMPTY_USER_ID: ValidationError =
        new ValidationError('MR-001', 'The parameter user_id cannot be empty or null');

    private static ERROR_EMPTY_AFFILIATION_ID: ValidationError =
        new ValidationError('MR-002', 'The parameter affiliation_id cannot be empty or null');

    private static ERROR_EMPTY_AMOUNT: ValidationError =
        new ValidationError('MR-003', 'The parameter amount cannot be empty or null');

    private static ERROR_EMPTY_TYPE: ValidationError =
        new ValidationError('MR-004', 'The parameter type cannot be empty or null');

    private static ERROR_EMPTY_EXCHANGE: ValidationError =
        new ValidationError('MR-005', 'The parameter exchange cannot be empty or null');

    //#endregion
    public user_id: string;
    public affiliation_id: string;
    public amount: string;
    public medicine: MedicineOffer;
    public type: string;
    public returnDate: string;
    public exchange: Exchange[];

    public fromJson(medicineRequestJson: IMedicineRequestJson): void {
        this.user_id = medicineRequestJson.user_id;
        this.affiliation_id = medicineRequestJson.affiliation_id;
        this.amount = medicineRequestJson.amount;
        this.returnDate = medicineRequestJson.return_date;
        this.type = medicineRequestJson.type;

        const medicineOffer: MedicineOffer = new MedicineOffer();
        medicineOffer.fromJson(medicineRequestJson.medicine);

        this.medicine = medicineOffer;

        const exchanges: Exchange[] = [];

        if (medicineRequestJson.exchange) {
            for (const exchangeJson of medicineRequestJson.exchange) {
                const exchange: Exchange = new Exchange();
                exchange.fromJson(exchangeJson);
                exchanges.push(exchange);

            }

        }

        this.exchange = exchanges;

    }

    public toJson(): IMedicineRequestJson {
        const medicineOfferJson: IMedicineOfferJson = this.medicine.toJson();
        const exchangesJson: IExchangeJson[] = [];

        for (const exchange of this.exchange) {
            const exchangeJson: IExchangeJson = exchange.toJson();
            exchangesJson.push(exchangeJson);

        }

        const medicineRequestJson: IMedicineRequestJson = {
            user_id: this.user_id,
            affiliation_id: this.affiliation_id,
            amount: this.amount,
            exchange: exchangesJson,
            medicine: medicineOfferJson,
            return_date: this.returnDate,
            type: this.type,

        };

        return medicineRequestJson;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();

        if (!this.user_id) {
            validationResult.errors.push(MedicineRequest.ERROR_EMPTY_USER_ID);
        }

        if (!this.affiliation_id) {
            validationResult.errors.push(MedicineRequest.ERROR_EMPTY_AFFILIATION_ID);
        }

        if (!this.amount) {
            validationResult.errors.push(MedicineRequest.ERROR_EMPTY_AMOUNT);

        }

        const medicineValidation: ValidationResult = this.medicine.isValid();

        if (!medicineValidation.isValid) {
            validationResult.addErrors(medicineValidation.errors);

        }

        if (!this.type) {
            validationResult.errors.push(MedicineRequest.ERROR_EMPTY_TYPE);

        }

        if (!this.exchange) {
            validationResult.errors.push(MedicineRequest.ERROR_EMPTY_EXCHANGE);

        } else {
            for (const exchange of this.exchange) {
                const exchangeValidation: ValidationResult = exchange.isValid();
                if (!exchangeValidation.isValid) {
                    validationResult.addErrors(exchangeValidation.errors);

                }

            }

        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }
}
