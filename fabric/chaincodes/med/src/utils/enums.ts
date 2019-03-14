export enum SituationEnum {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',

}

export enum MedicineRequestStatusEnum {
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',

}

export enum ResponseCodes {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    FORBIDDEN = 401,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,

}

export enum RequestMode {
    LOAN = 'loan',
    EXCHANGE = 'exchange',
    DONATION = 'donation',
}
