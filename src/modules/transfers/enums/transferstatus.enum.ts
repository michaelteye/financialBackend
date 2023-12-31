export enum TRANSFER_STATUS_CODE {
    SUCCESS = "00",
    INSUFFICIENT_BALANCE = "03",
    WITHDRAWAL_NOT_ALLOWED = "11",
    DEPOSIT_NOT_ALLOWED = "12",
    DEPOSIT_LIMIT_EXCEEDED = "13",
    WITHDRAWAL_LIMIT_EXCEEDED = "14",
    ACCOUNT_NOT_FOUND = "15",
    ERROR = "99"
}