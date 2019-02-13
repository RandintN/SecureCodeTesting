import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidatorModel } from '../validation/validator-interface';
import { IExchangeJson } from './exchange-json';
import { Exchange } from './exchange-model';
import { IMedicineOfferJson } from './medicine-offer-json';
import { MedicineOffer } from './medicine-offer-model';
import { IMedicineRequestJson } from './medicine-request-json';

export class MedicineRequest implements IValidatorModel {
    //#region constants
    private static ERROR_EMPTY_ORG_ID: ValidationError =
        new ValidationError('MR-001', 'The parameter org_id cannot be empty or null');

    private static ERROR_EMPTY_AMOUNT: ValidationError =
        new ValidationError('MR-002', 'The parameter amount cannot be empty or null');

    private static ERROR_EMPTY_TYPE: ValidationError =
        new ValidationError('MR-003', 'The parameter type cannot be empty or null');

    private static ERROR_EMPTY_EXCHANGE: ValidationError =
        new ValidationError('MR-003', 'The parameter exchange cannot be empty or null');

    //#endregion
    public orgId: string;
    public amount: string;
    public medicine: MedicineOffer;
    public type: string[];
    public returnDate: string;
    public exchange: Exchange[];

    public fromJson(medicineRequestJson: IMedicineRequestJson): void {
        this.orgId = medicineRequestJson.org_id;
        this.amount = medicineRequestJson.amount;
        this.returnDate = medicineRequestJson.return_date;
        this.type = medicineRequestJson.type;

        const medicineOffer: MedicineOffer = new MedicineOffer();
        medicineOffer.fromJson(medicineRequestJson.medicine);

        this.medicine = medicineOffer;

        const exchanges: Exchange[] = [];

        for (const exchangeJson of medicineRequestJson.exchange) {
            const exchange: Exchange = new Exchange();
            exchange.fromJson(exchangeJson);
            exchanges.push(exchange);
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
            amount: this.amount,
            exchange: exchangesJson,
            medicine: medicineOfferJson,
            org_id: this.orgId,
            return_date: this.returnDate,
            type: this.type,

        };

        return medicineRequestJson;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();
        if (this.orgId === null || this.orgId === undefined) {
            validationResult.errors.push(MedicineRequest.ERROR_EMPTY_ORG_ID);
        }

        if (this.amount === null || this.amount === undefined) {
            validationResult.errors.push(MedicineRequest.ERROR_EMPTY_AMOUNT);
        }

        const medicineValidation: ValidationResult = this.medicine.isValid();

        if (!medicineValidation.isValid) {
            validationResult.errors.concat(medicineValidation.errors);
        }

        if (this.type === null || this.type === undefined) {
            validationResult.errors.push(MedicineRequest.ERROR_EMPTY_TYPE);
        } else if (this.type.length < 1) {
            validationResult.errors.push(MedicineRequest.ERROR_EMPTY_TYPE);
        }

        if (this.exchange === null || this.exchange === undefined || this.exchange.length < 1) {
            validationResult.errors.push(MedicineRequest.ERROR_EMPTY_EXCHANGE);
        } else if (this.exchange !== null && this.exchange !== undefined) {
            for (const exchange of this.exchange) {
                const exchangeValidation: ValidationResult = exchange.isValid();
                if (!exchangeValidation.isValid) {
                    validationResult.errors.concat(exchangeValidation.errors);
                }
            }
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }
}
