import { Context, Contract } from 'fabric-contract-api';
import { Shim } from 'fabric-shim';

export class MedRequestDomain extends Contract {

    public async initLedger(ctx: Context) {
        return Shim.success(Buffer.from('Init success!'));
    }

    public async addMedicineRequest(ctx: Context, medRequestJson: string) {
        await ctx.stub.putPrivateData('N2miMSP-PD', 'test', Buffer.from(medRequestJson));
    }

    public async queryMedicineRequest(ctx: Context): Promise<string> {
        const requestAsByte = await ctx.stub.getPrivateData('N2miMSP-PD', 'test');
        return JSON.stringify(requestAsByte.toString());
    }
}
