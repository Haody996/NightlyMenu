declare global {
  namespace Express {
    interface Request {
      userId: number;
      householdId: number;
    }
  }
}
export {};
