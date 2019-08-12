import { MedicineProposedStatusEnum, RequestMode, MedicineOperationEnum } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidator } from '../validation/validator-interface';
import { IMedicineProposedJson } from './medicine-proposed-json';
import { MedicineProposedToRequest } from '../medicine-proposed/medicine-proposed-to-request-model';
import { IProposeToRequestJson } from './propose-to-request-json';
import { IMedicineExchangeJson } from '../medicine-exchange/medicine-exchange-json';
import { IMedicineProposeExchangeJson } from './medicine-propose-exchange-json';

export class ProposeToRequest implements IValidator {

    //#region constants
    private static ERROR_EMPTY_ID: ValidationError =
        new ValidationError('MOR-001', 'The parameter request_id cannot be empty or null');

    private static ERROR_EMPTY_MEDICINE_OFFERED: ValidationError =
        new ValidationError('MOR-002', 'The parameter medicine cannot be empty or null');

    private static ERROR_EMPTY_TYPE: ValidationError =
        new ValidationError('MOR-003', 'The parameter type cannot be empty or null');

    private static ERROR_TYPE_IS_NOT_IMPLEMENTED: ValidationError =
        new ValidationError('MOR-004', 'The request type exchange is not implemented.');

    private static ERROR_EMPTY_PROPOSE_ID: ValidationError =
        new ValidationError('MOR-004', 'The parameter offer_id cannot be empty or null.');
    //#endregion

    public id: string;
    public internalId: string;
    public proposeId : string;
    public internalProposeId : string;
    public medicine: MedicineProposedToRequest;
    public type: string;
    public newReturnDate: string;
    public status: MedicineProposedStatusEnum;
    public observations: string;
    public operation:      MedicineOperationEnum;
    public exchange:    IMedicineProposeExchangeJson;
    

    public fromJson(medicineOfferedRequestJson: IProposeToRequestJson): void {
        this.id = medicineOfferedRequestJson.id;
        this.type = medicineOfferedRequestJson.type;
        this.newReturnDate = medicineOfferedRequestJson.new_return_date;
        this.observations = medicineOfferedRequestJson.observations;
        this.proposeId = medicineOfferedRequestJson.propose_id;

        this.medicine = new MedicineProposedToRequest();
        if (medicineOfferedRequestJson.medicine) {
            this.medicine.fromJson(medicineOfferedRequestJson.medicine);
        }
        this.operation = MedicineOperationEnum.REQUEST;
    }

    public toJson(): IMedicineProposedJson {
        const medicineOfferedRequestJson: IMedicineProposedJson = {
            medicine: this.medicine.toJson(),
            new_return_date: this.newReturnDate,
            observations: this.observations,
            id: this.id,
            status: this.status,
            type: this.type,
            propose_id: this.proposeId,
            operation: this.operation,
            exchange: this.exchange
        };

        return medicineOfferedRequestJson;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();

        if (!this.type) {
            validationResult.addError(ProposeToRequest.ERROR_EMPTY_TYPE);

        } else if (this.type.toLocaleLowerCase() === RequestMode.EXCHANGE) {
            validationResult.addError(ProposeToRequest.ERROR_TYPE_IS_NOT_IMPLEMENTED);
        }

        if (!this.id) {
            validationResult.addError(ProposeToRequest.ERROR_EMPTY_ID);
        }

        if (!this.proposeId) {
            validationResult.addError(ProposeToRequest.ERROR_EMPTY_PROPOSE_ID);
        }

        if (!this.medicine || Object.keys(this.medicine).length === 0) {

            validationResult.addError(ProposeToRequest.ERROR_EMPTY_MEDICINE_OFFERED);
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }
}
