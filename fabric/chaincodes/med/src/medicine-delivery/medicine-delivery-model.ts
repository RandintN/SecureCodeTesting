import { ValidationError } from '../validation/validation-error-model';
import { ValidationResult } from '../validation/validation-model';
import { IValidator } from '../validation/validator-interface';
import { IMedicineDeliveryJson } from './medicine-delivery-json';
import { IMedicineProposedLedgerJson } from '../propose/medicine-proposed-ledger-json';
import { Context } from 'fabric-contract-api';
import { Iterators } from 'fabric-shim';
import { MedicineProposedStatusEnum } from '../utils/enums';

export class MedicineDelivery implements IValidator {
    //#region constants
    private static ERROR_EMPTY_CONSUMER_NAME: ValidationError =
        new ValidationError('MDEL-001', 'The parameter consumer_name cannot be empty or null');

    private static ERROR_EMPTY_CONSUMER_ID_TYPE: ValidationError =
        new ValidationError('MDEL-002', 'The parameter type of consumer_id cannot be empty or null');

    private static ERROR_EMPTY_CONSUMER_ID_NUMBER: ValidationError =
        new ValidationError('MDEL-003', 'The parameter number of consumer_id cannot be empty or null');

    private static ERROR_EMPTY_DATE: ValidationError = new ValidationError
        ('MDEL-004', 'The parameter date cannot be empty or null');

    //private static ERROR_EMPTY_PROPOSE_ID: ValidationError = new ValidationError
    //    ('MDEL-005', 'The parameter propose_id cannot be empty or null');

    //private static ERROR_EMPTY_ID: ValidationError = new ValidationError
    //    ('MDEL-006', 'The parameter id cannot be empty or null');

    //Tepelhone number is now an optional attribute.
    //private static ERROR_EMPTY_CONSUMER_DDD_NUMBER: ValidationError = new ValidationError
    //    ('MDEL-007', 'The parameter ddd of consumer_phone cannot be empty or null');

    //private static ERROR_EMPTY_CONSUMER_PHONE_NUMBER: ValidationError = new ValidationError
    //    ('MDEL-008', 'The parameter number of consumer_phone cannot be empty or null');
    //#endregion
    consumerIdNumber:       string;
    consumerIdType:         string;
    consumerName :          string;
    notes:                  string;
    consumerDdd:            string;
    consumerPhoneNumber:    string;
    date:                   string;
    propose:                IMedicineProposedLedgerJson

    public async fromJson(ctx: Context, medicineDeliveryJson: IMedicineDeliveryJson): Promise<boolean> {

        if(medicineDeliveryJson.propose_id) {
            //Checa se existe uma proposta aceita relacionada ao id informado.
            this.propose = await this.searchProposedMedicineByProposeId(ctx, medicineDeliveryJson.propose_id
                , MedicineProposedStatusEnum.ACCEPTED);
            if(!this.propose) {
                //Se não retornou uma proposta aceita, provavelmente se trata
                //de uma proposta na modalidade empréstimo. Neste caso,
                //pode ser de um medicamento que já tenha sido retirado
                //e está sendo devolvido.
                //Se é este o caso, seu status deve ser DELIVERED.
                this.propose = await this.searchProposedMedicineByProposeId(ctx, medicineDeliveryJson.propose_id
                    , MedicineProposedStatusEnum.DELIVERED);
            }
        }

        //Se mesmo assim, não houve um registro relacionado,
        //a operação não deve ser considerada válida.
        if(!this.propose){
            return false;
        }

        this.consumerIdNumber = medicineDeliveryJson.consumer_id.number;
        this.consumerIdType = medicineDeliveryJson.consumer_id.type;
        this.consumerName = medicineDeliveryJson.consumer_name;
        this.notes = medicineDeliveryJson.notes;
        this.consumerDdd = medicineDeliveryJson.consumer_phone.ddd;
        this.consumerPhoneNumber = medicineDeliveryJson.consumer_phone.number;
        this.date = medicineDeliveryJson.date;
        return true;
    }

    public toJson(): IMedicineDeliveryJson {
        
        const medicineDeliveryJson: IMedicineDeliveryJson = {
            key:            this.propose.key,
            msp_id:         this.propose.msp_id,
            id:             this.propose.id,
            amount:         this.propose.amount,
            medicine:       this.propose.medicine,
            type:           this.propose.type,
            new_return_date:this.propose.new_return_date,
            status:         this.propose.status,
            observations:   this.propose.observations,
            propose_id:     this.propose.propose_id,
            operation:      this.propose.operation,
            exchange:       this.propose.exchange,
            consumer_id: {
                "number": this.consumerIdNumber, 
                "type": this.consumerIdType},
            consumer_name : this.consumerName,
            notes: this.notes,
            consumer_phone: {
                "ddd": this.consumerDdd,
                "number": this.consumerPhoneNumber
            },
            date: this.date
        };

        return medicineDeliveryJson;
    }

    public isValid(): ValidationResult {
        const validationResult: ValidationResult = new ValidationResult();

        //if(!this.propose.id){
        //    validationResult.errors.push(MedicineDelivery.ERROR_EMPTY_ID);
        //}

        //if(!this.propose.propose_id){
        //    validationResult.errors.push(MedicineDelivery.ERROR_EMPTY_PROPOSE_ID);
        //}

        if(!this.consumerName){
            validationResult.errors.push(MedicineDelivery.ERROR_EMPTY_CONSUMER_NAME);
        }

        if(!this.consumerIdType){
            validationResult.errors.push(MedicineDelivery.ERROR_EMPTY_CONSUMER_ID_TYPE);
        }

        if(!this.consumerIdNumber){
            validationResult.errors.push(MedicineDelivery.ERROR_EMPTY_CONSUMER_ID_NUMBER);
        }

        //if(!this.consumerDdd){
        //    validationResult.errors.push(MedicineDelivery.ERROR_EMPTY_CONSUMER_DDD_NUMBER);
        //}

        //if(!this.consumerPhoneNumber){
        //    validationResult.errors.push(MedicineDelivery.ERROR_EMPTY_CONSUMER_PHONE_NUMBER);
        //}

        if(!this.date){
            validationResult.errors.push(MedicineDelivery.ERROR_EMPTY_DATE);
        }

        validationResult.isValid = validationResult.errors.length < 1;

        return validationResult;
    }

    private async searchProposedMedicineByProposeId(ctx: Context, proposeId: string, statusOffer: string)
        : Promise<IMedicineProposedLedgerJson> {

        // Creates QueryJson of couchDB index query
        const queryJson = {
            selector: {
                propose_id: proposeId,
                status: statusOffer,
            },
        };

        // Getting query result
        const iterator: Iterators.StateQueryIterator = await ctx.stub.getQueryResult(JSON.stringify(queryJson));
        const result: IMedicineProposedLedgerJson = await this.getOfferMedicineByRequesId(iterator);
        return result;
    }

    /**
     * Auxiliar method that's iterate over an interator of offer medicine request to retrieve the query result.
     * @param iterator iterator
     */
    private async getOfferMedicineByRequesId(iterator: Iterators.StateQueryIterator)
        : Promise<IMedicineProposedLedgerJson> {

        let offer: IMedicineProposedLedgerJson;

        const result = await iterator.next();

        if (result.value && result.value.value.toString()) {
            offer = JSON.parse(result.value.value.toString('utf8')) as IMedicineProposedLedgerJson;
            offer.key = result.value.getKey();
        }

        return offer;
    }
}