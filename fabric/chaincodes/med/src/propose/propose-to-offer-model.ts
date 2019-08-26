import { MedicineProposedToOffer } from '../medicine-proposed/medicine-proposed-to-offer-model';
import { MedicineProposedStatusEnum, TradeMode, MedicineOperationEnum } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidator } from '../validation/validator-interface';
import { IProposedJson } from './medicine-proposed-json';
import { MedicineProposeExchange } from './medicine-exchange-model';
import { ProposedExchange } from './exchange-model';

export class ProposeToOffer implements IValidator {

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

    private static ERROR_NEGOTIATION_IS_NEEDED: ValidationError =
        new ValidationError('MOR-005',
            'When the negotiation have a type as exchange, one exchange is necessary.');

    private static ERROR_EMPTY_AMOUNT: ValidationError =
            new ValidationError('MO-008', 'The parameter amount cannot be empty or null');
    //#endregion

    public id: string;
    public internalId: string;
    public proposeId : string;
    public internalProposeId : string;
    public amount: string;
    public medicine: MedicineProposedToOffer;
    public type: string;
    public newReturnDate: string;
    public status: MedicineProposedStatusEnum;
    public observations: string;
    public operation:      MedicineOperationEnum;
    public exchange:    ProposedExchange;
    

    public fromJson(proposeToOfferJson: IProposedJson): void {
        this.id = proposeToOfferJson.id;
        this.type = proposeToOfferJson.type;
        this.newReturnDate = proposeToOfferJson.new_return_date;
        this.observations = proposeToOfferJson.observations;
        this.proposeId = proposeToOfferJson.propose_id;
        this.amount = proposeToOfferJson.amount;
        this.medicine = new MedicineProposedToOffer();
        if (proposeToOfferJson.medicine) {
            this.medicine.fromJson(proposeToOfferJson.medicine);
        }
        this.operation = MedicineOperationEnum.OFFER;
        this.exchange = new ProposedExchange();
        this.exchange.medicine = new MedicineProposeExchange();
        if(proposeToOfferJson.exchange) {
            this.exchange.fromJson(proposeToOfferJson.exchange);
        }

    }

    public toJson(): IProposedJson {
        const medicineOfferedRequestJson: IProposedJson = {
            amount: this.amount,
            medicine: this.medicine.toJson(),
            new_return_date: this.newReturnDate,
            observations: this.observations,
            id: this.id,
            status: this.status,
            type: this.type,
            propose_id: this.proposeId,
            operation: this.operation,
            exchange: this.exchange.toJson()
        };

        return medicineOfferedRequestJson;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();

        if (!this.amount) {
            validationResult.addError(ProposeToOffer.ERROR_EMPTY_AMOUNT);

        }

        if (!this.type) {
            validationResult.addError(ProposeToOffer.ERROR_EMPTY_TYPE);

        } else if (this.type.toLocaleLowerCase() === TradeMode.EXCHANGE && (!this.exchange || Object.keys(this.exchange).length === 0 || Object.keys(this.exchange.medicine).length === 0)) {
            validationResult.addError(ProposeToOffer.ERROR_NEGOTIATION_IS_NEEDED);
        }

        if (!this.id) {
            validationResult.addError(ProposeToOffer.ERROR_EMPTY_ID);
        }

        if (!this.proposeId) {
            validationResult.addError(ProposeToOffer.ERROR_EMPTY_PROPOSE_ID);
        }

        if (!this.medicine || Object.keys(this.medicine).length === 0) {

            validationResult.addError(ProposeToOffer.ERROR_EMPTY_MEDICINE_OFFERED);
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }
}
