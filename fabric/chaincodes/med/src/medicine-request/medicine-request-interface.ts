import { Context } from 'fabric-contract-api';
import { ChaincodeResponse } from 'fabric-shim';
import { MedicineRequestStatusEnum } from '../utils/enums';

/**
 * @author fmarino - CPqD
 * @author vpoliveira - CPqD
 * Interface with the methods of services of MedicineRequest.
 *
 * Theses Methods are tipically exposed as interface of the chaincode.
 */
export interface IMedicineRequestService {

    /**
     * Method to add a new medicine request.
     *
     * @param ctx Context of transaction
     * @param medRequestJson Medicine request json, thats must have to implement the interface IMedicineRequestJson
     * @returns If success, returns 201 (created) and the timestamp of transaction, otherwise, will return one of the
     * following status and a list of errors:
     * - 400 (bad request)
     * - 401 (forbidden)
     * - 404 (not found)
     * - 500 (internal error)
     */
    addMedicineRequest(ctx: Context, medRequestJson: string): Promise<ChaincodeResponse>;

    /**
     * Method to approve a pending medicine request (requests are pending when their types are equals 'exchange').
     *
     * @param ctx Context of transaction
     * @param medRequestJson json with request_id of request
     * @returns If success, returns 200 (Ok) and the timestamp of transaction, otherwise will return one of these
     * status and a list of errors:
     * - 400 (bad request)
     * - 401 (forbidden)
     * - 404 (not found)
     * - 500 (internal error)
     */
    approveMedicinePendingRequest(ctx: Context, medReqApproveStr: string): Promise<ChaincodeResponse>;

    /**
     * Method to reject a pending medicine request (requests are pending when their types are equals 'exchange').
     * @param ctx Context of transaction
     * @param medReqRejectStr json with request_id of request
     * @returns If success, returns 200 (Ok) and the timestamp of transaction, otherwise will return one of these
     * status and a list of errors:
     * - 400 (bad request)
     * - 401 (forbidden)
     * - 404 (not found)
     * - 500 (internal error)
     */
    rejectMedicinePendingRequest(ctx: Context, medReqRejectStr: string): Promise<ChaincodeResponse>;

    /**
     * Method to query a specific Medicine Request by their ID
     * @param ctx Context of transaction
     * @param key The ID (aka KEY) of medicine request
     * @param status the status of request, that will be used to access the private or public ledger.
     * @returns If success returns 200 and the json of Medicine Request (see IMedicineRequestJson documentation),
     * otherwise will return one of these status and a list of errors:
     * - 400 (bad request)
     * - 401 (forbidden)
     * - 404 (not found)
     * - 500 (internal error)
     */
    queryMedicineRequest(ctx: Context, key: string, status: MedicineRequestStatusEnum): Promise<ChaincodeResponse>;

    /**
     * Method to query medicine(s) request(s) at the public ledger with pagination mode.
     *
     * @param ctx Context of transaction
     * @param queryParams query params that will be used as filter of query, it must have implements the
     * IMedicineRequestQuery
     * @param pageSize The number of results per pager
     * @param bookmark Optional - the bookmark of query
     *
     * @returns If success, returns 200 and IMedicineRequestPaginationResultJson payload,
     * otherwise will return one of these status and a list of errors:
     *
     * - 400 (bad request)
     * - 401 (forbidden)
     * - 500 (internal error)
     */
    queryMedicineRequestsWithPagination(
        ctx: Context,
        queryParams: string,
        pageSize: string,
        bookmark?: string): Promise<ChaincodeResponse>;

    /**
     * Method to query medicine(s) request(s) at the private ledger
     */
    queryMedicineRequestPrivateData(ctx: Context, queryParams: string): Promise<ChaincodeResponse>;

}
