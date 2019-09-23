import { LocalDate, DayOfWeek, ChronoField } from "js-joda";

/**
 * returns 0 if the startingPoint is the day of the week you requested with weekday. Or it returns a positive integer (1-6) for how many days till that next DayOfWeek
 * @param startingPoint
 * @param weekday
 */
export function daysDelta(startingPoint: LocalDate, weekday: DayOfWeek): number {
    const startingPointDayOfWeek = startingPoint.dayOfWeek();

    if(startingPointDayOfWeek === weekday){
        return 0;
    } else {
        return weekday.get(ChronoField.DAY_OF_WEEK) - startingPointDayOfWeek.get(ChronoField.DAY_OF_WEEK);
    }
}