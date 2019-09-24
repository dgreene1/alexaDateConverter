import { AlexaDateConverter } from "./index";
import { DayOfWeek } from "js-joda";

class ProtectedMethodsTestRunner extends AlexaDateConverter {

    public runTests(): void {

        describe('deprecated options', ()=> {
            it("should warn about startOfWeek", ()=>{
                const spyOfConsoleWarn = jest.spyOn(console, 'warn');

                // Act
                new AlexaDateConverter({
                    startOfWeek: DayOfWeek.TUESDAY
                })

                // Assert
                expect(spyOfConsoleWarn).toHaveBeenCalledWith("options.startOfWeek is deprecated since ISO-8601 specifies that weeks start on Monday");
            })
        })

        describe('convertIsoWeekToLocalDate', ()=>{

            it('should throw if something has more than a week (for example,like a weekend string)', ()=>{
                const aWeekendString = "2009-W01-WE";

                // Act
                let exceptionToTest: Error | null = null;
                try {
                    this.convertIsoWeekToLocalDate(aWeekendString);
                } catch(err){
                    exceptionToTest = err;
                }

                // Assert
                expect(exceptionToTest).toEqual(new Error(`Something went wrong in classifyAmazonDotDate since 2009-W01-WE did not exclusively match YYYY-WXX pattern`));
            })

            it('should throw if someone hand-writes a week string and thinks that weeks are zero indexed (the first week is actually W01)', ()=>{
                const aWeekendString = "2009-W00";

                // Act
                let exceptionToTest: Error | null = null;
                try {
                    this.convertIsoWeekToLocalDate(aWeekendString);
                } catch(err){
                    exceptionToTest = err;
                }

                // Assert
                expect(exceptionToTest).toEqual(new Error(`Incorrect date string. The week number for ISO weeks starts on 1, but we derived 0 for the week section of "2009-W00"`));
            })

            it('should throw if someone hand-writes a week string and and does not prefix the week section with a W', ()=>{
                const aWeekendString = "2009-BAD";

                // Act
                let exceptionToTest: Error | null = null;
                try {
                    this.convertIsoWeekToLocalDate(aWeekendString);
                } catch(err){
                    exceptionToTest = err;
                }

                // Assert
                expect(exceptionToTest).toEqual(new Error(`Something went wrong with getting the number from the week portion ("BAD") of "2009-BAD"`));
            })

        })

        describe('convertIsoWeekendToLocalDate', ()=>{

            it('should throw if the input has more than a weekend string', ()=>{
                const aWeekendString = "2009-W01-WE-otherStuff";

                // Act
                let exceptionToTest: Error | null = null;
                try {
                    this.convertIsoWeekendToLocalDate(aWeekendString);
                } catch(err){
                    exceptionToTest = err;
                }

                // Assert
                expect(exceptionToTest).toEqual(new Error(`Something went wrong in classifyAmazonDotDate since 2009-W01-WE-otherStuff did not exclusively match YYYY-WXX-WE pattern`));
            })

            it('should throw if the input does not have the WE phrase as the third component', ()=>{
                const aWeekendString = "2009-W01-BAD";

                // Act
                let exceptionToTest: Error | null = null;
                try {
                    this.convertIsoWeekendToLocalDate(aWeekendString);
                } catch(err){
                    exceptionToTest = err;
                }

                // Assert
                expect(exceptionToTest).toEqual(new Error(`Something went wrong in classifyAmazonDotDate since 2009-W01-BAD did not exclusively match YYYY-WXX-WE pattern`));
            })
        })

        describe("convertYearStrToLocalDate", ()=> {

            it("should throw if the input is not a year", ()=> {
                const aWeekendString = "-100";

                // Act
                let exceptionToTest: Error | null = null;
                try {
                    this.convertYearStrToLocalDate(aWeekendString);
                } catch(err){
                    exceptionToTest = err;
                }

                // Assert
                expect(exceptionToTest).toEqual(new Error(`The string -100 was not actually a year string since it didn't exclusively match the YYYY pattern`));
            })
        })

        describe("convertSeasonStrToLocalDate", ()=> {

            it("should throw if the input is more than a season", ()=> {
                const aWeekendString = "2001-SU-bad";

                // Act
                let exceptionToTest: Error | null = null;
                try {
                    this.convertSeasonStrToLocalDate(aWeekendString);
                } catch(err){
                    exceptionToTest = err;
                }

                // Assert
                expect(exceptionToTest).toEqual(new Error(`Something went wrong in classifyAmazonDotDate since 2001-SU-bad did not exclusively match YYYY-SS pattern`));
            })

            it("should throw if the input has an invalid season", ()=> {
                const aWeekendString = "2001-XX";

                // Act
                let exceptionToTest: Error | null = null;
                try {
                    this.convertSeasonStrToLocalDate(aWeekendString);
                } catch(err){
                    exceptionToTest = err;
                }

                // Assert
                expect(exceptionToTest).toEqual(new Error(`Expected the season portion ("XX") of the input ("2001-XX") to be one of the following: FA, SP, SU, WI`));
            })
        })
    }
}


new ProtectedMethodsTestRunner().runTests();