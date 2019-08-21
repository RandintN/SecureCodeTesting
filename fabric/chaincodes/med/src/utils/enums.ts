export enum SituationEnum {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',

}

export enum TradeStatusEnum {
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    WAITING_FOR_APPROVAL = 'WAITING FOR APPROVAL',
    WAITING_FOR_WITHDRAW = 'WAITING_FOR_WITHDRAW'

}

export enum MedicineOperationEnum {
    REQUEST = 'REQUEST',
    OFFER = 'OFFER',
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

export enum MedicineProposedStatusEnum {
    PROPOSED = 'proposed',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    DELIVERED = 'delivered'
}
