interface UserParameters {
  id: string;
  firstName: string;
  lastName: string;
  verified: boolean;
  email: string;
  userType: string;
  createdOn: string;
  updatedOn?: string;
}
class UserEntity {
  id: string;
  firstName: string;
  lastName: string;
  verified: boolean;
  email: string;
  userType: string;
  createdOn: string;
  updatedOn: string;

  constructor({
    id,
    firstName,
    lastName,
    verified,
    email,
    userType,
    createdOn,
    updatedOn,
  }: UserParameters) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.verified = verified;
    this.email = email;
    this.userType = userType;
    this.updatedOn = updatedOn ?? "";

    this.createdOn = createdOn;
  }

  key(): {
    PK: string;
    SK: string;
  } {
    return {
      PK: `USER#${this.email}`,
      SK: `USER#${this.email}`,
    };
  }

  toItem() {
    return {
      ...this.key(),
      id: this.id,
      ENTITY: "USER",
      firstName: this.firstName,
      lastName: this.lastName,
      verified: this.verified,
      email: this.email,
      userType: this.userType,
      updatedOn: this.updatedOn,
      createdOn: this.createdOn,
    };
  }

  graphQlReturn() {
    return {
      id: this.id,
      ENTITY: "USER",
      firstName: this.firstName,
      lastName: this.lastName,
      verified: this.verified,
      email: this.email,
      userType: this.userType,
      updatedOn: this.updatedOn,
      createdOn: this.createdOn,
    };
  }
}

export default UserEntity;
