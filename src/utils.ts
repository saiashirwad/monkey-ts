export type ValueOf<T> = T[keyof T];

export const objectKeys = <T extends {}>(obj: T): (keyof T)[] => {
  return Object.keys(obj) as (keyof T)[];
};

export const objectValues = <T extends {}>(obj: T): ValueOf<T>[] => {
  return Object.values(obj) as ValueOf<T>[];
};

