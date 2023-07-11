import ksuid from "ksuid";

export const uuid = (): string => {
  return ksuid.randomSync().string;
};
