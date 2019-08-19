import { IRequestExchangeJson } from './exchange-json';
import { RequestExchange } from './exchange-model';
import { MedicineRequestModel } from './medicine-request-model-base';
import { DateExtension } from '../utils/date-extension';
import { MedicineStatusEnum, RequestMode, MedicineOperationEnum } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidator } from '../validation/validator-interface';
import { IMedicineRequestJson } from './medicine-request-json';
import { IMedicineRequestClaPharmIndJson } from '../medicine/medicine-initial-transaction-json';

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

    private static ERROR_EMPTY_REQUEST_ID: ValidationError = new ValidationError
        ('MR-005', 'The parameter id cannot be empty or null');

    //#endregion
    public amount: string;
    public medicine: MedicineRequestModel;
    public type: string;
    public returnDate: string;
    public exchange: RequestExchange[];
    public status: any;
    public foreignId : string;
    public internalId : string;

    public fromJson(medicineRequestJson: IMedicineRequestJson): void {
        this.amount = medicineRequestJson.amount;
        this.returnDate = medicineRequestJson.return_date;
        this.type = medicineRequestJson.type;
        this.status = medicineRequestJson.status ? medicineRequestJson.status
            : MedicineStatusEnum.WAITING_FOR_APPROVAL;

        const medicineOffer: MedicineRequestModel = new MedicineRequestModel();
        if (medicineRequestJson.medicine) {
            medicineOffer.fromJson(medicineRequestJson.medicine);
        }

        this.medicine = medicineOffer;

        const exchanges: RequestExchange[] = [];

        if (medicineRequestJson.exchange) {
            for (const exchangeJson of medicineRequestJson.exchange) {
                const exchange: RequestExchange = new RequestExchange();
                exchange.fromJson(exchangeJson);
                exchanges.push(exchange);

            }

        }

        this.exchange = exchanges;

        this.foreignId = medicineRequestJson.id;
        this.internalId = medicineRequestJson.internal_id;
    }

    public toJson(): IMedicineRequestJson {
        const medicineInitialJson: IMedicineRequestClaPharmIndJson = this.medicine.toJson();
        const exchangesJson: IRequestExchangeJson[] = [];

        for (const exchange of this.exchange) {
            const exchangeJson: IRequestExchangeJson = exchange.toJson();
            exchangesJson.push(exchangeJson);

        }

        const medicineRequestJson: IMedicineRequestJson = {
            amount: this.amount,
            exchange: exchangesJson,
            medicine: medicineInitialJson,
            return_date: this.returnDate ? this.returnDate : undefined,
            status: this.status,
            type: this.type,
            id: this.foreignId,
            internal_id: this.internalId,
            operation: MedicineOperationEnum.REQUEST

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

        } else if (this.type.toLocaleLowerCase() === RequestMode.LOAN) {
            if (!this.returnDate) {
                validationResult.errors.push(MedicineRequest.ERROR_EMPTY_RETURN_DATE);
            } else {
                const dateExtension: DateExtension = new DateExtension();
                dateExtension.validateDate(this.returnDate, validationResult);
            }
        } else {
            this.returnDate = null;
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
        if(!this.foreignId){
            validationResult.errors.push(MedicineRequest.ERROR_EMPTY_REQUEST_ID);
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }
}
