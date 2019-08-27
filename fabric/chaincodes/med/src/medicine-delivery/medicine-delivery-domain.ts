import { Context } from 'fabric-contract-api';
import { ChaincodeResponse, Iterators } from 'fabric-shim';
import { ResponseUtil } from '../result/response-util';
import { CommonConstants } from '../utils/common-messages';
import { ValidationError } from '../validation/validation-error-model';
import { Result } from '../result/result';
import { MedicineDelivery } from './medicine-delivery-model';
import { IMedicineDeliveryJson } from './medicine-delivery-json';
import { MedicineProposedStatusEnum, TradeStatusEnum, TradeMode } from '../utils/enums';
import { ValidationResult } from '../validation/validation-model';
import { IMedicineRequestJson as IMedicineBaseJson} from '../medicine-request/medicine-request-json';
import { IMedicineQueryKey } from '../medicine/medicine-query-key';

export class MedicineDeliveryDomain {

    private medicineTrade:      IMedicineBaseJson;

    private static ERROR_TRADE_NOT_FOUND: ValidationError =
        new ValidationError('MRD-001',
            'The medicine trade was not found.');

    private static ERROR_MEDICINE_PROPOSE_NOT_FOUND: ValidationError =
        new ValidationError('MRD-002',
            'The medicine propose was not found.');

    private static ERROR_TRADE_AND_PROPOSE_NOT_RELATED: ValidationError =
            new ValidationError('MRD-003',
                'The trade and propose do not associate to the same medicine.');
            

    public async medicineDeliveryConfirmation(ctx: Context, deliveryJson: string): Promise<ChaincodeResponse>  {

        try {

            //To validate if there's some query corresponding with the
            //given id and if it belongs to an trade waiting for withdraw.
            if (!(await this.hasValidTrade(ctx, deliveryJson))) {
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineDeliveryDomain.ERROR_TRADE_NOT_FOUND)));
            }

            const medicineDelivery: MedicineDelivery = new MedicineDelivery();
            if(!await medicineDelivery.fromJson(ctx, JSON.parse(deliveryJson) as IMedicineDeliveryJson)){
                return ResponseUtil.ResponseNotFound(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineDeliveryDomain.ERROR_MEDICINE_PROPOSE_NOT_FOUND)));
            }

            //Check if both trade and propose are related
            //to the same transaction.
            if(this.medicineTrade.id !== medicineDelivery.propose.id){
                return ResponseUtil.ResponseNotFound(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineDeliveryDomain.ERROR_TRADE_AND_PROPOSE_NOT_RELATED)));
            }

            // Make basic validations
            //----------------------------
            const deliveryBasicValidation: ValidationResult = medicineDelivery.isValid();

            if (!deliveryBasicValidation.isValid) {
                //Entrou no erro do isValid
                return ResponseUtil.ResponseBadRequest(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(deliveryBasicValidation.errors)));
            }

            if (medicineDelivery.propose.status != MedicineProposedStatusEnum.DELIVERED){
                //Mudar o status do propose
                medicineDelivery.propose.status = MedicineProposedStatusEnum.DELIVERED;
            }

            //Mudar o status do trade
            if(this.medicineTrade.type.toLocaleLowerCase() !== TradeMode.LOAN ) {
                //Se não for empréstimo, finaliza.
                this.medicineTrade.status = TradeStatusEnum.FINISHED;
            } else {
                //Já que é empréstimo, verifica se é retirada ou devolução:
                if(this.medicineTrade.status === TradeStatusEnum.WAITING_FOR_RETURN) {
                    //Devolução. Finaliza a operação.
                    this.medicineTrade.status = TradeStatusEnum.FINISHED;
                } else {
                    //Retirada. Portanto, indica que ele será retornado.
                    this.medicineTrade.status = TradeStatusEnum.WAITING_FOR_RETURN;
                }
            }

            //STORING TRANSACTION ON THE LEDGER -----------------
            await ctx.stub.putState(medicineDelivery.propose.key, Buffer.from(JSON.stringify(medicineDelivery.toJson())));
            await ctx.stub.putState(this.medicineTrade.internal_id, Buffer.from(JSON.stringify(this.medicineTrade)));
            //---------------------------------------------------

            console.log("Medicine Delivered id: "+medicineDelivery.propose.key);
            console.log('Medicine Status: '      +medicineDelivery.propose.status);
            const result: Result = new Result();
            result.timestamp = new Date().getTime();
            return ResponseUtil.ResponseOk(Buffer.from(JSON.stringify(result)));

        } catch (error) {
            console.log(error);
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    /**
     * Auxiliar method that indicates if the input reach a valid and waiting
     * for withdraw medicine trade. A medicine trade can be request or offer
     * @param ctx Context of operation
     * @param tradeJson the json with the information to be used
     */
    private async hasValidTrade(ctx: Context, tradeJson: string): Promise<boolean> {

        //Tenta ver se ele é uma retirada de medicamento
        this.medicineTrade = await this.searchMedicineWaitingForWithdraw(ctx, tradeJson);

        if (this.medicineTrade) {
            return true;
        }

        //Tenta ver se ele é uma devolução de medicamento
        this.medicineTrade = await this.searchMedicineWaitingForReturn(ctx, tradeJson);

        if (this.medicineTrade) {
            return true;
        }

        return false;
    }

    /**
     * This Method search for an accepted medicine propose.
     * @param ctx Context of operation
     * @param medObject the informations of the proposed medicine
     */
    private async searchMedicineWaitingForWithdraw(ctx: Context, medObject: string){
        // Retrieves query from string
        const query: IMedicineQueryKey = JSON.parse(medObject) as IMedicineQueryKey;

        // Creates the query of couchdb
        const queryJson = {
            selector:{
                id: query.id,
                status: TradeStatusEnum.WAITING_FOR_WITHDRAW
            }
        };

        const filter: string = JSON.stringify(queryJson);

        // Get Query
        const queryIterator: Iterators.StateQueryIterator = await ctx.stub.getQueryResult
        (filter);

        const medJson: IMedicineBaseJson = await this.getMedicine(queryIterator);

        return medJson;
    }

    /**
     * This Method search for an delivered medicine, but in loan modality.
     * @param ctx Context of operation
     * @param medObject the informations of the trade
     */
    private async searchMedicineWaitingForReturn(ctx: Context, medObject: string){
        // Retrieves query from string
        const query: IMedicineQueryKey = JSON.parse(medObject) as IMedicineQueryKey;

        // Creates the query of couchdb
        const queryJson = {
            selector:{
                id: query.id,
                status: TradeStatusEnum.WAITING_FOR_RETURN
            }
        };

        const filter: string = JSON.stringify(queryJson);

        // Get Query
        const queryIterator: Iterators.StateQueryIterator = await ctx.stub.getQueryResult
        (filter);

        const medJson: IMedicineBaseJson = await this.getMedicine(queryIterator);

        return medJson;
    }

    /**
     * Auxiliar method that iterates over an interator of medicine and mount the query result.
     * @param iterator iterator
     * @returns query results
     */
    private async getMedicine(iterator: Iterators.StateQueryIterator): Promise<IMedicineBaseJson> {

            const result = await iterator.next();
            let medicineJson: IMedicineBaseJson;

            if (result.value && result.value.value.toString()) {
                medicineJson = JSON.parse(result.value.value.toString('utf8')) as IMedicineBaseJson;
            }

        return medicineJson;
    }
}