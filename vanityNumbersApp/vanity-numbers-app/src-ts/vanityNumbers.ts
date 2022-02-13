import wordDictionary from './words_dictionary.json';

// Represents the conversion from phone number to letters
const phoneLetters: any = {
    '2': 'abc',
    '3': 'def',
    '4': 'ghi',
    '5': 'jkl',
    '6': 'mno',
    '7': 'pqrs',
    '8': 'tuv',
    '9': 'wxyz',
    '0': '0',
    '1': '1'
}

// Defines the phoneword type we use to store the search results
export interface phoneWord {
    word: string,
        position: number,
        length: number
}

// Performs the search and returns a map of the vanity numbers with total word length
export function getVanityNumbers(numberForWordSearch: string): Map<number, string[]> {

    var phoneWords: phoneWord[] = []
    // Search each word in the dictionary to assess if it fits anywhere inside the number provided
    for (let word in wordDictionary) {
        // This process could be sped up using worker_threads, allowing for a larger library to search through
        let fitPos: number = assessFit(word, numberForWordSearch)

        if (fitPos >= 0) {
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
    return searchForAllCompatible(phoneWords, [], numberForWordSearch, vanityNumbers);
}


// Recursive function to capture n-number word combinations
function searchForAllCompatible(phoneWords: phoneWord[], matchSet: phoneWord[], numberForWordSearch: string, vanityNumbers: Map<number, string[]>):  Map<number, string[]> {

    for (let match of phoneWords) {
        if (isCompatiblePhoneWords(match, matchSet)) {
            // Make a copy of the original 
            var newMatchSet: phoneWord[] = [...matchSet];
            // Add set of all n word matches
            newMatchSet.push(match);
            let fullVanityNumber: string = insertPhoneWords(newMatchSet, numberForWordSearch);

            // Check key equal to the length of all fitting match words combined
            let lengthOfMatches: number = getPhoneWordSetWordLength(newMatchSet);
            let numsWithLength: string[] | null = vanityNumbers.get(lengthOfMatches);

            if (numsWithLength) {
                let newNums = numsWithLength;
                newNums.push(fullVanityNumber);
                vanityNumbers.set(lengthOfMatches, newNums);
            }
            else {
                vanityNumbers.set(lengthOfMatches, [fullVanityNumber]);
            }
            vanityNumbers = searchForAllCompatible(phoneWords, newMatchSet, numberForWordSearch, vanityNumbers);
        }
    }

    // Else, base case has been reached, return the whole map
    return vanityNumbers;
}

// Calculates the total length of a set of phone words
function getPhoneWordSetWordLength(phoneWords: phoneWord[]): number {
    var totalLength: number = 0;
    for (let word of phoneWords) {
        totalLength += word.length;
    }
    return totalLength;
}

// Inserts the phonewords into the phone number for output
// Assumes that all phonewords are compatible with each other and number itself
export function insertPhoneWords(vanityWords: phoneWord[], numberForWordSearch: string): string {
    var totalOffset: number = 0; // Keep track of what offset to add to the position
    for (let word of vanityWords) {
        numberForWordSearch = numberForWordSearch.slice(0, word.position + totalOffset) + "-" + word.word + "-" + numberForWordSearch.slice(word.position + totalOffset + word.length);
        totalOffset += 2;
    }

    // Remove trailing and leading dashes
    if (numberForWordSearch[0] === "-") {
        numberForWordSearch = numberForWordSearch.slice(1);
    }

    if (numberForWordSearch[numberForWordSearch.length - 1] === "-") {
        numberForWordSearch = numberForWordSearch.slice(0, numberForWordSearch.length - 1);
    }

    // Remove double dashes
    numberForWordSearch = numberForWordSearch.replace("--", "-");

    return numberForWordSearch;
}

// Determines if phoneWord is compatible with another phoneWord
export function isCompatiblePhoneWord(word: phoneWord, matchWord: phoneWord): boolean {
    if ((word.position <= matchWord.position + matchWord.length) && (word.position + word.length >= matchWord.position)) {
        return false;
    }
    return true;
}

// Determines if phoneWord is compatible with set of phonewords
export function isCompatiblePhoneWords(matchWord: phoneWord, vanityWords: phoneWord[]): boolean {
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
    var fitPos: number = -1;
    var currPos: number = 0;

    while (currPos + word.length <= numberForWordSearch.length && fitPos < 0) {
        if (numberForWordSearch[currPos] === '1' || numberForWordSearch[currPos] === '0') {
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