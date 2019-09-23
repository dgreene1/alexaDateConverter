import { AlexaDateConverter, AmazonDotDateCategory, AmazonDotDateSeason, StartOfSeasonDictionary } from "./index";
import { DayOfWeek, MonthDay, Month } from "js-joda";

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

        it("should handle an ISO week (with default startOfWeek being Monday)", ()=> {
            // Arrange
            const dateTypeToTest: AmazonDotDateCategory = "specific week";
            const theLib = new AlexaDateConverter();
            const input = "2009-W01"
            // red-herring check
            expect(theLib.classifyAmazonDotDate(input)).toEqual(dateTypeToTest);

            // Act
            const result = theLib.convertToDay(input);

            // Assert
            expect(result.toString()).toEqual("2009-01-05");
        })

        it("should handle an ISO week (with an overridden startOfWeek set to Tuesday)", ()=> {
            // Arrange
            const dateTypeToTest: AmazonDotDateCategory = "specific week";
            const theLib = new AlexaDateConverter({
                startOfWeek: DayOfWeek.TUESDAY
            });
            const input = "2009-W01"
            // red-herring check
            expect(theLib.classifyAmazonDotDate(input)).toEqual(dateTypeToTest);

            // Act
            const result = theLib.convertToDay(input);

            // Assert
            expect(result.toString()).toEqual("2009-01-06");
        })


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

        it("should handle an ISO weekend (with default startOfWeek being Monday (and being ignored since we're considering the weekend))", ()=> {
            // Arrange
            const dateTypeToTest: AmazonDotDateCategory = "weekend for a specific week";
            const theLib = new AlexaDateConverter();
            const input = "2009-W01-WE"
            // red-herring check
            expect(theLib.classifyAmazonDotDate(input)).toEqual(dateTypeToTest);

            // Act
            const result = theLib.convertToDay(input);

            // Assert
            expect(result.toString()).toEqual("2009-01-10");
        })

        it("should handle an ISO weekend (with an overridden startOfWeek set to Tuesday (and being ignored since we're considering the weekend))", ()=> {
            // Arrange
            const dateTypeToTest: AmazonDotDateCategory = "weekend for a specific week";
            const theLib = new AlexaDateConverter({
                startOfWeek: DayOfWeek.TUESDAY
            });
            const input = "2009-W01-WE"
            // red-herring check
            expect(theLib.classifyAmazonDotDate(input)).toEqual(dateTypeToTest);

            // Act
            const result = theLib.convertToDay(input);

            // Assert
            expect(result.toString()).toEqual("2009-01-10");
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
                SP: MonthDay.of(Month.JANUARY, 5),
                SU: MonthDay.of(Month.JANUARY, 10),
                FA: MonthDay.of(Month.JANUARY, 15),
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