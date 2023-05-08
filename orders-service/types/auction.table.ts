export type AuctionType = {
    Id: string,
    Title: string,
    Status: string,
    CreatedAt: Date,
    HighestBidAmount?: number,
    EndingAt: string,
    Seller: string,
    PictureUrl?: string,
    Points?: 0,
    Quantity?: number,
} 