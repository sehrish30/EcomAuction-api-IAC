interface IBookingParameters {
    id: string;
    userId: string;
    apartmentId: string;
    startDate: string;
    endDate: string;
    bookingStatus: string;
    createdOn: string;
  }
  
  export class BookingEntity {
    id: string;
    userId: string;
    apartmentId: string;
    startDate: string;
    endDate: string;
    bookingStatus: string;
    createdOn: string;
  
    constructor({
      id,
      userId,
      startDate,
      apartmentId,
      endDate,
      bookingStatus,
      createdOn,
    }: IBookingParameters) {
      this.id = id;
      this.userId = userId;
      this.apartmentId = apartmentId;
      this.startDate = startDate;
      this.endDate = endDate;
      this.bookingStatus = bookingStatus;
      this.createdOn = createdOn;
    }
  
    key() {
      return {
        PK: `APARTMENT#${this.apartmentId}`,
        SK: `BOOKING#${this.id}`,
      };
    }
    gsi1Key() {
      return {
        GSI1PK: `USER#${this.userId}`,
        GSI1SK: `APARTMENT#${this.apartmentId}`,
      };
    }
  
    toItem() {
      return {
        ...this.key(),
        ...this.gsi1Key(),
        ENTITY: "BOOKING",
        id: this.id,
        userId: this.userId,
        apartmentId: this.apartmentId,
        startDate: this.startDate,
        endDate: this.endDate,
        bookingStatus: this.bookingStatus,
        createdOn: this.createdOn,
      };
    }
  
    graphQlReturn() {
      return {
        id: this.id,
        userId: this.userId,
        apartmentId: this.apartmentId,
        startDate: this.startDate,
        endDate: this.endDate,
        bookingStatus: this.bookingStatus,
        createdOn: this.createdOn,
      };
    }
  }