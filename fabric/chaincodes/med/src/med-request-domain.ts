import { Context, Contract } from 'fabric-contract-api';
import { Shim } from 'fabric-shim';

export class MedRequestDomain extends Contract {

    public async initLedger(ctx: Context) {
        return Shim.success(Buffer.from('Init success!'));

    }

}
