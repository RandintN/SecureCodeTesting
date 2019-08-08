/**
 * 
 *
 * @author enicola - CPqD
 */
export interface IMedicineQueryKey {

    /**
     * Type of query, discrimine the kind of query will be searched:
     * QueryType enum
     */
    //query_type: QueryType;

    /**
     * Dynamic filter which will be used to query ledger
     */
    id: {[k: string]: any};
    propose_id: {[k: string]: any};

}
