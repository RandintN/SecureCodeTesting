import { Context } from "fabric-contract-api";
import { ChaincodeResponse, StateQueryResponse, Iterators } from "fabric-shim";

export interface ITrade {

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
    queryMedicineTradesWithPagination(
        ctx: Context,
        queryParams: string,
        pageSize: string,
        bookmark?: string): Promise<ChaincodeResponse>;
}