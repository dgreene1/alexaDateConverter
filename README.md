[![Coverage Status](https://coveralls.io/repos/github/dgreene1/alexaDateConverter/badge.svg?branch=master)](https://coveralls.io/github/dgreene1/alexaDateConverter?branch=master)

# alexa-date-converter
A library to help convert [AMAZON.DATE (reference)](https://developer.amazon.com/docs/custom-skills/slot-type-reference.html#date) strings to useful objects.

# Cases Covered

This library can convert the following date strings. Note: `output` in the examples below is the product of the `new AlexaDateConverter().convertToDay` function.

| Type Of Date String  | Example Input From Alexa | Example Object After Conversion |
| ------------- | ------------- | ------------- |
| "specific day"  | "2019-12-25"  | `output.toString(); // "2019-12-25"`  |
| "specific week"  | "2009-W01"  | `output.toString(); // "2009-01-05"`  |
| "weekend for a specific week"  | "2009-W01-WE"  | `output.toString(); // "2009-01-10"`  |
| "month of year"  | "2019-12"  | `output.toString(); // "2019-12-01"`  |
| "year"  | "2019"  | `output.toString(); // "2019-01-01"`  |
| "decade"  | "200X"  | `output.toString(); // "2000-01-01"`  |
| "season"  | "2009-SU"  | `output.toString(); // "2009-06-01"`  |

# Examples

## Basic Example

### Standard ISO day string to [LocalDate](https://js-joda.github.io/js-joda/manual/LocalDate.html):

If an Alexa user utters the phrase "next Tuesday" then Alexa might send you an ISO Date string like "2019-10-01". If so, this library will turn that into an object that is easy to work with:

```ts
import { AlexaDateConverter } from 'alexa-date-converter';

const day = new AlexaDateConverter().convertToDay("2009-06-01");
console.log(day); // "2009-06-01"
```

But since Alexa could send you many other types of date strings, you will probably be most interested in the examples below.

### When Alexa provides a date for a specific "season"

Since Alexa can translate an utterance of "next summer" into "2009-SU" you need a way to reference the first day of the upcoming summer. Here's how you would do that.

```ts
import { AlexaDateConverter } from 'alexa-date-converter';

const day = new AlexaDateConverter().convertToDay("2009-SU");
console.log(day); // "2009-06-01"
```

**Note:** You can change the specific start days that `AlexaDateConverter` uses by specifying that option in the `AlexaDateConverter`'s constructor. It defaults to the seasons of northern hemisphere as specified by the meteorological calendar.

### When Alexa provides a date for a specific "week of the year"

Since Alexa can translate an utterance of "next week" into "

```ts
import { AlexaDateConverter } from 'alexa-date-converter';
import { DayOfWeek } from "js-joda";

const dateConverter = new AlexaDateConverter({
    startOfWeek: DayOfWeek.TUESDAY // <-- optional. The library defaults the start of the week to Monday
});
const day = dateConverter.convertToDay("2009-W01");
console.log(day); // 2009-01-06
```

## More Examples

Visit src\index.spec.ts to see all of the ways that this library can be used