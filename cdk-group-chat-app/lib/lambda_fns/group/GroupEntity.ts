interface GroupParameters {
    id: string;
    userId: string;
    name: string;
    description: string;
    createdOn: number;
  }
  class GroupEntity {
    id: string;
    userId: string;
    name: string;
    description: string;
    createdOn: number;
  
    constructor({
      id,
      userId,
      name,
      description,
  
      createdOn,
    }: GroupParameters) {
      this.id = id;
  
      this.userId = userId;
      this.name = name;
  
      this.description = description;
  
      this.createdOn = createdOn;
    }
  
    key(): {
      PK: string;
      SK: string;
    } {
      return {
        PK: `GROUP#${this.id}`,
        SK: `GROUP#${this.id}`,
      };
    }
    gsi1Key(): {
      GSI1PK: string;
      GSI1SK: string;
    } {
      return {
        GSI1PK: `USER#${this.userId}`,
        GSI1SK: `GROUP#${this.id}`,
      };
    }
  
    toItem() {
      return {
        ...this.key(),
        ...this.gsi1Key(),
        id: this.id,
        ENTITY: "GROUP",
  
        userId: this.userId,
        name: this.name,
        description: this.description,
  
        createdOn: this.createdOn,
      };
    }
  
    graphQlReturn() {
      return {
        id: this.id,
        userId: this.userId,
        name: this.name,
        description: this.description,
        createdOn: this.createdOn,
      };
    }
  }
  
  export default GroupEntity;