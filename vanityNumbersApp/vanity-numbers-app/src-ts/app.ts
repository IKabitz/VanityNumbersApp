import {
    ConnectContactFlowEvent,
    ConnectContactFlowResult
} from "aws-lambda";

import { getVanityNumbers } from './vanityNumbers';

// The total number of vanity numbers to store per caller
const storeLimit: number = 5;

// The total number of vanity numbers to return to the contact flow
const returnLimit: number = 3;

// Lambda handler for vanity numbers function
export const lambdaHandler = async (
    event: ConnectContactFlowEvent
): Promise<ConnectContactFlowResult> => {
    const endPoint: string = event.Details.ContactData.CustomerEndpoint.Address;

    const numberForWordSearch: string = endPoint.substring(1);

    // Get map of all vanity numbers
    const retVal: Map<number, string[]> = getVanityNumbers(numberForWordSearch);

    // Get the level of highest letter count
    var highest: number = 0;
    for (let entry of retVal.entries()) {
        if (entry[0] > highest) {
            highest = entry[0];
        }
    }

    // Choose the best five from the list
    // TODO what if there are none returned? (all ones or zeros)
    var returned: number = 0;
    var bestNumbers: string[] = [];
    for (let i=highest; i > 0 && returned < storeLimit; i--) {
         var numbers: string[] | null = retVal.get(i);

         if (numbers) {
            for (let vanityNum of numbers) {
                bestNumbers.push(vanityNum);
                returned += 1;
                if (returned >= storeLimit) {
                    break;
                }
            }
         }
    }

    console.log("Best Numbers: " + bestNumbers)

    // TODO insert the results into dynamoDB

    // Truncate the numbers for contact flow results
    bestNumbers.length = returnLimit;
    let result: ConnectContactFlowResult = {
        phoneNumbers: bestNumbers.join()
    }

    return result;
}