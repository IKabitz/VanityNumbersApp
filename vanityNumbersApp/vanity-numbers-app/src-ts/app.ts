import {
    ConnectContactFlowEvent,
    ConnectContactFlowResult
} from "aws-lambda";

import wordDictionary from './words_dictionary.json';

// Lambda handler for vanity numbers function
export const lambdaHandler = async (
    event: ConnectContactFlowEvent
): Promise<ConnectContactFlowResult> => {
    const endPoint: string = event.Details.ContactData.CustomerEndpoint.Address;

    const numberForWordSearch: string = endPoint.substring(1);

    // Get map of all vanity numbers
    const retVal: Map<number, string[]> = getVanityNumbers(numberForWordSearch);

    var highest: number = 0;
    for (let entry of retVal.entries()) {
        if (entry[0] > highest) {
            highest = entry[0];
        }
    }

    var returned: number = 0;
    var bestNumbers: string[] = [];
    for (let i=highest; i > 0 && returned <= 5; i--) {
         var numbers: string[] | null = retVal.get(i);

         if (numbers) {
            for (let vanityNum of numbers) {
                bestNumbers.push(vanityNum);
                returned += 1;
                if (returned >= 5) {
                    break;
                }
            }
         }
    }


    return {
        phoneWords: bestNumbers.join()
    }
}

// Represents the conversion from phone number to letters
const phoneLetters: any = {
    '2': 'abc',
    '3': 'def',
    '4': 'ghi',
    '5': 'jkl',
    '6': 'mno',
    '7': 'pqrs',
    '8': 'tuv',
    '9': 'wxyz'
}

// Defines the phoneword type we use to store the search results
interface phoneWord {
    word: string,
        position: number,
        length: number
}

// Performs the search and returns a map of the vanity numbers with total word length
function getVanityNumbers(numberForWordSearch: string): Map<number, string[]> {

    var phoneWords: phoneWord[] = []
    // Search each word in the dictionary to assess if it fits anywhere inside the number provided
    for (let word in wordDictionary) {
        let fitPos: number = assessFit(word, numberForWordSearch) // TODO make this into a set of promises and then use Promise.all

        if (fitPos > 0) {
            let newWord: phoneWord = {
                word: word,
                position: fitPos,
                length: word.length
            }
            phoneWords.push(newWord);
        }

    }

    return generateNumbers(phoneWords, numberForWordSearch);

}

// Generates the vanity numbers from the phone words provided
function generateNumbers(phoneWords: phoneWord[], numberForWordSearch: string): Map<number, string[]> {
    var vanityNumbers: Map<number, string[]> = new Map<number, string[]>();

    // Search each word for combinations
    for (let word of phoneWords) {
        for (let matchWord of phoneWords) {
            if (isCompatiblePhoneWord(word, matchWord)) {
                // Adding set of all two word combinations
                let twoWordMatch: phoneWord[] = [word, matchWord];
                let fullVanityNumber: string = insertPhoneWords(twoWordMatch, numberForWordSearch);

                let numsWithLength: string[] | null = vanityNumbers.get(word.length + matchWord.length);

                if (numsWithLength) {
                    let newNums = numsWithLength;
                    newNums.push(fullVanityNumber);
                    vanityNumbers.set(word.length + matchWord.length, newNums);
                }
                else {
                    vanityNumbers.set(word.length + matchWord.length, [fullVanityNumber]);
                }


                for (let thirdMatch of phoneWords) {
                    if (isCompatiblePhoneWords(thirdMatch, twoWordMatch)) {
                        // Add set of all three word matches
                        let threeWordMatch: phoneWord[] = [word, matchWord, thirdMatch];
                        let fullVanityNumber: string = insertPhoneWords(threeWordMatch, numberForWordSearch);

                        let numsWithLength: string[] | null = vanityNumbers.get(word.length + matchWord.length + thirdMatch.length);

                        if (numsWithLength) {
                            let newNums = numsWithLength;
                            newNums.push(fullVanityNumber);
                            vanityNumbers.set(word.length + matchWord.length + thirdMatch.length, newNums);
                        }
                        else {
                            vanityNumbers.set(word.length + matchWord.length + thirdMatch.length, [fullVanityNumber]);
                        }

                        console.log("Three word match: " + fullVanityNumber + " between " + word.word + " " + matchWord.word + " " + thirdMatch.word);
                    }

                }

            }
        }
    }

    return vanityNumbers;
}

// Inserts the phonewords into the phone number for output
function insertPhoneWords(vanityWords: phoneWord[], numberForWordSearch: string): string {
    var totalOffset: number = 0; // Keep track of what offset to add to the position
    for (let word of vanityWords) {
        numberForWordSearch = numberForWordSearch.slice(0, word.position + totalOffset) + word.word  + numberForWordSearch.slice(word.position + totalOffset + word.length);
    }
    return numberForWordSearch;
}

// Determines if phoneWord is compatible with another phoneWord
function isCompatiblePhoneWord(word: phoneWord, matchWord: phoneWord): boolean {
    if ((word.position <= matchWord.position + matchWord.length) && (word.position + word.length >= matchWord.position)) {
        return false;
    }
    return true;
}

// Determines if phoneWord is compatible with set of phonewords
function isCompatiblePhoneWords(matchWord: phoneWord, vanityWords: phoneWord[]): boolean {
    for (let word of vanityWords) {
        // If the words intersect, they cannot be compatible
        if ((word.position <= matchWord.position + matchWord.length) && (word.position + word.length >= matchWord.position)) {
            return false;
        }
    }
    return true;
}

// Determines if the word fits inside the number
export function assessFit(word: string, numberForWordSearch: string): number {
    var fitPos: number = 0;
    var currPos: number = 0;

    while (currPos + word.length < numberForWordSearch.length && fitPos < 1) {
        if (numberForWordSearch[currPos] === '1' || numberForWordSearch === '0') {
            currPos += 1;
            continue;
        }

        /** Continue the search along the length of the word 
         * if all of the characters in the word fit in the phone number,
         * we have a match, otherwise check another position down
         */
        for (let i = 0; i < word.length; i++) {
            if (!isValidCharForNum(word[i], numberForWordSearch[i + currPos])) {
                break; // If it isn't a fit here, move on to the next position
            }
            if (i + 1 == word.length) {
                // If we get to the end of the word with all matches, we have a winner
                fitPos = currPos;
            }
        }
        currPos += 1;
    }


    return fitPos;
}

/** Checks if a letter could belong to the set of characters described by a 
 * individual phone number character 2-9
 */
function isValidCharForNum(letter: string, phoneNumberChar: string): boolean {
    return phoneLetters[phoneNumberChar].includes(letter);
}