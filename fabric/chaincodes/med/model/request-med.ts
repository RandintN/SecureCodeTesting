import {ChaincodeStub, Shim, ChaincodeResponse, ChaincodeInterface} from 'fabric-shim';

export class RequestMed implements ChaincodeInterface {
    async Init(stub: ChaincodeStub): Promise<ChaincodeResponse> {
        return await Shim.success(Buffer.from('Init success!'));
    }    
    
    Invoke(stub: ChaincodeStub): Promise<ChaincodeResponse> {
        throw new Error("Method not implemented.");
    }

    // public Init(stub : ChaincodeStub) : ChaincodeResponse {
    //     return Shim.success(Buffer.from('Init success!'));
    // }


}

let med : RequestMed = new RequestMed();

Shim.start(med);