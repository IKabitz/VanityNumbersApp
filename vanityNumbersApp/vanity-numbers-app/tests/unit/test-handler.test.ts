import {
    ConnectContactFlowEvent
} from "aws-lambda";
import { workerData } from "worker_threads";
import { lambdaHandler } from "../../src-ts/app";
import { assessFit, insertPhoneWords, phoneWord } from "../../src-ts/vanityNumbers";


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
                        Address: "+17636077692",
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

        expect(result.phoneNumbers.split(',').length).toEqual(3);
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
        expect(result).toEqual(-1);
    })
    it('Verifies correct function of assessFit first number', () => {
        const result: number = assessFit("beg", "2345678900");
        console.log("Result of assessfit: " + result);
        expect(result).toEqual(0);
    })
})

describe('Default test case for insertPhoneWords pretty printing', function () {
    it('Verifies correct function of insertPhoneWords base case', () => {
        const numberForWordSearch: string = "1234567890";
        const result: string = insertPhoneWords([], numberForWordSearch);
        expect(result).toEqual(numberForWordSearch);
    })

    it('Verifies correct function of insertPhoneWords pretty print', () => {
        const numberForWordSearch: string = "1234567890";
        let phoneWord1: phoneWord = {
            word: "test",
            position: 0,
            length: "test".length
        }
        let phoneWord2: phoneWord = {
            word: "xx",
            position: 5,
            length: "xx".length
        }
        let phoneWord3: phoneWord = {
            word: "a",
            position: 8,
            length: "a".length
        }
        const result: string = insertPhoneWords([phoneWord1, phoneWord2, phoneWord3], numberForWordSearch);
        expect(result).toEqual("test-5-xx-8-a-0");
    })

    it('Verifies correct function of insertPhoneWords pretty print with double dashes', () => {
        const numberForWordSearch: string = "1234567890";
        let phoneWord1: phoneWord = {
            word: "test",
            position: 0,
            length: "test".length
        }
        let phoneWord2: phoneWord = {
            word: "xx",
            position: 4,
            length: "xx".length
        }
        let phoneWord3: phoneWord = {
            word: "a",
            position: 8,
            length: "a".length
        }
        const result: string = insertPhoneWords([phoneWord1, phoneWord2, phoneWord3], numberForWordSearch);
        expect(result).toEqual("test-xx-78-a-0");
    })    
})