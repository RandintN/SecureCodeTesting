import { Context } from 'fabric-contract-api';
import { ChaincodeResponse } from 'fabric-shim';

/**
 * @author vpoliveira - CPqD
 * Interface with the methods of services of MedicineOfferedRequest.
 *
 * Theses Methods are tipically exposed as interface of the chaincode.
 */
export interface IMedicineOfferedRequestService {

    /**
     * Method to medicine offered request.
     *
     * @param ctx Context of transaction
     * @param offerMedRequestJson Offer medicine request json, thats must have to implement the interface
     * IMedicineOfferedRequestService
     * @returns If success, returns 201 (created) and the timestamp of transaction, otherwise, will return one of the
     * following status and a list of errors:
     * - 400 (bad request)
     * - 401 (forbidden)
     * - 404 (not found)
     * - 500 (internal error)
     */
    offerMedicineRequest(ctx: Context, offerMedRequestJson: string): Promise<ChaincodeResponse>;

}
