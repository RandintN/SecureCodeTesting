import { MedicineOffered } from '../medicine-offered/medicine-offered-model';
import { MedicineRequestStatusEnum } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidator } from '../validation/validator-interface';
import { IMedicineOfferedRequestJson } from './medicine-offered-request-json';

export class MedicineOfferedRequest implements IValidator {

    //#region constants
    private static ERROR_EMPTY_REQUEST_ID: ValidationError =
        new ValidationError('MOR-001', 'The parameter request_id cannot be empty or null');

    private static ERROR_EMPTY_AMOUNT: ValidationError =
        new ValidationError('MOR-002', 'The parameter amount cannot be empty or null');

    private static ERROR_EMPTY_MEDICINE_OFFERED: ValidationError =
        new ValidationError('MOR-003', 'The parameter medicine cannot be empty or null');

    private static ERROR_EMPTY_TYPE: ValidationError =
        new ValidationError('MOR-004', 'The parameter type cannot be empty or null');

    //#endregion

    public requestId: string;
    public amount: string;
    public medicine: MedicineOffered;
    public type: string;
    public newReturnDate: string;
    public exchange: MedicineOffered;
    public status: MedicineRequestStatusEnum;
    public observations: string;

    public fromJson(medicineOfferedRequestJson: IMedicineOfferedRequestJson): void {
        this.requestId = medicineOfferedRequestJson.request_id;
        this.amount = medicineOfferedRequestJson.amount;
        this.type = medicineOfferedRequestJson.type;
        this.newReturnDate = medicineOfferedRequestJson.new_return_date;
        this.status = MedicineRequestStatusEnum.WAITING_FOR_APPROVAL;
        this.observations = medicineOfferedRequestJson.observations;

        this.medicine = new MedicineOffered();
        if (medicineOfferedRequestJson.medicine) {
            this.medicine.fromJson(medicineOfferedRequestJson.medicine);
        }

        this.exchange = new MedicineOffered();
        if (medicineOfferedRequestJson.exchange) {
            this.exchange.fromJson(medicineOfferedRequestJson.exchange);
        }
    }

    public toJson(): IMedicineOfferedRequestJson {
        const medicineOfferedRequestJson: IMedicineOfferedRequestJson = {
            amount: this.amount,
            exchange: this.exchange.toJson(),
            medicine: this.medicine.toJson(),
            new_return_date: this.newReturnDate,
            observations: this.observations,
            request_id: this.requestId,
            status: this.status,
            type: this.type,

        };

        return medicineOfferedRequestJson;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();

        if (!this.requestId) {
            validationResult.addError(MedicineOfferedRequest.ERROR_EMPTY_REQUEST_ID);
        }
        if (!this.amount) {
            validationResult.addError(MedicineOfferedRequest.ERROR_EMPTY_AMOUNT);

        }

        if (!this.medicine || Object.keys(this.medicine).length === 0) {

            validationResult.addError(MedicineOfferedRequest.ERROR_EMPTY_MEDICINE_OFFERED);
        }

        if (!this.type) {
            validationResult.addError(MedicineOfferedRequest.ERROR_EMPTY_TYPE);

        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }
}
