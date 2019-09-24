import { LocalDate, Month, DayOfWeek, YearMonth, Year, MonthDay, IsoFields } from 'js-joda'
import { assertUnreachable } from './helpers/neverCheckers';

export type AmazonDotDateSeason = "WI" | "SP" | "SU" | "FA";

/**
 * The possible scenarios that can come back from an AMAZON.DATE value
 * @see https://developer.amazon.com/docs/custom-skills/slot-type-reference.html#date
 */
export type AmazonDotDateCategory = 'specific day' | 'specific week' | 'weekend for a specific week' | 'month of year' | 'year' | 'decade' | 'season';

export type StartOfSeasonDictionary = {
    [aSeasonStringLiteral in AmazonDotDateSeason]: MonthDay;
};

export const northernMeteorologicalSeasonStarts : Readonly<StartOfSeasonDictionary> = {
    SP: MonthDay.of(Month.MARCH, 1),
    SU: MonthDay.of(Month.JUNE, 1),
    FA: MonthDay.of(Month.SEPTEMBER, 1),
    WI: MonthDay.of(Month.DECEMBER, 1)
}

export const southernMeteorologicalSeasonStarts : Readonly<StartOfSeasonDictionary> = {
    SP: MonthDay.of(Month.SEPTEMBER, 1),
    SU: MonthDay.of(Month.FEBRUARY, 1),
    FA: MonthDay.of(Month.MARCH, 1),
    WI: MonthDay.of(Month.JUNE, 1)
}

export class AlexaDateConverter {

    /**
     * alias for northernMeteorologicalSeasonStarts
     */
    public defaultMeteorologicalSeasonStarts = northernMeteorologicalSeasonStarts;
    private meteorologicalSeasonStarts: StartOfSeasonDictionary;

    public defaultStartOfWeek = DayOfWeek.MONDAY;

    constructor(options?: {
        startOfSeasonDictionary?: StartOfSeasonDictionary,
        /**
         * DEPRECATED. Weeks in ISO-8601 always start on Monday
         */
        startOfWeek?: DayOfWeek
    }){
        if(options && options.startOfSeasonDictionary){
            this.meteorologicalSeasonStarts = options.startOfSeasonDictionary
        } else {
            this.meteorologicalSeasonStarts = this.defaultMeteorologicalSeasonStarts;
        }

        if(options && options.startOfWeek){
            // tslint:disable-next-line: no-console
            console.warn(`options.startOfWeek is deprecated since ISO-8601 specifies that weeks start on Monday`);
        }
    }

    /**
     * Tells you if strToTry fits the ISO pattern for YYYY-MM
     * @param strToTry
     */
    private isMonthStr(strToTry: string): boolean {
        return /^([0-9]{4})-(1[0-2]|0[1-9])$/.test(strToTry)
    }

    /**
     * Tells you if strToTry fits the ISO pattern for YYYY-MM-DD
     * @param strToTry
     */
    private isDayStr(strToTry: string): boolean {
        return /^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$/.test(strToTry)
    }

    private allSeasons: AmazonDotDateSeason[] = (()=>{
        const allSeasonsDict : Record<AmazonDotDateSeason, true> = {
            FA: true,
            SP: true,
            SU: true,
            WI: true
        }

        return Object.keys(allSeasonsDict) as AmazonDotDateSeason[];
    })();

    private isYearStr(amazonDateStr: string): boolean {
        return /^([12]\d{3})$/.test(amazonDateStr);
    }

    /**
     * Tells you if strToTry fits the ISO pattern for YYYY-MM-DD
     * @param strToTry
     */
    private isAmazonDotDateSeason(strToTry: string): strToTry is AmazonDotDateSeason {
        const innocentUntilGuilty = strToTry as AmazonDotDateSeason;
        if(this.allSeasons.includes(innocentUntilGuilty)) {
            return true;
        } else {
            return false;
        }
    }

    private isAmazonDotDateSeasonAndYear(strToTry: string): boolean {
        const [ yearStr, seasonStr, ...accidentalExtras ] = strToTry.split("-");

        if(accidentalExtras.length){
            return false;
        }

        return this.isYearStr(yearStr) && this.isAmazonDotDateSeason(seasonStr)
    }

    private amazonDotDateMatchers : Record<AmazonDotDateCategory, (stringToTry: string)=> boolean> = {
        "specific day": (stringToTry) => this.isDayStr(stringToTry),
        "specific week": (stringToTry) => /^([0-9]{4})-W([0-4][1-9]|5[0-3])$/.test(stringToTry),
        "weekend for a specific week": (stringToTry) => /^([0-9]{4})-W([0-4][1-9]|5[0-3])-WE$/.test(stringToTry),
        "month of year": (stringToTry) => this.isMonthStr(stringToTry),
        "year": (stringToTry) => this.isYearStr(stringToTry),
        "decade": (stringToTry) => /^([0-9]{3})X$/.test(stringToTry),
        "season": (stringToTry) => this.isAmazonDotDateSeasonAndYear(stringToTry)
    }

    public classifyAmazonDotDate(amazonDateStr: string): AmazonDotDateCategory | null {

        const match = Object.keys(this.amazonDotDateMatchers).find((category) => {
            const categoryStrict = category as AmazonDotDateCategory;
            const predicate = this.amazonDotDateMatchers[categoryStrict];

            return predicate(amazonDateStr);
        });

        if(match){
            return match as AmazonDotDateCategory;
        } else {
            return null;
        }
    }

    protected convertIsoWeekToLocalDate(amazonDateStr: string): LocalDate {
        // for example, the first week of 2019 would be expressed as "2009-W01". Read more here: https://en.wikipedia.org/wiki/ISO_week_date
        const [yearStr, weekStr, ...accidentalExtras] = amazonDateStr.split("-");
        if(accidentalExtras.length){
            throw new Error(`Something went wrong in classifyAmazonDotDate since ${amazonDateStr} did not exclusively match YYYY-WXX pattern`);
        }
        const yearNum = parseInt(yearStr);
        const [,weekStrCleaned] = weekStr.split("W");
        if(!weekStrCleaned){
            throw new Error(`Something went wrong with getting the number from the week portion ("${weekStr}") of "${amazonDateStr}"`);
        }
        const weekNum = parseInt(weekStrCleaned);
        if(weekNum < 1){
            throw new Error(`Incorrect date string. The week number for ISO weeks starts on 1, but we derived ${weekNum} for the week section of "${amazonDateStr}"`)
        }

        const firstDayOfThatYear = LocalDate.MIN.with(IsoFields.WEEK_BASED_YEAR, yearNum);
        const firstDayOfThatWeek = firstDayOfThatYear.with(IsoFields.WEEK_OF_WEEK_BASED_YEAR, weekNum);

        return firstDayOfThatWeek;
    }

    protected convertIsoWeekendToLocalDate(amazonDateStr: string): LocalDate {
        // for example: "2015-W49-WE";
        const [yearStr, weekStr, weekendSignifier, ...accidentalExtras] = amazonDateStr.split("-");
        if(weekendSignifier !== "WE" || accidentalExtras.length){
            throw new Error(`Something went wrong in classifyAmazonDotDate since ${amazonDateStr} did not exclusively match YYYY-WXX-WE pattern`);
        }
        const isoWeekString = `${yearStr}-${weekStr}`;

        const justTheWeek = this.convertIsoWeekToLocalDate(isoWeekString);

        // Since every ISO week starts on a Monday, we can simply add 5 days to get to the weekend
        const daysBetweenMondayAndSaturday = 5;
        const saturday = justTheWeek.plusDays(daysBetweenMondayAndSaturday);
        return saturday;
    }

    protected convertYearStrToLocalDate(amazonDateStr: string): LocalDate {
        // Guard
        const category = this.classifyAmazonDotDate(amazonDateStr);

        if(category !== "year"){
            throw new Error(`The string ${amazonDateStr} was not actually a year string since it didn't exclusively match the YYYY pattern`)
        }

        // Convert
        return Year.parse(amazonDateStr).atMonth(Month.JANUARY).atDay(1)
    }

    protected convertSeasonStrToLocalDate(amazonDateStr: string): LocalDate {
        // Convert
        // For example, an utterance of "next winter" would be sent to us as "2017-WI" from Alexa
        const [ yearStr, seasonStr, ...accidentalExtras ] = amazonDateStr.split("-");
        if(accidentalExtras.length){
            throw new Error(`Something went wrong in classifyAmazonDotDate since ${amazonDateStr} did not exclusively match YYYY-SS pattern`);
        }
        if(!this.isAmazonDotDateSeason(seasonStr)){
            throw new Error(`Expected the season portion ("${seasonStr}") of the input ("${amazonDateStr}") to be one of the following: ${this.allSeasons.join(', ')}`)
        }
        const dayAtStartOfYear = this.convertYearStrToLocalDate(yearStr);
        const startOfSeason = this.meteorologicalSeasonStarts[seasonStr].atYear(dayAtStartOfYear.year());
        const untilThatSeason = dayAtStartOfYear.until(startOfSeason);
        const adjustedDay = dayAtStartOfYear.plus(untilThatSeason);
        return adjustedDay;
    }

    /**
     * Converts an AMAZON.DATE value to a more usable type
     * @see https://developer.amazon.com/docs/custom-skills/slot-type-reference.html#date
     */
    public convertToDay(amazonDateStr: string): LocalDate {

        const dayType = this.classifyAmazonDotDate(amazonDateStr);

        switch(dayType){
            case null: {
                throw new Error(`${amazonDateStr} was not a valid date string.`);
            }
            case 'specific day': {
                return LocalDate.parse(amazonDateStr);
            }
            case 'specific week': {
                return this.convertIsoWeekToLocalDate(amazonDateStr);
            }
            case 'weekend for a specific week': {
                return this.convertIsoWeekendToLocalDate(amazonDateStr);
            }
            case 'month of year': {
                return YearMonth.parse(amazonDateStr).atDay(1);
            }
            case 'year': {
                return this.convertYearStrToLocalDate(amazonDateStr);
            }
            case 'decade': {
                // for example, "201X" signifies the decade that started in 2010
                const asYearStr = amazonDateStr.replace("X", "0");
                return this.convertYearStrToLocalDate(asYearStr);
            }
            case 'season': {
                return this.convertSeasonStrToLocalDate(amazonDateStr);
            }
            default: {
                return assertUnreachable(dayType);
            }
        }
    }
}