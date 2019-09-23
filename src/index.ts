import { LocalDate, Month, DayOfWeek, YearMonth, Year, MonthDay, ChronoUnit } from 'js-joda'
import { assertUnreachable } from './helpers/neverCheckers';
import { daysDelta } from './helpers/weekOfYearMath';

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
    private startOfWeek: DayOfWeek;

    constructor(options?: {
        startOfSeasonDictionary?: StartOfSeasonDictionary,
        startOfWeek?: DayOfWeek
    }){
        if(options && options.startOfSeasonDictionary){
            this.meteorologicalSeasonStarts = options.startOfSeasonDictionary
        } else {
            this.meteorologicalSeasonStarts = this.defaultMeteorologicalSeasonStarts;
        }

        if(options && options.startOfWeek){
            this.startOfWeek = options.startOfWeek
        } else {
            this.startOfWeek = this.defaultStartOfWeek;
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
        "specific week": (stringToTry) => /^([0-9]{4})-W([0-4][1-9]|5[0-2])$/.test(stringToTry),
        "weekend for a specific week": (stringToTry) => /^([0-9]{4})-W([0-4][1-9]|5[0-2])-WE$/.test(stringToTry),
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

    private convertIsoWeekToLocalDate(amazonDateStr: string): LocalDate {
        // Guard
        const category = this.classifyAmazonDotDate(amazonDateStr);

        if(category !== "specific week"){
            throw new Error(`The string was not actually an ISO week string since it didn't exclusively match the YYYY-WXX pattern`)
        }

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
            throw new Error(`The week number for ISO weeks starts on 1, but we derived ${weekNum} for the week section of "${amazonDateStr}"`)
        }

        const startOfYear = LocalDate.of(yearNum, Month.JANUARY, 1);

        if(DayOfWeek.from(startOfYear) === this.startOfWeek){
            return startOfYear.plusWeeks(weekNum);
        } else {
            const daysTillStartOfNextWeek = daysDelta(startOfYear, this.startOfWeek);
            return startOfYear.plus(daysTillStartOfNextWeek, ChronoUnit.DAYS).plusWeeks(weekNum);
        }
    }

    private convertIsoWeekendToLocalDate(amazonDateStr: string): LocalDate {
        // Guard
        const category = this.classifyAmazonDotDate(amazonDateStr);

        if(category !== "weekend for a specific week"){
            throw new Error(`The string was not actually a weekend string since it didn't exclusively match the YYYY-WXX-WE pattern`)
        }

        // for example: "2015-W49-WE";
        const [yearStr, weekStr, weekendSignifier] = amazonDateStr.split("-");
        if(weekendSignifier !== "WE"){
            throw new Error(`Something went wrong in classifyAmazonDotDate since ${amazonDateStr} did not exclusively match YYYY-WXX-WE pattern`);
        }
        const isoWeekString = `${yearStr}-${weekStr}`;

        const justTheWeek = this.convertIsoWeekToLocalDate(isoWeekString);

        const daysTillStartOfNextWeekend = daysDelta(justTheWeek, DayOfWeek.SATURDAY);
        return justTheWeek.plus(daysTillStartOfNextWeekend, ChronoUnit.DAYS);
    }

    private convertYearStrToLocalDate(amazonDateStr: string): LocalDate {
        // Guard
        const category = this.classifyAmazonDotDate(amazonDateStr);

        if(category !== "year"){
            throw new Error(`The string was not actually a weekend string since it didn't exclusively match the YYYY-WXX-WE pattern`)
        }

        // Convert
        return Year.parse(amazonDateStr).atMonth(Month.JANUARY).atDay(1)
    }

    private convertSeasonStrToLocalDate(amazonDateStr: string): LocalDate {
        // Guard
        const category = this.classifyAmazonDotDate(amazonDateStr);

        if(category !== "season"){
            throw new Error(`The string was not actually a weekend string since it didn't exclusively match the YYYY-SS pattern`)
        }

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