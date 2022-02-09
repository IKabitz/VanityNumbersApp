import {
    ConnectContactFlowEvent
} from "aws-lambda";
import {
    lambdaHandler,
    assessFit
} from "../../src-ts/app";


describe('Default unit test for vanity number lambda', function () {
    it('verifies successful response', async () => {
        const event: ConnectContactFlowEvent = {
            Name: "ContactFlowEvent",
            Details: {
                ContactData: {
                    Attributes: {},
                    Channel: "VOICE",
                    ContactId: "5ca32fbd-8f92-46af-92a5-6b0f970f0efe",
                    CustomerEndpoint: {
                        Address: "+11234567890",
                        Type: "TELEPHONE_NUMBER"
                    },
                    InitialContactId: "5ca32fbd-8f92-46af-92a5-6b0f970f0efe",
                    InitiationMethod: "API",
                    InstanceARN: "arn:aws:connect:us-east-1:123456789012:instance/9308c2a1-9bc6-4cea-8290-6c0b4a6d38fa",
                    MediaStreams: {
                        Customer: {
                            Audio: {
                                StartFragmentNumber: "91343852333181432392682062622220590765191907586",
                                StartTimestamp: "1565781909613",
                                StreamARN: "arn:aws:kinesisvideo:us-east-1:123456789012:stream/connect-contact-a3d73b84-ce0e-479a-a9dc-5637c9d30ac9/1565272947806"
                            }
                        }
                    },
                    PreviousContactId: "5ca32fbd-8f92-46af-92a5-6b0f970f0efe",
                    Queue: null,
                    SystemEndpoint: {
                        Address: "+11234567890",
                        Type: "TELEPHONE_NUMBER"
                    }
                },
                Parameters: {}
            }
        } as any
        const result = await lambdaHandler(event)

        expect(result.phoneWords).toEqual("+11234567890")
    });
});

describe('Default test case for word assessment', function () {
    it('Verifies correct function of assessFit', () => {
        const result: number = assessFit("beg", "1234567890");
        console.log("Result of assessfit: " + result);
        expect(result).toEqual(1);
    })
    it('Verifies correct function of assessFit negative', () => {
        const result: number = assessFit("test", "1234567890");
        console.log("Result of assessfit: " + result);
        expect(result).toEqual(0);
    })
})