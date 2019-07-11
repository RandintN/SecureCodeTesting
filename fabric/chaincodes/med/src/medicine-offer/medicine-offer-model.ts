import { IExchangeJson } from '../exchange/exchange-json';
import { Exchange } from '../exchange/exchange-model';
import { MedicineOfferModel } from './medicine-offer-model-base';
import { DateExtension } from '../utils/date-extension';
import { MedicineStatusEnum, RequestMode } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidator } from '../validation/validator-interface';
import { IMedicineOfferJson } from './medicine-offer-json';
import { IMedicineOfferClaPharmIndJson } from './medicine-offer-classification-pharma-industry-json';

export class MedicineOffer implements IValidator {
    //#region constants
    private static ERROR_EMPTY_AMOUNT: ValidationError =
        new ValidationError('MO-001', 'The parameter amount cannot be empty or null');

    private static ERROR_EMPTY_TYPE: ValidationError =
        new ValidationError('MO-002', 'The parameter type cannot be empty or null');

    private static ERROR_EMPTY_EXCHANGE: ValidationError =
        new ValidationError('MO-003', 'The parameter exchange cannot be empty or null');

    private static ERROR_EMPTY_RETURN_DATE: ValidationError = new ValidationError
        ('MO-004', 'The parameter return_date cannot be empty or null when the medicine type is loan');

    private static ERROR_EMPTY_OFFER_ID: ValidationError = new ValidationError
        ('MO-005', 'The parameter offer_id cannot be empty or null');

    //#endregion
    public amount: string;
    public medicine: MedicineOfferModel;
    public type: string;
    public returnDate: string;
    public exchange: Exchange[];
    public status: any;
    public offer_id : string;

    public fromJson(medicineOfferJson: IMedicineOfferJson): void {
        this.amount = medicineOfferJson.amount;
        this.returnDate = medicineOfferJson.return_date;
        this.type = medicineOfferJson.type;
        this.status = medicineOfferJson.status ? medicineOfferJson.status
            : MedicineStatusEnum.WAITING_FOR_APPROVAL;

        const medicineOffer: MedicineOfferModel = new MedicineOfferModel();
        if (medicineOfferJson.medicine) {
            medicineOffer.fromJson(medicineOfferJson.medicine);
        }

        this.medicine = medicineOffer;

        const exchanges: Exchange[] = [];

        if (medicineOfferJson.exchange) {
            for (const exchangeJson of medicineOfferJson.exchange) {
                const exchange: Exchange = new Exchange();
                exchange.fromJson(exchangeJson);
                exchanges.push(exchange);

            }

        }

        this.exchange = exchanges;

        this.offer_id = medicineOfferJson.offer_id;
    }

    public toJson(): IMedicineOfferJson {
        const medicineInitialJson: IMedicineOfferClaPharmIndJson = this.medicine.toJson();
        const exchangesJson: IExchangeJson[] = [];

        for (const exchange of this.exchange) {
            const exchangeJson: IExchangeJson = exchange.toJson();
            exchangesJson.push(exchangeJson);

        }

        const medicineOfferJson: IMedicineOfferJson = {
            amount: this.amount,
            exchange: exchangesJson,
            medicine: medicineInitialJson,
            return_date: this.returnDate ? this.returnDate : undefined,
            status: this.status,
            type: this.type,
            offer_id: this.offer_id

        };

        return medicineOfferJson;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();

        if (!this.amount) {
            validationResult.errors.push(MedicineOffer.ERROR_EMPTY_AMOUNT);

        }

        const medicineValidation: ValidationResult = this.medicine.isValid();

        if (!medicineValidation.isValid) {
            validationResult.addErrors(medicineValidation.errors);

        }

        if (!this.type) {
            validationResult.errors.push(MedicineOffer.ERROR_EMPTY_TYPE);

        } else if (this.type.toLocaleLowerCase() === RequestMode.LOAN) {
            if (!this.returnDate) {
                validationResult.errors.push(MedicineOffer.ERROR_EMPTY_RETURN_DATE);
            } else {
                const dateExtension: DateExtension = new DateExtension();
                dateExtension.validateDate(this.returnDate, validationResult);
            }
        } else {
            this.returnDate = null;
        }
        if (!this.exchange) {
            validationResult.errors.push(MedicineOffer.ERROR_EMPTY_EXCHANGE);

        } else {
            for (const exchange of this.exchange) {
                const exchangeValidation: ValidationResult = exchange.isValid();
                if (!exchangeValidation.isValid) {
                    validationResult.addErrors(exchangeValidation.errors);

                }

            }

        }
        if(!this.offer_id){
            validationResult.errors.push(MedicineOffer.ERROR_EMPTY_OFFER_ID);
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }
}
