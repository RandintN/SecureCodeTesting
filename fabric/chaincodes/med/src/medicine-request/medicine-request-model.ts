import { IExchangeJson } from '../exchange/exchange-json';
import { Exchange } from '../exchange/exchange-model';
import { IMedicineOfferJson } from '../medicine-offer/medicine-offer-json';
import { MedicineOffer } from '../medicine-offer/medicine-offer-model';
import { MedicineRequestStatusEnum } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidator } from '../validation/validator-interface';
import { IMedicineRequestJson } from './medicine-request-json';

export class MedicineRequest implements IValidator {
    //#region constants
    private static ERROR_EMPTY_AMOUNT: ValidationError =
        new ValidationError('MR-001', 'The parameter amount cannot be empty or null');

    private static ERROR_EMPTY_TYPE: ValidationError =
        new ValidationError('MR-002', 'The parameter type cannot be empty or null');

    private static ERROR_EMPTY_EXCHANGE: ValidationError =
        new ValidationError('MR-003', 'The parameter exchange cannot be empty or null');

    private static ERROR_EMPTY_RETURN_DATE: ValidationError = new ValidationError
        ('MR-004', 'The parameter return_date cannot be empty or null when the medicine request type is loan');

    private static ERROR_RETURN_DATE_INVALID: ValidationError =
        new ValidationError('MR-005', 'The parameter return_date is invalid');

    private static ERROR_RETURN_DATE_FROM_PAST: ValidationError =
        new ValidationError('MR-006', 'The parameter return_date cannot be before today');

    //#endregion
    public amount: string;
    public medicine: MedicineOffer;
    public type: string;
    public returnDate: string;
    public exchange: Exchange[];
    public status: any;

    public fromJson(medicineRequestJson: IMedicineRequestJson): void {
        this.amount = medicineRequestJson.amount;
        this.returnDate = medicineRequestJson.return_date;
        this.type = medicineRequestJson.type;
        this.status = medicineRequestJson.status ? medicineRequestJson.status
            : MedicineRequestStatusEnum.WAITING_FOR_APPROVAL;

        const medicineOffer: MedicineOffer = new MedicineOffer();
        if (medicineRequestJson.medicine) {
            medicineOffer.fromJson(medicineRequestJson.medicine);
        }

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
            amount: this.amount,
            exchange: exchangesJson,
            medicine: medicineOfferJson,
            return_date: this.returnDate,
            status: this.status,
            type: this.type,

        };

        return medicineRequestJson;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();

        if (!this.amount) {
            validationResult.errors.push(MedicineRequest.ERROR_EMPTY_AMOUNT);

        }

        const medicineValidation: ValidationResult = this.medicine.isValid();

        if (!medicineValidation.isValid) {
            validationResult.addErrors(medicineValidation.errors);

        }

        if (!this.type) {
            validationResult.errors.push(MedicineRequest.ERROR_EMPTY_TYPE);

        } else if (this.type.toLocaleLowerCase() === 'loan') {
            if (!this.returnDate) {
                validationResult.errors.push(MedicineRequest.ERROR_EMPTY_RETURN_DATE);
            } else {
                let returnedDate = new Date(this.returnDate);
                let timeNow = new Date(Date.now());
                const date = Date.parse(this.returnDate);
                this.validateDate(date, validationResult, returnedDate, timeNow);
            }
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

    private validateDate(date: number, validationResult: ValidationResult, returnedDate: Date, timeNow: Date) {
        if (Number.isNaN(date) || date <= 0) {
            validationResult.errors.push(MedicineRequest.ERROR_RETURN_DATE_INVALID);
        }
        if (returnedDate.getFullYear() < timeNow.getFullYear()) {
            validationResult.errors.push(MedicineRequest.ERROR_RETURN_DATE_FROM_PAST);
        }
        else if (returnedDate.getFullYear() === timeNow.getFullYear()) {
            if (returnedDate.getMonth() < timeNow.getMonth()) {
                validationResult.errors.push(MedicineRequest.ERROR_RETURN_DATE_FROM_PAST);
            }
            else if ((returnedDate.getMonth() === timeNow.getMonth()) &&
                (returnedDate.getDate() < timeNow.getDate())) {
                validationResult.errors.push(MedicineRequest.ERROR_RETURN_DATE_FROM_PAST);
            }
        }
    }
}
