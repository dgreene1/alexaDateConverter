import { LocalDate, DayOfWeek } from "js-joda"
import { daysDelta } from "./weekOfYearMath";

describe('daysDelta', ()=>{

    it('should produce 0 for Thursday to Thursday', ()=> {
        // Arrange
        const firstThursdayOfJan2009 = LocalDate.of(2009,1,1);
        // red-herring check
        expect(firstThursdayOfJan2009.dayOfWeek()).toEqual(DayOfWeek.THURSDAY);
        const sameDayOfWeek = DayOfWeek.THURSDAY;

        // Act
        const result = daysDelta(firstThursdayOfJan2009, sameDayOfWeek);

        // Assert
        expect(result).toEqual(0);
    })
    it('should produce 0 for Thursday to Saturday', ()=> {
        // Arrange
        const firstThursdayOfJan2009 = LocalDate.of(2009,1,1);
        // red-herring check
        expect(firstThursdayOfJan2009.dayOfWeek()).toEqual(DayOfWeek.THURSDAY);
        const twoDaysLater = DayOfWeek.SATURDAY;

        // Act
        const result = daysDelta(firstThursdayOfJan2009, twoDaysLater);

        // Assert
        expect(result).toEqual(2);
    })
})