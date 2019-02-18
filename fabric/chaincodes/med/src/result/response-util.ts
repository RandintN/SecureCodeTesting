import { ChaincodeResponse, ResponseCode } from 'fabric-shim';
import { ResponseCodes } from '../utils/enums';

export class ResponseUtil {

    public static ResponseCreated(resultPayload: Buffer): ChaincodeResponse {
        return ResponseUtil.CreateResponse(undefined, resultPayload, ResponseCodes.CREATED);
    }

    public static ResponseOk(resultPayload: Buffer): ChaincodeResponse {
        return ResponseUtil.CreateResponse(undefined, resultPayload, ResponseCodes.OK);
    }

    public static ResponseBadRequest(resultMessage: string, resultPayload: Buffer): ChaincodeResponse {
        return ResponseUtil.CreateResponse(resultMessage, resultPayload, ResponseCodes.CREATED);
    }

    public static ResponseNotFound(resultMessage: string, resultPayload: Buffer): ChaincodeResponse {
        return ResponseUtil.CreateResponse(resultMessage, resultPayload, ResponseCodes.CREATED);
    }

    public static ResponseError(errorMessage: string, resultPayload: Buffer): ChaincodeResponse {
        return ResponseUtil.CreateResponse(errorMessage, resultPayload, ResponseCodes.INTERNAL_SERVER_ERROR);
    }

    private static CreateResponse(resultMessage: string, resultPayload: Buffer, resultStatus: number):
        ChaincodeResponse {
        return {
            message: resultMessage,
            payload: resultPayload,
            status: resultStatus,
        };
    }

}
