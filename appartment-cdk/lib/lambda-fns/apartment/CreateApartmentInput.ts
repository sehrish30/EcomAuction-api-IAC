type CreateApartmentInput = {
  input: {
    apartmentNumber: string;
    buildingId: string;
    numberOfRooms: number;
    apartmentType: string;
    apartmentStatus: string;
    kitchen: boolean;
  };
};
export default CreateApartmentInput;
