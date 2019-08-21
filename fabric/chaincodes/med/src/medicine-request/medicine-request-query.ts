/**
 * Interface of queryMedicineRequests
 *
 * @author fmarino - CPqD
 */
export interface IMedicineRequestQuery {

    /**
     * Type of query, discrimine the kind of query will be searched:
     * QueryType enum
     */
    query_type: QueryType;

    /**
     * Dynamic filter which will be used to query ledger
     */
    selector: {[k: string]: any};

}

/**
 * Enum thats currently used just at IMedicineRequestQuery
 */
export enum QueryType {

    /**
     * Type network
     */
    NETWORK = 'network',

    /**
     * Type my own
     */
    MY_OWN_REQUESTS = 'my_own_requests',

}
