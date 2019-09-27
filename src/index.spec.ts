import { AlexaDateConverter, AmazonDotDateCategory, AmazonDotDateSeason, StartOfSeasonDictionary, southernMeteorologicalSeasonStarts } from "./index";
import { MonthDay, Month, LocalDate } from "js-joda";

/**
 * the dates for these expectations were selected from https://www.epochconverter.com/weeks/ but are in-line with the ISO week calendar (which sometimes has dates that appear outside of the calendar year)
 */
const testCasesForWeek = {
    "2008": { year: 2008, weeksInYear: 52, firstMondayOfYear: "2007-12-31", lastMondayOfYear: "2008-12-22" },
    "2009": { year: 2009, weeksInYear: 53, firstMondayOfYear: "2008-12-29", lastMondayOfYear: "2009-12-28" },
    "2018": { year: 2018, weeksInYear: 52, firstMondayOfYear: "2018-01-01", lastMondayOfYear: "2018-12-24", },
    "2019": { year: 2019, weeksInYear: 52, firstMondayOfYear: "2018-12-31", lastMondayOfYear: "2019-12-23"},
    "2014": { year: 2014, weeksInYear: 52, firstMondayOfYear: "2013-12-30", lastMondayOfYear: "2014-12-22" },
    "2024": { year: 2024, weeksInYear: 52, firstMondayOfYear: "2024-01-01", lastMondayOfYear: "2024-12-23" },
}
const caseNamesForWeeks = Object.keys(testCasesForWeek);

describe('AlexaDateConverter', () => {

    describe('when the input is of category "specific day"', ()=> {

        it("should handle an ISO day", ()=> {
            // Arrange
            const dateTypeToTest: AmazonDotDateCategory = "specific day";
            const theLib = new AlexaDateConverter();
            const input = "2019-12-25"
            // red-herring check
            expect(theLib.classifyAmazonDotDate(input)).toEqual(dateTypeToTest);

            // Act
            const result = theLib.convertToDay(input);

            // Assert
            expect(result.toString()).toEqual("2019-12-25");
        })

        it("should not handle ISO-ish days that go over the month number", ()=> {
            // Arrange
            const theLib = new AlexaDateConverter();
            const input = "2019-12-99"

            // Act
            let errorToTest: Error | null = null;
            try {
                theLib.convertToDay(input);
            } catch(err){
                errorToTest = err as Error;
            } finally {
                expect(errorToTest).toEqual(new Error("2019-12-99 was not a valid date string."));
            }
        })

    })

    describe('when the input is of category "specific week"', ()=> {

        describe.each(caseNamesForWeeks)(`for case %s`, (caseName) => {
            const caseDetails = testCasesForWeek[caseName as keyof typeof testCasesForWeek];

            const firstWeekStr = `${caseDetails.year}-W01`;
            const lastWeekStr = `${caseDetails.year}-W${caseDetails.weeksInYear}`;

            it(`should have the expected first Monday of the year for the first week`, ()=>{
                // Arrange
                const dateTypeToTest: AmazonDotDateCategory = "specific week";
                const theLib = new AlexaDateConverter();
                const input = firstWeekStr;
                // red-herring check
                expect(theLib.classifyAmazonDotDate(input)).toEqual(dateTypeToTest);

                // Act
                const result = theLib.convertToDay(input);

                // Assert
                expect(result.toString()).toEqual(caseDetails.firstMondayOfYear);
            });

            it(`should have the expected last Monday of the year for the last week`, ()=>{
                // Arrange
                const dateTypeToTest: AmazonDotDateCategory = "specific week";
                const theLib = new AlexaDateConverter();
                const input = lastWeekStr;
                // red-herring check
                expect(theLib.classifyAmazonDotDate(input)).toEqual(dateTypeToTest);

                // Act
                const result = theLib.convertToDay(input);

                // Assert
                expect(result.toString()).toEqual(caseDetails.lastMondayOfYear);
            });
        })

        it(`should work on weeks that are multiples of 10`, ()=>{
            // Arrange
            const dateTypeToTest: AmazonDotDateCategory = "specific week";
            const theLib = new AlexaDateConverter();
            const input = "2019-W40";
            // red-herring check
            expect(theLib.classifyAmazonDotDate(input)).toEqual(dateTypeToTest);

            // Act
            const result = theLib.convertToDay(input);

            // Assert
            expect(result.toString()).toEqual("2019-09-30");
        });

        it("should not handle ISO week if for some strange reason Alexa chose to represent a week illegally as 2008-W00 since weeks start on 1", ()=> {
            // Arrange
            const theLib = new AlexaDateConverter();
            const input = "2019-W00"

            // Act
            let errorToTest: Error | null = null;
            try {
                theLib.convertToDay(input);
            } catch(err){
                errorToTest = err as Error;
            } finally {
                expect(errorToTest).toEqual(new Error("2019-W00 was not a valid date string."));
            }
        })

    })

    describe('when the input is of category "weekend for a specific week"', ()=> {

        describe.each(caseNamesForWeeks)(`for case %s`, (caseName) => {
            const caseDetails = testCasesForWeek[caseName as keyof typeof testCasesForWeek];

            const firstWeekStr = `${caseDetails.year}-W01-WE`;
            const lastWeekStr = `${caseDetails.year}-W${caseDetails.weeksInYear}-WE`;

            it(`should have the expected first Monday of the year for the first week`, ()=>{
                // Arrange
                const dateTypeToTest: AmazonDotDateCategory = "weekend for a specific week";
                const theLib = new AlexaDateConverter();
                const input = firstWeekStr;
                // red-herring check
                expect(theLib.classifyAmazonDotDate(input)).toEqual(dateTypeToTest);

                // Act
                const result = theLib.convertToDay(input);

                // Assert
                const daysBetweenMondayAndSaturday = 5;
                const expected = LocalDate.parse(caseDetails.firstMondayOfYear).plusDays(daysBetweenMondayAndSaturday).toString();
                expect(result.toString()).toEqual(expected);
            });

            it(`should have the expected last Monday of the year for the last week`, ()=>{
                // Arrange
                const dateTypeToTest: AmazonDotDateCategory = "weekend for a specific week";
                const theLib = new AlexaDateConverter();
                const input = lastWeekStr;
                // red-herring check
                expect(theLib.classifyAmazonDotDate(input)).toEqual(dateTypeToTest);

                // Act
                const result = theLib.convertToDay(input);

                // Assert
                const daysBetweenMondayAndSaturday = 5;
                const expected = LocalDate.parse(caseDetails.lastMondayOfYear).plusDays(daysBetweenMondayAndSaturday).toString();
                expect(result.toString()).toEqual(expected);
            });
        })
        it("should not handle ISO weekend if for some strange reason Alexa chose to represent a week illegally as 2008-W00 since weeks start on 1", ()=> {
            // Arrange
            const theLib = new AlexaDateConverter();
            const input = "2019-W00-WE"

            // Act
            let errorToTest: Error | null = null;
            try {
                theLib.convertToDay(input);
            } catch(err){
                errorToTest = err as Error;
            } finally {
                expect(errorToTest).toEqual(new Error("2019-W00-WE was not a valid date string."));
            }
        })

    })

    describe('when the input is of category "month of year"', ()=> {

        it("should handle an ISO month", ()=> {
            // Arrange
            const dateTypeToTest: AmazonDotDateCategory = "month of year";
            const theLib = new AlexaDateConverter();
            const input = "2019-12"
            // red-herring check
            expect(theLib.classifyAmazonDotDate(input)).toEqual(dateTypeToTest);

            // Act
            const result = theLib.convertToDay(input);

            // Assert
            expect(result.toString()).toEqual("2019-12-01");
        })

        it("should not handle ISO month that go over the month number", ()=> {
            // Arrange
            const theLib = new AlexaDateConverter();
            const input = "2019-13"

            // Act
            let errorToTest: Error | null = null;
            try {
                theLib.convertToDay(input);
            } catch(err){
                errorToTest = err as Error;
            } finally {
                expect(errorToTest).toEqual(new Error("2019-13 was not a valid date string."));
            }
        })

    })

    describe('when the input is of category "season"', ()=> {

        it("should find the day that is the meteorological first day of summer for that year (with default season dictionary)", ()=> {
            // Arrange
            const dateTypeToTest: AmazonDotDateCategory = "season";
            const theLib = new AlexaDateConverter();
            const seasonToUse: AmazonDotDateSeason = "SU";
            const input = `2009-${seasonToUse}`;
            // red-herring check
            expect(theLib.classifyAmazonDotDate(input)).toEqual(dateTypeToTest);

            // Act
            const result = theLib.convertToDay(input);

            // Assert
            expect(result.toString()).toEqual("2009-06-01");
        })

        it("should find the day that is the meteorological first day of summer for that year (with overridden season dictionary)", ()=> {
            // Arrange
            const dateTypeToTest: AmazonDotDateCategory = "season";
            const strangelyShortSeasons: StartOfSeasonDictionary = {
                // tslint:disable-next-line: no-magic-numbers
                SP: MonthDay.of(Month.JANUARY, 5),
                // tslint:disable-next-line: no-magic-numbers
                SU: MonthDay.of(Month.JANUARY, 10),
                // tslint:disable-next-line: no-magic-numbers
                FA: MonthDay.of(Month.JANUARY, 15),
                // tslint:disable-next-line: no-magic-numbers
                WI: MonthDay.of(Month.JANUARY, 20),
            }
            const theLib = new AlexaDateConverter({
                startOfSeasonDictionary: strangelyShortSeasons
            });
            const seasonToUse: AmazonDotDateSeason = "SU";
            const input = `2009-${seasonToUse}`;
            // red-herring check
            expect(theLib.classifyAmazonDotDate(input)).toEqual(dateTypeToTest);

            // Act
            const result = theLib.convertToDay(input);

            // Assert
            expect(result.toString()).toEqual("2009-01-10");
        })

        it("should find the day that is the meteorological first day of summer for that year (with southern hemisphere season dictionary)", ()=> {
            // Arrange
            const dateTypeToTest: AmazonDotDateCategory = "season";
            const theLib = new AlexaDateConverter({
                startOfSeasonDictionary: southernMeteorologicalSeasonStarts
            });
            const seasonToUse: AmazonDotDateSeason = "SU";
            const input = `2009-${seasonToUse}`;
            // red-herring check
            expect(theLib.classifyAmazonDotDate(input)).toEqual(dateTypeToTest);

            // Act
            const result = theLib.convertToDay(input);

            // Assert
            expect(result.toString()).toEqual("2009-02-01");
        })

        it("should not handle a season string if the 2 char season is not correct and for some strange reason Alexa chose to send in bad data", ()=> {
            // Arrange
            const theLib = new AlexaDateConverter();
            const input = "2019-FL"

            // Act
            let errorToTest: Error | null = null;
            try {
                theLib.convertToDay(input);
            } catch(err){
                errorToTest = err as Error;
            } finally {
                expect(errorToTest).toEqual(new Error("2019-FL was not a valid date string."));
            }
        })

    })

    describe('when the input is of category "decade"', ()=> {

        it("should generate the first day of the decade", ()=> {
            // Arrange
            const dateTypeToTest: AmazonDotDateCategory = "decade";
            const theLib = new AlexaDateConverter();
            const input = `200X`;
            // red-herring check
            expect(theLib.classifyAmazonDotDate(input)).toEqual(dateTypeToTest);

            // Act
            const result = theLib.convertToDay(input);

            // Assert
            expect(result.toString()).toEqual("2000-01-01");
        })

        it("should not handle a century since that's not a decade", ()=> {
            // Arrange
            const theLib = new AlexaDateConverter();
            const input = "20XX"

            // Act
            let errorToTest: Error | null = null;
            try {
                theLib.convertToDay(input);
            } catch(err){
                errorToTest = err as Error;
            } finally {
                expect(errorToTest).toEqual(new Error("20XX was not a valid date string."));
            }
        })

    })

    describe('when the input is of category "year"', ()=> {

        it("should handle a 4 digit year", ()=> {
            // Arrange
            const dateTypeToTest: AmazonDotDateCategory = "year";
            const theLib = new AlexaDateConverter();
            const input = "2019"
            // red-herring check
            expect(theLib.classifyAmazonDotDate(input)).toEqual(dateTypeToTest);

            // Act
            const result = theLib.convertToDay(input);

            // Assert
            expect(result.toString()).toEqual("2019-01-01");
        })

        it("should not handle 2 digit years since those don't follow the ISO standard (And therefore Alexa shouldn't send them)", ()=> {
            // Arrange
            const theLib = new AlexaDateConverter();
            const input = "19"

            // Act
            let errorToTest: Error | null = null;
            try {
                theLib.convertToDay(input);
            } catch(err){
                errorToTest = err as Error;
            } finally {
                expect(errorToTest).toEqual(new Error("19 was not a valid date string."));
            }
        })

    })
})