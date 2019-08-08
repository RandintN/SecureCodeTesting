import { Context } from 'fabric-contract-api';
import { ChaincodeResponse, Iterators } from 'fabric-shim';
import { ResponseUtil } from '../result/response-util';
import { CommonConstants } from '../utils/common-messages';
import { ValidationError } from '../validation/validation-error-model';
import { Result } from '../result/result';
import { MedicineDelivery } from './medicine-delivery-model';
import { IMedicineDeliveryJson } from './medicine-delivery-json';
import { IMedicineProposedLedgerJson } from '../propose/medicine-proposed-ledger-json';
import { MedicineProposedStatusEnum } from '../utils/enums';

export class MedicineDeliveryDomain {

    private static ERROR_MEDICINE_OFFER_NOT_FOUND: ValidationError =
        new ValidationError('MRD-002',
            'The medicine offer was not found.');

    private static ERROR_MEDICINE_DELIVERED: ValidationError =
            new ValidationError('MRD-008',
            'The medicine requested is already marked as delivered.');
            

    public async medicineDeliveryConfirmation(ctx: Context, deliveryJson: string): Promise<ChaincodeResponse>  {

        try {

            const medicineDelivery: MedicineDelivery = new MedicineDelivery();
            medicineDelivery.fromJson(JSON.parse(deliveryJson) as IMedicineDeliveryJson);

            const medicineToDeliver: IMedicineProposedLedgerJson
                = await this.searchProposedMedicineByProposeId(ctx, medicineDelivery.proposeId
                    , MedicineProposedStatusEnum.ACCEPTED);

            if (!medicineToDeliver) {
                return ResponseUtil.ResponseNotFound(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineDeliveryDomain.ERROR_MEDICINE_OFFER_NOT_FOUND)));
            }

            if (medicineToDeliver.status != MedicineProposedStatusEnum.DELIVERED){
                medicineToDeliver.status = MedicineProposedStatusEnum.DELIVERED;
                await ctx.stub.putState(medicineToDeliver.key, Buffer.from(JSON.stringify(medicineToDeliver)));
                console.log("Medicine Delivered id: "+medicineToDeliver.key);
                console.log('Medicine Status: '      +medicineToDeliver.status);
                const result: Result = new Result();
                result.timestamp = new Date().getTime();
                return ResponseUtil.ResponseOk(Buffer.from(JSON.stringify(result)));
            } else {
                return ResponseUtil.ResponseNotFound(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(MedicineDeliveryDomain.ERROR_MEDICINE_DELIVERED)));
            }

        } catch (error) {
            console.log(error);
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    private async searchProposedMedicineByProposeId(ctx: Context, requestId: string, statusOffer: string)
        : Promise<IMedicineProposedLedgerJson> {

        // Creates QueryJson of couchDB index query
        const queryJson = {
            selector: {
                propose_id: requestId,
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