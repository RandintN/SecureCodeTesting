import { IExchangeJson } from '../exchange/exchange-json';
import { Exchange } from '../exchange/exchange-model';
import { IMedicineOfferJson } from '../medicine-offer/medicine-offer-json';
import { MedicineOffer } from '../medicine-offer/medicine-offer-model';
import { DateExtension } from '../utils/date-extension';
import { MedicineRequestStatusEnum, RequestMode } from '../utils/enums';
import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidator } from '../validation/validator-interface';
import { IMedicineDeliveryJson } from './medicine-delivery-json';

export class MedicineDelivery implements IValidator {
    //#region constants
    private static ERROR_EMPTY_AMOUNT: ValidationError =
        new ValidationError('MR-001', 'The parameter amount cannot be empty or null');

    private static ERROR_EMPTY_TYPE: ValidationError =
        new ValidationError('MR-002', 'The parameter type cannot be empty or null');

    private static ERROR_EMPTY_EXCHANGE: ValidationError =
        new ValidationError('MR-003', 'The parameter exchange cannot be empty or null');

    private static ERROR_EMPTY_RETURN_DATE: ValidationError = new ValidationError
        ('MR-004', 'The parameter return_date cannot be empty or null when the medicine request type is loan');

    private static ERROR_EMPTY_OFFER_ID: ValidationError = new ValidationError
        ('MDEL-005', 'The parameter offer_id cannot be empty or null');

    //#endregion
    offerId: string;
    consumerIdNumber: string;
    consumerIdType: string;
    consumerName : string;
    notes: string;
    consumerDdd: string;
    consumerPhoneNumber: string;
    withdrawalDate: string;
    medication_delivered: boolean;

    public fromJson(medicineDeliveryJson: IMedicineDeliveryJson): void {
        this.offerId = medicineDeliveryJson.offer_id;
        this.consumerIdNumber = medicineDeliveryJson.consumer_id.number;
        this.consumerIdType = medicineDeliveryJson.consumer_id.type;
        this.consumerName = medicineDeliveryJson.consumer_name;
        this.notes = medicineDeliveryJson.notes;
        this.consumerDdd = medicineDeliveryJson.consumer_phone.ddd;
        this.consumerPhoneNumber = medicineDeliveryJson.consumer_phone.number;
        this.withdrawalDate = medicineDeliveryJson.withdrawal_date;
    }

    public toJson(): IMedicineDeliveryJson {
        
        const medicineDeliveryJson: IMedicineDeliveryJson = {
            offer_id: this.offerId,
            consumer_id: {
                "number": this.consumerIdNumber, 
                "type": this.consumerIdType},
            consumer_name : this.consumerName,
            notes: this.notes,
            consumer_phone: {
                "ddd": this.consumerDdd,
                "number": this.consumerPhoneNumber
            },
            withdrawal_date: this.withdrawalDate

        };

        return medicineDeliveryJson;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();
        
        if(!this.offerId){
            validationResult.errors.push(MedicineDelivery.ERROR_EMPTY_OFFER_ID);
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }
}