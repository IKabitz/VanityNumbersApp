# Vanity Numbers Application

This repository contains the serverless application which can be called from an AWS Connect Contact flow.

It identifies the 5 best valid vanity numbers for the connecting phone number, returns 3 of them to the contact flow to be repeated, and stores the top 5 within dynamo db.

**Deployment Instructions**
Assuming AWS SAM cli is set up, clone or download the repository, then execute the following commands.

> cd vanityNumbersApp
> npm install
> npm run compile
> cd ..
> sam deploy --guided

Follow the on screen instructions. This will deploy the serverless application that encompasses the lambda and the DynamoDB table.

**Importing and configuring the contact flow**
After you have deployed the SAM application, navigate to your AWS connect instance.

 - Navigate to 'Contact flows' and find the AWS Lambda section of the page.
 - Use the page form to add the lambda to your connect instance.
 - Navigate to your connect instance and login.
 - Navigate to the Contact Flows menu, and create a new contact flow.
 - Navigate to the dropdown (carat) menu at the top right of the screen, and select the 'Import Flow' option.
 - Use the form to import the Contact Flow and save it.
From here, you will need to find the 'Invoke AWS Lambda function' Flow card, and you will need to select the function ARN for the lambda function from the list.

At this point, all you have to do is attach the flow to one of your phone numbers in the Manage Phone numbers menu, and you are ready to go!

  ## Overview: The components

1. The Serverless Application Model deployment
2. The Lambda
3. The AWS Connect Contact Flow
4. The react UI site
5. Improvements
6. What Issues were faced in this implementation?
8. What did I learn? (Typescript, AWS SAM, AWS CDK)

  

### The Serverless Application Model deployment
The deployment of the Vanity Numbers Lambda and the Vanity Numbers Dynamo DB table is automated through AWS SAM cli. This packages the lambda source code and bundles it with the resources provisioned in the CloudFormation template, template.yaml.

The lambda, which is written in TypeScript to ensure type safety, is built and compiled into a regular JavaScript file when `npm compile` is executed. Then, the resources are deployed using the current state of the source code when `sam deploy`is executed.

I chose to use AWS SAM for this application deployment because I believe that it would provide a simple way to deploy the serverless application with minimal configuration.


### The Vanity Numbers Lambda
The lambda is configured to accept a ConnectContactFlowEvent object, from which it extracts the connecting number from the customer endpoint information in the request.

The lambda then utilizes a modified (incomplete) English dictionary object in JavaScript (all credit to dwyl: https://github.com/dwyl/english-words) to scan the dictionary, assessing the fit of each individual word into the phone number, according to the E.161 specification for phone number and letter group mappings (see reference https://en.wikipedia.org/wiki/E.161). Each word that has a valid fit has a phoneWord object created to represent the word and where exactly it fits inside of the phone number (at the earliest point in the phone number that it could fit).

The application then assesses all possible combinations of the phone words to find the vanity numbers with the highest number of letters inserted (thus making the criteria of the "best" numbers, the set of numbers with the highest amount of letters within them).

The numbers are returned as a comma separated list of strings, where the vanity words are outlined with dashes. For example:
"*+11234567890*" may translate to "*11-ceil-6-qty-0*". 
Hmm, maybe a clever name for a company that sells ceilings called "*ceiling team 6*"? (Like Seal team 6?) Just a thought...

#### The dictionary and it's modifications
In order to keep the runtime of the lambda under 8 seconds (the maximum amount of time that the AWS Connect Contact Flow will wait for the lambda to return), the dictionary had to be paired down heavily. All words 6 letters or longer were discarded to get the search space down to approximately 25,000 words.
**In a production setting:** We could use a multi-threading tool like worker_threads to concurrently execute the task, cutting down the run time and allowing for a larger library.

### The AWS Connect contact flow
Included in the submission, a contact flow was created to ensure a customer was calling from a phone number, and then plays a short prompt:

> Hello! Thank you for calling the Vanity Number project. Shortly, we will return to you a list of 3 best vanity phone number options for your connecting number.

Afterwards, the lambda is triggered, and the final prompts are played.

> Your best vanity numbers are $.External.phoneNumbers

Where *$.External.phoneNumbers* is the value of the valid phone numbers returned from the lambda as described above.


### The Static React UI
The static react site allows us to view the last 5 participants, the phone numbers that they called with, and the top five vanity numbers that apply to their connecting phone numbers. You can find the repository for the UI here: https://github.com/IKabitz/VanityNumbersUI
There is a readme in that repo that explains how the UI project is constructed and hosted.

### Potential Improvements
Obviously, this is a tenuous and quick implementation. A culmination of a few hours of effort here and there. Given more time, there are a few improvements that I believe could be made:

 1. More robust error handling, both in the lambda and the contact flow.
 2. A fleshed out suite of unit tests that more thoroughly describe user stories or use cases.
 3. Efficiency improvements for the word search process, both in terms of dictionary storage and concurrent processing. For example, the worker_threads library can be used to dispatch a thread for every one thousand words, potentially cutting the search time down greatly and allowing for a larger set of words to be used (for up to 10 letter words).


### Big issues
Right off of the bat, the biggest issue we have to contend with here falls into a classic kind of resource and efficiency problem: How do I maximize the search space of the word search, without making the implementation inefficient?

Originally, I started off looking for existing solutions to this problem. That lead me to a great example at https://phonespell.org/. Essentially, they perform the process in the same way, and they graciously highlight that process here!

> To find all the interesting mnemonics for a given 7 digit phone number:
> 
> -   A database of words, indexed by number, is consulted, and each word in the database which matches the sequence (from the beginning)
> and contains no extra digits/letters is selected. The database and
> search engine are specially optimized to make this search fast and
> efficient.
> -   The first digit of the sequence is removed and the above search is repeated on the new sequence. This repeats until all there are no more
> digits.
> -   Additionally, words of 4 or more letters which match the end of the number but have a single extra letter are also found.
> -   The result of the searches is a list of words to use to make the mnemonic. The words are put together in all possible combinations to
> generate an exhaustive list of mnemonics. That list is put through a
> proprietary filter which throws out mnemonics that are unteresting
> (based on the feedback PhoneSpell has received over the years).
> -   Finally, the mnemonics that pass through the filter are then sorted, formatted, and displayed.


They have a few extra steps involved, which I am assuming they aren't giving away freely as that would spoil the "secret sauce" that makes up the trade secrets of the site, I am sure...


#### Infrastructure: Deployability, localized testing, and ease of use.
Using the SAM cli tool provided by AWS, I was able to write the lambda in TypeScript, test it locally, and deploy it easily with minimal configuration. I also used AWS CDK to deploy the React UI for the website. 
Because I could utilize my own machine for development, I could also run the tests without affecting the existing AWS resources, making superfluous database entries, or messing up the existing lambda cloudwatch logs with test data and errors.


### What did I learn?
Coming into this project, I had previously had:
1. Some front end experience using React to build small web applications and tools for my team.
2. No exposure to TypeScript.
3. No exposure to AWS CDK or AWS SAM.
4. No exposure to AWS Connect.

With tools like SAM and CDK, it is easy to define, deploy, and update serverless applications, and the implications of these tools on project structure are huge. Looking back at previous projects, I can't believe I wasted time creating and deploying the same kind of applications just by using the tools available in the AWS console!

Working with AWS Connect, creating contact flows and managing integration with all sorts of services is easy to learn quickly, and complicated to master. I look forward to working on more AWS Connect implementations in the future.