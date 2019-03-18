import { MedicineRequestStatusEnum } from '../utils/enums';

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
     * Demographic region of organization
     */
    demographic: string;

    /**
     * Abbreviation of the federated state union of organization (e.g.: SP, RJ, RS ...)
     */
    state: string;

    /**
     * City of organization
     */
    city: string;

    /**
     * Array with the types which will be searched
     */
    type: string[];

    /**
     * Active ingredient
     */
    active_ingredient: string;

    /**
     * Status MedicineRequestStatusEnum
     */
    status: MedicineRequestStatusEnum;

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
