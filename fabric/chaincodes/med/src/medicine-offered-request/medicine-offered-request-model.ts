import { MedicineOffered } from '../medicine-offered/medicine-offered-model';
import { MedicineOfferedStatusEnum, RequestMode } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidator } from '../validation/validator-interface';
import { IMedicineOfferedRequestJson } from './medicine-offered-request-json';

export class MedicineOfferedRequest implements IValidator {

    //#region constants
    private static ERROR_EMPTY_REQUEST_ID: ValidationError =
        new ValidationError('MOR-001', 'The parameter request_id cannot be empty or null');

    private static ERROR_EMPTY_MEDICINE_OFFERED: ValidationError =
        new ValidationError('MOR-002', 'The parameter medicine cannot be empty or null');

    private static ERROR_EMPTY_TYPE: ValidationError =
        new ValidationError('MOR-003', 'The parameter type cannot be empty or null');

    private static ERROR_TYPE_IS_NOT_IMPLEMENTED: ValidationError =
        new ValidationError('MOR-004', 'The request type exchange is not implemented.');

    private static ERROR_EMPTY_OFFER_ID: ValidationError =
        new ValidationError('MOR-004', 'The parameter offer_id cannot be empty or null.');
    //#endregion

    public requestId: string;
    public medicine: MedicineOffered;
    public type: string;
    public newReturnDate: string;
    public status: MedicineOfferedStatusEnum;
    public observations: string;
    public offerId : string;

    public fromJson(medicineOfferedRequestJson: IMedicineOfferedRequestJson): void {
        this.requestId = medicineOfferedRequestJson.request_id;
        this.type = medicineOfferedRequestJson.type;
        this.newReturnDate = medicineOfferedRequestJson.new_return_date;
        this.observations = medicineOfferedRequestJson.observations;
        this.offerId = medicineOfferedRequestJson.offer_id;

        this.medicine = new MedicineOffered();
        if (medicineOfferedRequestJson.medicine) {
            this.medicine.fromJson(medicineOfferedRequestJson.medicine);
        }

    }

    public toJson(): IMedicineOfferedRequestJson {
        const medicineOfferedRequestJson: IMedicineOfferedRequestJson = {
            medicine: this.medicine.toJson(),
            new_return_date: this.newReturnDate,
            observations: this.observations,
            request_id: this.requestId,
            status: this.status,
            type: this.type,
            offer_id: this.offerId
        };

        return medicineOfferedRequestJson;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();

        if (!this.type) {
            validationResult.addError(MedicineOfferedRequest.ERROR_EMPTY_TYPE);

        } else if (this.type.toLocaleLowerCase() === RequestMode.EXCHANGE) {
            validationResult.addError(MedicineOfferedRequest.ERROR_TYPE_IS_NOT_IMPLEMENTED);
        }

        if (!this.requestId) {
            validationResult.addError(MedicineOfferedRequest.ERROR_EMPTY_REQUEST_ID);
        }

        if (!this.offerId) {
            validationResult.addError(MedicineOfferedRequest.ERROR_EMPTY_OFFER_ID);
        }

        if (!this.medicine || Object.keys(this.medicine).length === 0) {

            validationResult.addError(MedicineOfferedRequest.ERROR_EMPTY_MEDICINE_OFFERED);
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }
}
