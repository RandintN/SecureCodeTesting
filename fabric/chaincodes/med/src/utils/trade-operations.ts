import { Context } from "fabric-contract-api";
import { ChaincodeResponse, StateQueryResponse, Iterators } from "fabric-shim";
import { IMedicineRequestQuery, QueryType } from "../medicine-request/medicine-request-query";
import { IMedicineRequestJson } from "../medicine-request/medicine-request-json";
import { ResponseUtil } from "../result/response-util";
import { CommonConstants } from "./common-messages";
import { IMedicineRequestPaginationResultJson } from "../medicine-request/medicine-request-pagination-result";
import { ValidationError } from "../validation/validation-error-model";
import { ITrade } from "./trade-operations-interface";

export class Trade implements ITrade{

    //#region constants
    
    private static ERROR_TRADE_NOT_FOUND: ValidationError =
        new ValidationError('T-001',
            'The medicine trade is not found.');
    
    //#endregion

    //#region region of methods to be invoked       

    /** Check the documentation of IMedicineRequestService */
    public async queryMedicineTradesWithPagination(
        ctx: Context,
        queryParams: string,
        pageSize: string,
        bookmark?: string):
        Promise<ChaincodeResponse> {

        try {
            // Retrieves query from string
            const query: IMedicineRequestQuery = JSON.parse(queryParams) as IMedicineRequestQuery;

            // When the kind of query is own the MSP_ID is setted in endogenous way,
            // to assurance that is the trust identity
            if (query.query_type === QueryType.MY_OWN_REQUESTS) {
                query.selector.msp_id = ctx.clientIdentity.getMSPID().toUpperCase();
            }

            // Creates the query of couchdb
            const queryJson = {
                selector: query.selector,
            };

            const filter: string = JSON.stringify(queryJson);

            // Get Query
            const stateQuery: StateQueryResponse<Iterators.StateQueryIterator> =
                await ctx.stub.getQueryResultWithPagination(
                    filter,
                    Number(pageSize),
                    bookmark);

            const records: IMedicineRequestJson[] = await this.getMedicineTrades(stateQuery.iterator);

            // Checking if some records were founding...
            if (!records || records.length < 1) {
                return ResponseUtil.ResponseNotFound(CommonConstants.VALIDATION_ERROR,
                    Buffer.from(JSON.stringify(Trade.ERROR_TRADE_NOT_FOUND)));
            }

            const result: IMedicineRequestPaginationResultJson = {
                bookmark: stateQuery.metadata.bookmark,
                fetched_records_count: stateQuery.metadata.fetched_records_count,
                medicine_trades: records,
                timestamp: new Date().getTime(),

            };

            return ResponseUtil.ResponseOk(Buffer.from(JSON.stringify(result)));
        } catch (error) {
            console.log(error);
            return ResponseUtil.ResponseError(error.toString(), undefined);
        }
    }

    /**
     * Auxiliar method that iterates over an interator of MedicineRequest and mount the query result.
     * @param iterator iterator
     * @returns query results
     */
    private async getMedicineTrades(iterator: Iterators.StateQueryIterator): Promise<IMedicineRequestJson[]> {
        const results: IMedicineRequestJson[] = new Array<IMedicineRequestJson>();

        if (!iterator || typeof iterator.next !== 'function') {
            return results;
        }

        while (true) {

            const result = await iterator.next();

            let medicineRequestJson: IMedicineRequestJson;

            if (result.value && result.value.value.toString()) {
                medicineRequestJson = JSON.parse(result.value.value.toString('utf8')) as IMedicineRequestJson;

            }

            if (medicineRequestJson) {
                results.push(medicineRequestJson);

            }

            if (result.done) {
                break;
            }

        }

        return results;
    }

    //#endregion
}